import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import path from 'node:path'

export type Host = 'copilot' | 'codex' | 'cursor'

export interface DistributionConfig {
  host: Host
  repository: string
  pluginName: string
  displayName: string
  manifestPath: string
}

export interface UpstreamFileEntry {
  upstreamPath: string
  sha256: string
}

export interface UpstreamManifest {
  repository: string
  sourceBranch: string
  tag: string | null
  commit: string
  upstreamPluginVersion: string
  distributionVersion: string
  syncedAt: string
  skillInventory: string[]
  commandInventory: string[]
  skillFileCount: number
  commandFileCount: number
  licenseSha256: string
  files: Record<string, UpstreamFileEntry>
}

export function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

export function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

export function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  const output: string[] = []
  const visit = (current: string, relative: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name
      if (lstatSync(absolute).isSymbolicLink()) {
        throw new Error(`Symbolic links are not allowed: ${childRelative}`)
      }
      if (entry.isDirectory()) visit(absolute, childRelative)
      else if (entry.isFile()) output.push(childRelative)
    }
  }
  visit(directory, '')
  return output.sort()
}

export function listRepositoryFiles(root: string): string[] {
  const ignored = new Set([
    '.git',
    'node_modules',
    'dist',
    'coverage',
    '.sync',
  ])
  const output: string[] = []
  const visit = (current: string, relative: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (ignored.has(entry.name) || entry.name.startsWith('.test-tmp-') || entry.name.startsWith('.tmp-upstream-')) {
        continue
      }
      const absolute = path.join(current, entry.name)
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name
      if (lstatSync(absolute).isSymbolicLink()) {
        throw new Error(`Symbolic links are not allowed: ${childRelative}`)
      }
      if (entry.isDirectory()) visit(absolute, childRelative)
      else if (entry.isFile()) output.push(childRelative)
    }
  }
  visit(root, '')
  return output.sort()
}

export function loadDistribution(root: string): DistributionConfig {
  return readJson<DistributionConfig>(path.join(root, 'distribution.json'))
}

export function loadUpstream(root: string): UpstreamManifest {
  return readJson<UpstreamManifest>(path.join(root, 'UPSTREAM.json'))
}

export interface Frontmatter {
  values: Record<string, string>
  body: string
}

export function parseFrontmatter(markdown: string, source = 'Markdown file'): Frontmatter {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error(`${source}: missing or malformed YAML frontmatter`)
  const values: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const separator = line.indexOf(':')
    if (separator < 1) throw new Error(`${source}: unsupported frontmatter line: ${line}`)
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return { values, body: markdown.slice(match[0].length) }
}

export function isCommitSha(value: string): boolean {
  return /^[0-9a-f]{40}$/i.test(value)
}

export function isSemanticVersion(value: string): boolean {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value)
}

export function relativeFile(root: string, relativePath: string): string {
  return path.join(root, ...relativePath.split('/'))
}
