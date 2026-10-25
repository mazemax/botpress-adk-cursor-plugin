import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  listFiles,
  loadUpstream,
  parseFrontmatter,
  readJson,
  relativeFile,
  writeJson,
  type UpstreamManifest,
} from './lib/common.js'

export interface SkillMeasurement {
  name: string
  discoveryCharacters: number
  discoveryUtf8Bytes: number
  estimatedDiscoveryTokens: number
  skillMarkdownBytes: number
  referenceFiles: number
  referenceUtf8Bytes: number
  totalUtf8Bytes: number
}

export interface ContextReport {
  schemaVersion: 1
  upstreamCommit: string
  upstreamTag: string | null
  tokenEstimateMethod: string
  skills: SkillMeasurement[]
  totals: {
    skills: number
    discoveryCharacters: number
    discoveryUtf8Bytes: number
    estimatedDiscoveryTokens: number
    skillMarkdownUtf8Bytes: number
    referenceFiles: number
    referenceUtf8Bytes: number
    packageSkillUtf8Bytes: number
  }
}

export function measureSkills(root: string, skillNames: string[], skillRoot = 'skills'): SkillMeasurement[] {
  return [...skillNames].sort().map((name) => {
    const skillDirectory = path.join(root, skillRoot, name)
    const skillPath = path.join(skillDirectory, 'SKILL.md')
    const skillBytes = readFileSync(skillPath)
    const frontmatter = parseFrontmatter(skillBytes.toString('utf8'), `${skillRoot}/${name}/SKILL.md`).values
    const discovery = `${frontmatter.name ?? ''}\n${frontmatter.description ?? ''}`
    const referenceDirectory = path.join(skillDirectory, 'references')
    const references = listFiles(referenceDirectory).filter((file) => file.endsWith('.md'))
    const referenceBytes = references.reduce((sum, file) => sum + readFileSync(path.join(referenceDirectory, file)).byteLength, 0)
    const allSkillBytes = listFiles(skillDirectory).reduce((sum, file) => sum + readFileSync(path.join(skillDirectory, file)).byteLength, 0)
    return {
      name,
      discoveryCharacters: discovery.length,
      discoveryUtf8Bytes: Buffer.byteLength(discovery, 'utf8'),
      estimatedDiscoveryTokens: Math.ceil(discovery.length / 4),
      skillMarkdownBytes: skillBytes.byteLength,
      referenceFiles: references.length,
      referenceUtf8Bytes: referenceBytes,
      totalUtf8Bytes: allSkillBytes,
    }
  })
}

export function buildContextReport(root: string, upstream: UpstreamManifest): ContextReport {
  const distribution = readJson<{ host: string; manifestPath: string }>(path.join(root, 'distribution.json'))
  let skillRoot = 'skills'
  if (distribution.host === 'cursor') {
    const manifest = readJson<{ skills?: unknown }>(relativeFile(root, distribution.manifestPath))
    if (manifest.skills !== './cursor/skills') throw new Error('Cursor context measurement requires the reviewed explicit skill directory')
    skillRoot = 'cursor/skills'
  }
  const skills = measureSkills(root, upstream.skillInventory, skillRoot)
  const sum = (select: (skill: SkillMeasurement) => number): number => skills.reduce((total, skill) => total + select(skill), 0)
  return {
    schemaVersion: 1,
    upstreamCommit: upstream.commit,
    upstreamTag: upstream.tag,
    tokenEstimateMethod: 'ceil((skill name + newline + description).length / 4); estimate only, not provider tokenization',
    skills,
    totals: {
      skills: skills.length,
      discoveryCharacters: sum((skill) => skill.discoveryCharacters),
      discoveryUtf8Bytes: sum((skill) => skill.discoveryUtf8Bytes),
      estimatedDiscoveryTokens: sum((skill) => skill.estimatedDiscoveryTokens),
      skillMarkdownUtf8Bytes: sum((skill) => skill.skillMarkdownBytes),
      referenceFiles: sum((skill) => skill.referenceFiles),
      referenceUtf8Bytes: sum((skill) => skill.referenceUtf8Bytes),
      packageSkillUtf8Bytes: sum((skill) => skill.totalUtf8Bytes),
    },
  }
}

async function main(): Promise<void> {
  const root = process.cwd()
  const upstream = loadUpstream(root)
  const report = buildContextReport(root, upstream)
  const baselinePath = path.join(root, 'tests', 'results', 'context-baseline.json')
  if (process.argv.includes('--write')) {
    writeJson(baselinePath, report)
    console.log(`Context baseline written: ${report.totals.estimatedDiscoveryTokens} estimated discovery tokens across ${report.totals.skills} skills.`)
    return
  }
  if (!existsSync(baselinePath)) throw new Error('Context baseline missing; review a measurement and run with --write')
  const baseline = readJson<ContextReport>(baselinePath)
  if (JSON.stringify(baseline) !== JSON.stringify(report)) {
    throw new Error('Context measurement changed; review the upstream diff, then refresh with npm run measure:context -- --write')
  }
  console.log(`Context check passed: ${report.totals.estimatedDiscoveryTokens} estimated discovery tokens, ${report.totals.referenceFiles} reference files, ${report.totals.packageSkillUtf8Bytes} skill-package bytes.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
