import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeGeneratedSkills } from './generate-skills.js'
import {
  isCommitSha,
  listFiles,
  loadDistribution,
  loadUpstream,
  readJson,
  relativeFile,
  sha256File,
  writeJson,
  type UpstreamFileEntry,
  type UpstreamManifest,
} from './lib/common.js'

const DEFAULT_REPOSITORY = 'https://github.com/botpress/skills'
const DEFAULT_BRANCH = 'master'

function removeTemporaryTree(directory: string): void {
  if (process.platform === 'win32' && existsSync(directory)) {
    const makeWritable = (current: string): void => {
      chmodSync(current, 0o777)
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name)
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) makeWritable(absolute)
        else chmodSync(absolute, 0o666)
      }
    }
    makeWritable(directory)
  }
  rmSync(directory, { recursive: true, force: true })
}

function git(directory: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: directory,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024,
  }).trim()
}

export function assertCommit(value: string): string {
  const commit = value.trim().toLowerCase()
  if (!isCommitSha(commit)) throw new Error('Expected a full 40-character upstream commit SHA')
  return commit
}

export function latestMasterCommit(repository = DEFAULT_REPOSITORY, branch = DEFAULT_BRANCH): string {
  const output = git(process.cwd(), ['ls-remote', repository, `refs/heads/${branch}`])
  const line = output.split(/\r?\n/).find(Boolean)
  if (!line) throw new Error(`Could not resolve upstream branch ${branch}`)
  return assertCommit(line.split(/\s+/)[0])
}

export interface TagRef {
  tag: string
  targetCommit: string
}

export function parseTagRefs(output: string): TagRef[] {
  const direct = new Map<string, string>()
  const dereferenced = new Map<string, string>()
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue
    const [sha, ref] = line.trim().split(/\s+/)
    if (!isCommitSha(sha) || !ref?.startsWith('refs/tags/')) continue
    if (ref.endsWith('^{}')) dereferenced.set(ref.slice('refs/tags/'.length, -3), sha.toLowerCase())
    else direct.set(ref.slice('refs/tags/'.length), sha.toLowerCase())
  }
  return [...direct.keys()].sort().map((tag) => ({
    tag,
    targetCommit: dereferenced.get(tag) ?? direct.get(tag)!,
  }))
}

export function tagForCommit(repository: string, commit: string, preferredTag?: string): string | null {
  const output = git(process.cwd(), ['ls-remote', '--tags', repository])
  const candidates = parseTagRefs(output).filter((entry) => entry.targetCommit === commit)
  if (preferredTag && candidates.some((entry) => entry.tag === preferredTag)) return preferredTag
  const versionTags = candidates.map((entry) => entry.tag).filter((tag) => /^v\d+\.\d+\.\d+/.test(tag)).sort()
  return versionTags.at(-1) ?? candidates[0]?.tag ?? null
}

function fetchUpstream(root: string, repository: string, commit: string): string {
  const temporary = mkdtempSync(path.join(root, '.tmp-upstream-'))
  try {
    git(temporary, ['init', '--quiet'])
    git(temporary, ['config', 'core.autocrlf', 'false'])
    git(temporary, ['config', 'core.eol', 'lf'])
    git(temporary, ['remote', 'add', 'upstream', repository])
    git(temporary, ['fetch', '--quiet', '--depth', '1', 'upstream', commit])
    git(temporary, ['checkout', '--quiet', '--detach', 'FETCH_HEAD'])
    const actual = git(temporary, ['rev-parse', 'HEAD']).toLowerCase()
    if (actual !== commit) throw new Error(`Fetched upstream HEAD ${actual} does not match requested ${commit}`)
    return temporary
  } catch (error) {
    removeTemporaryTree(temporary)
    throw error
  }
}

