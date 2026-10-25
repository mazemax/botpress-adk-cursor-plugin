import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  listFiles,
  loadDistribution,
  loadUpstream,
  parseFrontmatter,
  relativeFile,
} from './lib/common.js'

export const CURSOR_SKILL_DIRECTORY = 'cursor/skills'

// Distribution-owned discovery metadata only. Official instructions and references
// remain in skills/ and are never edited by this generator.
export const cursorRoutingDescriptions: Readonly<Record<string, string>> = {
  adk: 'Implement or explain Botpress ADK project source files and agent.config.ts: actions, tools, workflows, conversation handlers, tables, files, knowledge bases, triggers, assets, integrations, plugins, eval implementation, and Zai.',
  'adk-dev-console': 'Use when asked which Dev Console tab shows Agent Steps for a running ADK bot. Also use for ADK Dev Console pages, tabs, navigation, traces, multi-agent dashboard, agent switching, console modes, localhost:3001, and other console UI questions.',
}

export interface GeneratedSkillsResult {
  directory: string
  files: string[]
  routingOverlays: number
}

function convertSkill(markdown: string, skill: string, source: string): string {
  const parsed = parseFrontmatter(markdown, source)
  if (parsed.values.name !== skill || !parsed.values.description) {
    throw new Error(`${source}: official skill name and description are required`)
  }
  const description = cursorRoutingDescriptions[skill]
  if (!description) return markdown
  if (/\r|\n/.test(description)) throw new Error(`${source}: routing descriptions must remain single-line`)
  const header = markdown.slice(0, markdown.length - parsed.body.length)
  const descriptions = header.match(/^description:[^\r\n]*$/gm) ?? []
  if (descriptions.length !== 1) throw new Error(`${source}: expected exactly one single-line description`)
  return header.replace(/^description:[^\r\n]*$/m, `description: ${JSON.stringify(description)}`) + parsed.body
}

export function expectedCursorSkills(root: string): Map<string, Buffer> {
  const distribution = loadDistribution(root)
  if (distribution.host !== 'cursor') throw new Error('Cursor routing overlays are supported only by the Cursor distribution')
  const upstream = loadUpstream(root)
  for (const skill of Object.keys(cursorRoutingDescriptions)) {
    if (!upstream.skillInventory.includes(skill)) throw new Error(`Routing overlay names an unknown official skill: ${skill}`)
  }
  const expected = new Map<string, Buffer>()
  for (const file of listFiles(path.join(root, 'skills'))) {
    const source = `skills/${file}`
    const sourceBytes = readFileSync(relativeFile(root, source))
    const skillFile = /^([^/]+)\/SKILL\.md$/.exec(file)
    const content = skillFile
      ? Buffer.from(convertSkill(sourceBytes.toString('utf8'), skillFile[1], source), 'utf8')
      : sourceBytes
    expected.set(`${CURSOR_SKILL_DIRECTORY}/${file}`, content)
  }
  return expected
}

export function verifyGeneratedSkills(root: string): GeneratedSkillsResult {
  const expected = expectedCursorSkills(root)
  const actualFiles = listFiles(relativeFile(root, CURSOR_SKILL_DIRECTORY))
    .map((file) => `${CURSOR_SKILL_DIRECTORY}/${file}`)
  const expectedFiles = [...expected.keys()].sort()
  const missing = expectedFiles.filter((file) => !actualFiles.includes(file))
  const extra = actualFiles.filter((file) => !expected.has(file))
  const modified = expectedFiles.filter((file) => {
    const target = relativeFile(root, file)
    return existsSync(target) && !readFileSync(target).equals(expected.get(file)!)
  })
  if (missing.length || extra.length || modified.length) {
    throw new Error([
      'Generated Cursor skill drift detected; run npm run generate:skills and review the routing-only diff.',
      missing.length ? `Missing: ${missing.join(', ')}` : '',
      extra.length ? `Extra: ${extra.join(', ')}` : '',
      modified.length ? `Modified: ${modified.join(', ')}` : '',
    ].filter(Boolean).join('\n'))
  }

  for (const file of expectedFiles) {
    if (!file.endsWith('/SKILL.md')) continue
    const sourceFile = file.replace(`${CURSOR_SKILL_DIRECTORY}/`, 'skills/')
    const source = parseFrontmatter(readFileSync(relativeFile(root, sourceFile), 'utf8'), sourceFile)
    const generated = parseFrontmatter(readFileSync(relativeFile(root, file), 'utf8'), file)
    if (source.body !== generated.body) throw new Error(`${file}: generated skill body differs from official content`)
    for (const [key, value] of Object.entries(source.values)) {
      if (key !== 'description' && generated.values[key] !== value) {
        throw new Error(`${file}: generated frontmatter changes official field ${key}`)
      }
    }
    if (Object.keys(generated.values).sort().join('\n') !== Object.keys(source.values).sort().join('\n')) {
      throw new Error(`${file}: generated frontmatter adds or removes official fields`)
    }
  }
  return { directory: CURSOR_SKILL_DIRECTORY, files: expectedFiles, routingOverlays: Object.keys(cursorRoutingDescriptions).length }
}

export function writeGeneratedSkills(root: string): GeneratedSkillsResult {
  const expected = expectedCursorSkills(root)
  const directory = relativeFile(root, CURSOR_SKILL_DIRECTORY)
  rmSync(directory, { recursive: true, force: true })
  for (const [file, content] of expected) {
    const target = relativeFile(root, file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return verifyGeneratedSkills(root)
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2))
  if (args.size !== 1 || (!args.has('--write') && !args.has('--check'))) {
    throw new Error('Usage: tsx scripts/generate-skills.ts --write|--check')
  }
  const result = args.has('--write') ? writeGeneratedSkills(process.cwd()) : verifyGeneratedSkills(process.cwd())
  console.log(`${args.has('--write') ? 'Generated' : 'Verified'} ${result.files.length} files in ${result.directory}/ with ${result.routingOverlays} routing-only overlays.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
