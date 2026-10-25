import type { Ajv2020 as Ajv2020Class } from 'ajv/dist/2020.js'
import type { FormatsPlugin } from 'ajv-formats'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  isCommitSha,
  isSemanticVersion,
  listFiles,
  listRepositoryFiles,
  loadDistribution,
  loadUpstream,
  parseFrontmatter,
  readJson,
  relativeFile,
  sha256File,
  sha256Text,
  type DistributionConfig,
  type Host,
  type UpstreamManifest,
} from './lib/common.js'
import { verifyGeneratedCommands } from './generate-commands.js'

const require = createRequire(import.meta.url)
const Ajv2020 = require('ajv/dist/2020.js') as typeof Ajv2020Class
const addFormats = require('ajv-formats') as FormatsPlugin

interface PackageJson {
  name: string
  version: string
  private: boolean
}

export interface ProvenanceResult {
  expectedFiles: number
  actualFiles: number
}

export function verifyProvenance(root: string, upstream: UpstreamManifest): ProvenanceResult {
  if (!isCommitSha(upstream.commit)) throw new Error('UPSTREAM.json commit must be a full 40-character SHA')
  const actualFiles = [
    'LICENSE',
    'upstream/plugin.json',
    'upstream/skills.json',
    ...listFiles(path.join(root, 'skills')).map((file) => `skills/${file}`),
    ...listFiles(path.join(root, 'upstream', 'commands')).map((file) => `upstream/commands/${file}`),
  ].sort()
  const expectedFiles = Object.keys(upstream.files).sort()
  const missing = expectedFiles.filter((file) => !existsSync(relativeFile(root, file)))
  const unexpected = actualFiles.filter((file) => !(file in upstream.files))
  const notRecorded = actualFiles.filter((file) => !expectedFiles.includes(file))
  const modified = expectedFiles.filter((file) => {
    if (!existsSync(relativeFile(root, file))) return false
    return sha256File(relativeFile(root, file)) !== upstream.files[file].sha256
  })
  if (missing.length || unexpected.length || notRecorded.length || modified.length) {
    throw new Error([
      'Upstream provenance verification failed.',
      missing.length ? `Missing: ${missing.join(', ')}` : '',
      unexpected.length || notRecorded.length ? `Unrecorded: ${[...new Set([...unexpected, ...notRecorded])].join(', ')}` : '',
      modified.length ? `Modified: ${modified.join(', ')}` : '',
    ].filter(Boolean).join('\n'))
  }

  const actualSkills = listFiles(path.join(root, 'skills'))
    .filter((file) => file.endsWith('/SKILL.md') && file.split('/').length === 2)
    .map((file) => file.split('/')[0])
    .sort()
  const actualCommands = listFiles(path.join(root, 'upstream', 'commands'))
    .filter((file) => file.endsWith('.md') && !file.includes('/'))
    .map((file) => file.slice(0, -3))
    .sort()
  if (JSON.stringify(actualSkills) !== JSON.stringify([...upstream.skillInventory].sort())) {
    throw new Error(`Skill inventory differs from UPSTREAM.json: ${actualSkills.join(', ')}`)
  }
  if (JSON.stringify(actualCommands) !== JSON.stringify([...upstream.commandInventory].sort())) {
    throw new Error(`Command inventory differs from UPSTREAM.json: ${actualCommands.join(', ')}`)
  }
  if (upstream.skillFileCount !== listFiles(path.join(root, 'skills')).length) {
    throw new Error('skillFileCount does not match the synced skill tree')
  }
  if (upstream.commandFileCount !== actualCommands.length) {
    throw new Error('commandFileCount does not match the synced command inventory')
  }
  const licenseHash = sha256File(path.join(root, 'LICENSE'))
  if (licenseHash !== upstream.licenseSha256 || upstream.files.LICENSE?.upstreamPath !== 'LICENSE') {
    throw new Error('License checksum or upstream path is inconsistent')
  }
  return { expectedFiles: expectedFiles.length, actualFiles: actualFiles.length }
}

const cursorFields = new Set([
  'name', 'description', 'version', 'author', 'homepage', 'repository', 'license',
  'keywords', 'logo', 'rules', 'agents', 'skills', 'commands', 'hooks', 'mcpServers', 'variables',
])

function validateManifest(root: string, distribution: DistributionConfig, version: string): void {
  const manifestPath = relativeFile(root, distribution.manifestPath)
  const manifest = readJson<Record<string, unknown>>(manifestPath)
  if (manifest.name !== distribution.pluginName) throw new Error('Manifest name does not match distribution.json')
  if (manifest.version !== version || !isSemanticVersion(version)) throw new Error('Manifest version must be semantic and match package.json')
  if (manifest.license !== 'MIT') throw new Error('Manifest license must be MIT')
  if (manifest.repository !== distribution.repository) throw new Error('Manifest repository must be the mazemax distribution URL')
  if (manifest.homepage !== distribution.repository) throw new Error('Manifest homepage must be the mazemax distribution URL')
  const author = manifest.author as { name?: unknown } | undefined
  if (author?.name !== 'mazemax') throw new Error('Manifest author must identify mazemax')

  if (distribution.host === 'cursor') {
    for (const key of Object.keys(manifest)) {
      if (!cursorFields.has(key)) throw new Error(`Unsupported Cursor manifest field: ${key}`)
    }
    if (manifest.logo !== 'assets/logo.svg' || !existsSync(path.join(root, 'assets', 'logo.svg'))) {
      throw new Error('Cursor logo must use the committed neutral assets/logo.svg')
    }
  } else {
    const schema = readJson<object>(path.join(root, 'schemas', 'agent-plugins-1.0.0.json'))
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)
    if (!validate(manifest)) {
      throw new Error(`Agent Plugins schema validation failed: ${JSON.stringify(validate.errors)}`)
    }
    if (manifest.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') {
      throw new Error('Agent Plugins 1.0 schema URL is required')
    }
  }

  if (distribution.host === 'codex') {
    const extensions = manifest.extensions as Record<string, Record<string, unknown>> | undefined
    if (extensions?.['com.openai']?.onboardingSkill) {
      throw new Error('Codex must not add an onboarding skill')
    }
  }
}

