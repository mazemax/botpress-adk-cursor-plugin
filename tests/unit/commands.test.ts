import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  convertCommand,
  expectedCommands,
  verifyGeneratedCommands,
  writeGeneratedCommands,
} from '../../scripts/generate-commands.js'
import { parseFrontmatter, writeJson, type UpstreamManifest } from '../../scripts/lib/common.js'

const source = `---
name: adk-build
description: Build an ADK feature
argument-hint: '[primitive] <description>'
---

Build from $ARGUMENTS, then run \`adk check --format json\`.
`

function temporaryDirectory(): string {
  return mkdtempSync(path.join(process.cwd(), '.test-tmp-'))
}

function fixture(host: 'copilot' | 'cursor' | 'codex'): string {
  const root = temporaryDirectory()
  mkdirSync(path.join(root, 'upstream', 'commands'), { recursive: true })
  writeFileSync(path.join(root, 'upstream', 'commands', 'adk-build.md'), source)
  writeJson(path.join(root, 'distribution.json'), {
    host,
    repository: `https://github.com/mazemax/botpress-adk-${host}-plugin`,
    pluginName: 'botpress-adk-community',
    displayName: 'Botpress ADK Community',
    manifestPath: host === 'cursor' ? '.cursor-plugin/plugin.json' : 'plugin.json',
  })
  const upstream: UpstreamManifest = {
    repository: 'https://github.com/botpress/skills',
    sourceBranch: 'master',
    tag: 'v2.0.7',
    commit: '79abe10503bf6dc70486737c94159322e108e496',
    upstreamPluginVersion: '2.0.7',
    distributionVersion: '1.0.0-rc.1',
    syncedAt: '2026-10-25T00:00:00.000Z',
    skillInventory: [],
    commandInventory: ['adk-build'],
    skillFileCount: 0,
    commandFileCount: 1,
    licenseSha256: '0'.repeat(64),
    files: {},
  }
  writeJson(path.join(root, 'UPSTREAM.json'), upstream)
  return root
}

describe('host command conversion', () => {
  it('emits Copilot-supported metadata and neutral command input wording', () => {
    const converted = convertCommand(source, 'copilot', 'upstream/commands/adk-build.md')
    const parsed = parseFrontmatter(converted)
    expect(parsed.values).toEqual({
      description: 'Build an ADK feature',
      'argument-hint': '[primitive] <description>',
    })
    expect(converted).toContain('Build from the command input')
    expect(converted).not.toContain('$ARGUMENTS')
    expect(converted).toContain('adk check --format json')
  })

  it('emits Cursor-supported metadata and rejects unreviewed source fields', () => {
    const converted = convertCommand(source, 'cursor')
    expect(parseFrontmatter(converted).values).toEqual({
      name: 'adk-build',
      description: 'Build an ADK feature',
    })
    expect(() => convertCommand(`${source.replace('---\n\n', 'allowed-tools: "*"\n---\n\n')}`, 'copilot'))
      .toThrow(/unsupported upstream command frontmatter/)
  })

  it('writes exactly the inventoried commands and detects edits and extras', () => {
    const root = fixture('copilot')
    try {
      const result = writeGeneratedCommands(root)
      expect(result.files).toEqual(['com.github.copilot/commands/adk-build.md'])
      expect(verifyGeneratedCommands(root).files).toHaveLength(1)
      const target = path.join(root, 'com.github.copilot', 'commands', 'adk-build.md')
      writeFileSync(target, `${readFileSync(target, 'utf8')}manual edit\n`)
      expect(() => verifyGeneratedCommands(root)).toThrow(/Modified/)
      writeGeneratedCommands(root)
      writeFileSync(path.join(root, 'com.github.copilot', 'commands', 'extra.md'), 'extra\n')
      expect(() => verifyGeneratedCommands(root)).toThrow(/Extra/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('uses Cursor automatic command discovery and keeps Codex skills-only', () => {
    const cursorRoot = fixture('cursor')
    const codexRoot = fixture('codex')
    try {
      expect(writeGeneratedCommands(cursorRoot).files).toEqual(['commands/adk-build.md'])
      expect(expectedCommands(cursorRoot).size).toBe(1)
      expect(verifyGeneratedCommands(codexRoot)).toEqual({ directory: 'commands', files: [] })
      expect(() => expectedCommands(codexRoot)).toThrow(/skills-only/)
    } finally {
      rmSync(cursorRoot, { recursive: true, force: true })
      rmSync(codexRoot, { recursive: true, force: true })
    }
  })
})
