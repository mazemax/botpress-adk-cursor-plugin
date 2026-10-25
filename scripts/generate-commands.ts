import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  listFiles,
  loadDistribution,
  loadUpstream,
  parseFrontmatter,
  relativeFile,
  type Host,
} from './lib/common.js'

export type CommandHost = Extract<Host, 'copilot' | 'cursor'>

export interface GeneratedCommandsResult {
  directory: string
  files: string[]
}

export function commandDirectory(host: CommandHost): string {
  return host === 'copilot' ? 'com.github.copilot/commands' : 'commands'
}

export function convertCommand(markdown: string, host: CommandHost, source = 'command'): string {
  const parsed = parseFrontmatter(markdown, source)
  const supportedSourceFields = new Set(['name', 'description', 'argument-hint'])
  const unsupported = Object.keys(parsed.values).filter((key) => !supportedSourceFields.has(key))
  if (unsupported.length) {
    throw new Error(`${source}: review unsupported upstream command frontmatter: ${unsupported.join(', ')}`)
  }
  if (!parsed.values.name || !parsed.values.description) {
    throw new Error(`${source}: command name and description are required`)
  }

  const fields: string[] = host === 'cursor' ? [`name: ${JSON.stringify(parsed.values.name)}`] : []
  fields.push(`description: ${JSON.stringify(parsed.values.description)}`)
  if (host === 'copilot' && parsed.values['argument-hint']) {
    fields.push(`argument-hint: ${JSON.stringify(parsed.values['argument-hint'])}`)
  }

  // Do not rely on Claude Code's command-token substitution in another host.
  // This is the only body transformation; command names and workflow steps stay intact.
  const body = parsed.body.replaceAll('$ARGUMENTS', 'the command input')
  return `---\n${fields.join('\n')}\n---\n<!-- Generated from ${source}; run npm run generate:commands. Do not edit directly. -->${body}`
}

export function expectedCommands(root: string): Map<string, string> {
  const distribution = loadDistribution(root)
  if (distribution.host === 'codex') throw new Error('Codex is skills-only; command generation is not supported')
  const host = distribution.host
  const upstream = loadUpstream(root)
  const directory = commandDirectory(host)
  const expected = new Map<string, string>()
  for (const command of [...upstream.commandInventory].sort()) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(command)) throw new Error(`Invalid command name: ${command}`)
    const source = `upstream/commands/${command}.md`
    const markdown = readFileSync(relativeFile(root, source), 'utf8')
    const converted = convertCommand(markdown, host, source)
    const parsed = parseFrontmatter(converted, `${directory}/${command}.md`)
    if (host === 'cursor' && parsed.values.name !== command) {
      throw new Error(`${command}: generated Cursor name does not match the filename`)
    }
    expected.set(`${directory}/${command}.md`, converted)
  }
  return expected
}

export function verifyGeneratedCommands(root: string): GeneratedCommandsResult {
  const distribution = loadDistribution(root)
  if (distribution.host === 'codex') {
    const present = listFiles(path.join(root, 'commands'))
    if (present.length) throw new Error(`Codex commands are forbidden: ${present.join(', ')}`)
    return { directory: 'commands', files: [] }
  }
  const host = distribution.host
  const directory = commandDirectory(host)
  const expected = expectedCommands(root)
  const actualFiles = listFiles(relativeFile(root, directory)).map((file) => `${directory}/${file}`)
  const expectedFiles = [...expected.keys()].sort()
  const missing = expectedFiles.filter((file) => !actualFiles.includes(file))
  const extra = actualFiles.filter((file) => !expected.has(file))
  const modified = expectedFiles.filter((file) => (
    existsSync(relativeFile(root, file)) && readFileSync(relativeFile(root, file), 'utf8') !== expected.get(file)
  ))
  if (missing.length || extra.length || modified.length) {
    throw new Error([
      'Generated command drift detected; run npm run generate:commands and review the diff.',
      missing.length ? `Missing: ${missing.join(', ')}` : '',
      extra.length ? `Extra: ${extra.join(', ')}` : '',
      modified.length ? `Modified: ${modified.join(', ')}` : '',
    ].filter(Boolean).join('\n'))
  }
  return { directory, files: expectedFiles }
}

export function writeGeneratedCommands(root: string): GeneratedCommandsResult {
  const expected = expectedCommands(root)
  for (const [file, content] of expected) {
    const target = relativeFile(root, file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
  }
  return verifyGeneratedCommands(root)
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2))
  if (args.size !== 1 || (!args.has('--write') && !args.has('--check'))) {
    throw new Error('Usage: tsx scripts/generate-commands.ts --write|--check')
  }
  const result = args.has('--write') ? writeGeneratedCommands(process.cwd()) : verifyGeneratedCommands(process.cwd())
  console.log(`${args.has('--write') ? 'Generated' : 'Verified'} ${result.files.length} commands in ${result.directory}/.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