function validateComponents(root: string, host: Host, upstream: UpstreamManifest): void {
  const forbidden = [
    'mcp.json', '.mcp.json', '.app.json', 'hooks', 'agents', '.claude-plugin',
    'com.github.copilot/agents', 'com.github.copilot/hooks', 'com.github.copilot/rules',
    'com.github.copilot/lsp.json',
  ]
  if (host === 'codex') forbidden.push('commands', '.codex-plugin', 'com.github.copilot')
  if (host === 'cursor') forbidden.push('rules')
  const present = forbidden.filter((target) => existsSync(relativeFile(root, target)))
  if (present.length) throw new Error(`Forbidden or out-of-scope components found: ${present.join(', ')}`)

  for (const skill of upstream.skillInventory) {
    const skillPath = path.join(root, 'skills', skill, 'SKILL.md')
    const frontmatter = parseFrontmatter(readFileSync(skillPath, 'utf8'), `skills/${skill}/SKILL.md`).values
    if (frontmatter.name !== skill) throw new Error(`Skill ${skill} has mismatched frontmatter name`)
    if (!frontmatter.description) throw new Error(`Skill ${skill} has no description`)
    if (frontmatter.license !== 'MIT') throw new Error(`Skill ${skill} must retain its MIT license field`)
  }
  for (const command of upstream.commandInventory) {
    const commandPath = path.join(root, 'upstream', 'commands', `${command}.md`)
    const frontmatter = parseFrontmatter(readFileSync(commandPath, 'utf8'), `upstream/commands/${command}.md`).values
    if (frontmatter.name !== command) throw new Error(`Command ${command} has mismatched frontmatter name`)
    if (!frontmatter.description) throw new Error(`Command ${command} has no description`)
  }
}

function validateWorkflowPins(root: string): void {
  const workflows = listFiles(path.join(root, '.github', 'workflows')).filter((file) => /\.ya?ml$/.test(file))
  if (!workflows.length) throw new Error('No GitHub Actions workflows found')
  for (const workflow of workflows) {
    const content = readFileSync(path.join(root, '.github', 'workflows', workflow), 'utf8')
    for (const match of content.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
      const action = match[1]
      if (action.startsWith('./')) continue
      if (!/@[0-9a-f]{40}$/.test(action)) throw new Error(`${workflow}: action is not pinned to a full SHA: ${action}`)
    }
  }
}

function validateDocuments(root: string, version: string): void {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8')
  for (const required of ['Community-maintained', 'not endorsed by Botpress', 'https://github.com/botpress/skills', version]) {
    if (!readme.includes(required)) throw new Error(`README.md is missing required text: ${required}`)
  }
  const notice = readFileSync(path.join(root, 'NOTICE.md'), 'utf8')
  if (!notice.includes('Copyright (c) 2026 Botpress') || !notice.includes('mazemax')) {
    throw new Error('NOTICE.md must preserve attribution and identify the community maintainer')
  }
  for (const file of ['SECURITY.md', 'SUPPORT.md', 'PRIVACY.md', 'docs/side-effects.md', 'docs/compatibility.md']) {
    if (!existsSync(relativeFile(root, file))) throw new Error(`Required document missing: ${file}`)
  }
}

export function validateRepository(root: string): { files: number; skills: number; commands: number } {
  const distribution = loadDistribution(root)
  const upstream = loadUpstream(root)
  const packageJson = readJson<PackageJson>(path.join(root, 'package.json'))
  if (!packageJson.private) throw new Error('Maintainer tooling package must remain private')
  if (upstream.distributionVersion !== packageJson.version) throw new Error('UPSTREAM.json distributionVersion must match package.json')
  const upstreamPlugin = readJson<{ version: string }>(path.join(root, 'upstream', 'plugin.json'))
  const upstreamSkills = readJson<{ 'adk-version': string }>(path.join(root, 'upstream', 'skills.json'))
  if (upstreamPlugin.version !== upstream.upstreamPluginVersion || upstreamSkills['adk-version'] !== upstream.upstreamPluginVersion) {
    throw new Error('Recorded upstream version does not match upstream metadata')
  }
  verifyProvenance(root, upstream)
  validateManifest(root, distribution, packageJson.version)
  validateComponents(root, distribution.host, upstream)
  verifyGeneratedCommands(root)
  validateWorkflowPins(root)
  validateDocuments(root, packageJson.version)
  listRepositoryFiles(root)
  return {
    files: Object.keys(upstream.files).length,
    skills: upstream.skillInventory.length,
    commands: upstream.commandInventory.length,
  }
}

async function main(): Promise<void> {
  const result = validateRepository(process.cwd())
  console.log(`Validation passed: ${result.skills} skills, ${result.commands} upstream commands, ${result.files} provenance-tracked files.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
