import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { listRepositoryFiles, loadUpstream, readJson, relativeFile } from './lib/common.js'

export interface ReferenceIssue {
  file: string
  target: string
  reason: string
}

interface ReferenceException {
  file: string
  target: string
  correctTarget?: string
  note: string
}

interface ReferenceExceptionManifest {
  upstreamCommit: string
  exceptions: ReferenceException[]
}

export interface ReferenceResult {
  markdownFiles: number
  markdownLinks: number
  skillReferenceMentions: number
  issues: ReferenceIssue[]
  documentedExceptions: ReferenceIssue[]
}

function isExternal(target: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)
}

function cleanLinkTarget(raw: string): string {
  let target = raw.trim()
  if (target.startsWith('<') && target.includes('>')) return target.slice(1, target.indexOf('>'))
  const titleMatch = target.match(/^(\S+)\s+["'].*["']$/)
  if (titleMatch) target = titleMatch[1]
  return target
}

function applyReferenceExceptions(root: string, foundIssues: ReferenceIssue[]): Pick<ReferenceResult, 'issues' | 'documentedExceptions'> {
  const exceptionPath = path.join(root, 'tests', 'reference-exceptions.json')
  if (!existsSync(exceptionPath)) return { issues: foundIssues, documentedExceptions: [] }
  const manifest = readJson<ReferenceExceptionManifest>(exceptionPath)
  if (manifest.upstreamCommit !== loadUpstream(root).commit) {
    throw new Error('Reference exceptions belong to a different upstream commit; review them before syncing')
  }
  if (!Array.isArray(manifest.exceptions)) throw new Error('tests/reference-exceptions.json must contain an exceptions array')
  for (const exception of manifest.exceptions) {
    if (!exception.file.startsWith('skills/') || !exception.target || !exception.note) {
      throw new Error('Only documented upstream skill-reference exceptions are allowed')
    }
  }

  const matched = new Set<number>()
  const documentedExceptions: ReferenceIssue[] = []
  const issues = foundIssues.filter((issue) => {
    const index = manifest.exceptions.findIndex((exception, candidate) => (
      !matched.has(candidate) && exception.file === issue.file && exception.target === issue.target
    ))
    if (index < 0) return true
    matched.add(index)
    documentedExceptions.push(issue)
    return false
  })
  manifest.exceptions.forEach((exception, index) => {
    if (!matched.has(index)) {
      issues.push({
        file: exception.file,
        target: exception.target,
        reason: 'Stale reference exception; remove or update it after reviewing the pinned upstream',
      })
    }
  })
  return { issues, documentedExceptions }
}

export function checkReferences(root: string): ReferenceResult {
  const markdownFiles = listRepositoryFiles(root).filter((file) => file.endsWith('.md'))
  const foundIssues: ReferenceIssue[] = []
  let markdownLinks = 0
  let skillReferenceMentions = 0

  for (const file of markdownFiles) {
    const content = readFileSync(relativeFile(root, file), 'utf8')
    for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = cleanLinkTarget(match[1])
      if (!rawTarget || isExternal(rawTarget) || rawTarget.includes('${') || rawTarget.includes('<')) continue
      markdownLinks += 1
      const withoutAnchor = rawTarget.split('#')[0].split('?')[0]
      if (!withoutAnchor || withoutAnchor.startsWith('/')) continue
      let decoded = withoutAnchor
      try { decoded = decodeURIComponent(withoutAnchor) } catch { /* Keep the literal path for a useful error. */ }
      const resolved = path.resolve(path.dirname(relativeFile(root, file)), decoded)
      if (!resolved.startsWith(path.resolve(root)) || !existsSync(resolved)) {
        foundIssues.push({ file, target: rawTarget, reason: 'Local Markdown target does not resolve inside the repository' })
      }
    }

    if (/^skills\/[^/]+\/SKILL\.md$/.test(file)) {
      for (const match of content.matchAll(/(?:\.\/)?references\/[A-Za-z0-9._/-]+\.md/g)) {
        skillReferenceMentions += 1
        const target = match[0].replace(/^\.\//, '')
        const resolved = path.resolve(path.dirname(relativeFile(root, file)), target)
        if (!resolved.startsWith(path.resolve(root)) || !existsSync(resolved)) {
          foundIssues.push({ file, target: match[0], reason: 'Skill reference target does not exist' })
        }
      }
    }
  }
  const { issues, documentedExceptions } = applyReferenceExceptions(root, foundIssues)
  return { markdownFiles: markdownFiles.length, markdownLinks, skillReferenceMentions, issues, documentedExceptions }
}

async function main(): Promise<void> {
  const result = checkReferences(process.cwd())
  for (const issue of result.documentedExceptions) {
    console.log(`Documented upstream exception: ${issue.file}: ${issue.target}`)
  }
  if (result.issues.length) {
    for (const issue of result.issues) console.error(`${issue.file}: ${issue.target}: ${issue.reason}`)
    throw new Error(`${result.issues.length} broken local reference(s)`)
  }
  console.log(`Reference check passed: ${result.markdownFiles} Markdown files, ${result.markdownLinks} local links, ${result.skillReferenceMentions} skill reference mentions, ${result.documentedExceptions.length} documented upstream exceptions.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