export function buildUpstreamManifest(
  sourceRoot: string,
  distributionVersion: string,
  commit: string,
  tag: string | null,
): UpstreamManifest {
  const plugin = readJson<{ version: string }>(path.join(sourceRoot, '.claude-plugin', 'plugin.json'))
  const skillsMetadata = readJson<{ 'adk-version': string }>(path.join(sourceRoot, 'skills.json'))
  if (plugin.version !== skillsMetadata['adk-version']) throw new Error('Upstream plugin and skills.json versions disagree')
  const skillFiles = listFiles(path.join(sourceRoot, 'skills'))
  const commandFiles = listFiles(path.join(sourceRoot, 'commands')).filter((file) => file.endsWith('.md') && !file.includes('/'))
  const skillInventory = skillFiles
    .filter((file) => file.endsWith('/SKILL.md') && file.split('/').length === 2)
    .map((file) => file.split('/')[0])
    .sort()
  const commandInventory = commandFiles.map((file) => file.slice(0, -3)).sort()
  const files: Record<string, UpstreamFileEntry> = {}
  const add = (localPath: string, upstreamPath: string): void => {
    files[localPath] = {
      upstreamPath,
      sha256: sha256File(relativeFile(sourceRoot, upstreamPath)),
    }
  }
  add('LICENSE', 'LICENSE')
  add('upstream/plugin.json', '.claude-plugin/plugin.json')
  add('upstream/skills.json', 'skills.json')
  add('upstream/commands/manifest.json', 'commands/manifest.json')
  for (const file of skillFiles) add(`skills/${file}`, `skills/${file}`)
  for (const file of commandFiles) add(`upstream/commands/${file}`, `commands/${file}`)
  return {
    repository: DEFAULT_REPOSITORY,
    sourceBranch: DEFAULT_BRANCH,
    tag,
    commit,
    upstreamPluginVersion: plugin.version,
    distributionVersion,
    syncedAt: new Date().toISOString(),
    skillInventory,
    commandInventory,
    skillFileCount: skillFiles.length,
    commandFileCount: commandFiles.length,
    licenseSha256: sha256File(path.join(sourceRoot, 'LICENSE')),
    files,
  }
}

function compareWithRemote(root: string, remoteRoot: string, local: UpstreamManifest, remote: UpstreamManifest): void {
  const problems: string[] = []
  const localPaths = Object.keys(local.files).sort()
  const remotePaths = Object.keys(remote.files).sort()
  if (JSON.stringify(localPaths) !== JSON.stringify(remotePaths)) problems.push('Managed file inventory differs from the pinned upstream')
  for (const localPath of new Set([...localPaths, ...remotePaths])) {
    const localEntry = local.files[localPath]
    const remoteEntry = remote.files[localPath]
    if (!localEntry || !remoteEntry) {
      problems.push(`${localPath}: missing from local or remote provenance`)
      continue
    }
    if (localEntry.upstreamPath !== remoteEntry.upstreamPath) problems.push(`${localPath}: upstream path changed`)
    if (localEntry.sha256 !== remoteEntry.sha256) problems.push(`${localPath}: recorded hash differs from pinned upstream`)
    const localFile = relativeFile(root, localPath)
    if (!existsSync(localFile) || sha256File(localFile) !== remoteEntry.sha256) problems.push(`${localPath}: local bytes differ from pinned upstream`)
  }
  if (local.upstreamPluginVersion !== remote.upstreamPluginVersion) problems.push('Upstream plugin version differs')
  if (JSON.stringify(local.skillInventory) !== JSON.stringify(remote.skillInventory)) problems.push('Skill inventory differs')
  if (JSON.stringify(local.commandInventory) !== JSON.stringify(remote.commandInventory)) problems.push('Command inventory differs')
  if (problems.length) throw new Error(`Pinned upstream verification failed:\n${problems.join('\n')}`)
}

export function verifyPinnedUpstream(root: string): { commit: string; files: number } {
  const local = loadUpstream(root)
  const commit = assertCommit(local.commit)
  const temporary = fetchUpstream(root, local.repository, commit)
  try {
    const distributionVersion = readJson<{ version: string }>(path.join(root, 'package.json')).version
    const remote = buildUpstreamManifest(temporary, distributionVersion, commit, local.tag)
    compareWithRemote(root, temporary, local, remote)
    return { commit, files: Object.keys(remote.files).length }
  } finally {
    removeTemporaryTree(temporary)
  }
}

export function applyUpstream(root: string, requestedCommit: string): UpstreamManifest {
  const commit = assertCommit(requestedCommit)
  const current = loadUpstream(root)
  const distributionVersion = readJson<{ version: string }>(path.join(root, 'package.json')).version
  const temporary = fetchUpstream(root, current.repository, commit)
  try {
    const plugin = readJson<{ version: string }>(path.join(temporary, '.claude-plugin', 'plugin.json'))
    const preferred = `v${plugin.version}`
    const tag = tagForCommit(current.repository, commit, preferred)
    const next = buildUpstreamManifest(temporary, distributionVersion, commit, tag)
    rmSync(path.join(root, 'skills'), { recursive: true, force: true })
    cpSync(path.join(temporary, 'skills'), path.join(root, 'skills'), { recursive: true })
    rmSync(path.join(root, 'upstream', 'commands'), { recursive: true, force: true })
    mkdirSync(path.join(root, 'upstream'), { recursive: true })
    cpSync(path.join(temporary, 'commands'), path.join(root, 'upstream', 'commands'), { recursive: true })
    cpSync(path.join(temporary, '.claude-plugin', 'plugin.json'), path.join(root, 'upstream', 'plugin.json'))
    cpSync(path.join(temporary, 'skills.json'), path.join(root, 'upstream', 'skills.json'))
    cpSync(path.join(temporary, 'LICENSE'), path.join(root, 'LICENSE'))
    writeJson(path.join(root, 'UPSTREAM.json'), next)
    if (loadDistribution(root).host === 'cursor') writeGeneratedSkills(root)
    const syncDirectory = path.join(root, '.sync')
    mkdirSync(syncDirectory, { recursive: true })
    writeFileSync(path.join(syncDirectory, 'summary.md'), [
      '## Reviewed upstream sync',
      '',
      `- Previous commit: \`${current.commit}\``,
      `- Proposed commit: \`${next.commit}\``,
      `- Upstream tag: \`${next.tag ?? 'none at this commit'}\``,
      `- Upstream plugin version: \`${current.upstreamPluginVersion}\` → \`${next.upstreamPluginVersion}\``,
      `- Inventory: ${next.skillInventory.length} skills (${next.skillFileCount} files), ${next.commandInventory.length} commands`,
      '',
      'The sync fetched and compared content only. It did not execute upstream scripts.',
      'Review every upstream diff, side-effect change, reference result, and context measurement before merging.',
      'This workflow never auto-merges and never deploys an ADK project.',
      '',
    ].join('\n'), 'utf8')
    return next
  } finally {
    removeTemporaryTree(temporary)
  }
}

function writeGithubOutput(values: Record<string, string>): void {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) throw new Error('--github-output requires GITHUB_OUTPUT')
  appendFileSync(outputPath, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''), 'utf8')
}

async function main(): Promise<void> {
  const root = process.cwd()
  if (process.argv.includes('--verify')) {
    const result = verifyPinnedUpstream(root)
    console.log(`Pinned upstream verified at ${result.commit}: ${result.files} files match.`)
    return
  }
  if (process.argv.includes('--apply')) {
    const commitIndex = process.argv.indexOf('--commit')
    if (commitIndex < 0 || !process.argv[commitIndex + 1]) throw new Error('--apply requires --commit <40-character-sha>')
    const result = applyUpstream(root, process.argv[commitIndex + 1])
    console.log(`Upstream snapshot applied for review at ${result.commit} (${result.tag ?? 'no tag'}).`)
    return
  }
  if (process.argv.includes('--check')) {
    const local = loadUpstream(root)
    const latest = latestMasterCommit(local.repository, local.sourceBranch)
    const updateAvailable = latest !== local.commit.toLowerCase()
    const result = {
      currentCommit: local.commit,
      latestCommit: latest,
      updateAvailable,
      branch: `sync/upstream-${latest.slice(0, 12)}`,
    }
    if (process.argv.includes('--github-output')) {
      writeGithubOutput({
        current_commit: result.currentCommit,
        latest_commit: result.latestCommit,
        update_available: String(result.updateAvailable),
        branch: result.branch,
      })
    }
    console.log(process.argv.includes('--json') ? JSON.stringify(result) : [
      `Current upstream: ${result.currentCommit}`,
      `Latest ${local.sourceBranch}: ${result.latestCommit}`,
      `Reviewed sync available: ${result.updateAvailable ? 'yes' : 'no'}`,
    ].join('\n'))
    return
  }
  throw new Error('Choose --check, --verify, or --apply --commit <sha>')
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
