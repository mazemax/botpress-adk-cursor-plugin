import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  CURSOR_SKILL_DIRECTORY,
  cursorRoutingDescriptions,
  expectedCursorSkills,
  verifyGeneratedSkills,
  writeGeneratedSkills,
} from '../../scripts/generate-skills.js'
import { parseFrontmatter, relativeFile, writeJson, type UpstreamManifest } from '../../scripts/lib/common.js'

function fixture(): string {
  const root = mkdtempSync(path.join(process.cwd(), '.test-tmp-'))
  writeJson(path.join(root, 'distribution.json'), {
    host: 'cursor',
    repository: 'https://github.com/mazemax/botpress-adk-cursor-plugin',
    pluginName: 'botpress-adk-community',
    displayName: 'Botpress ADK Community',
    manifestPath: '.cursor-plugin/plugin.json',
  })
  const upstream: UpstreamManifest = {
    repository: 'https://github.com/botpress/skills',
    sourceBranch: 'master',
    tag: 'v2.0.7',
    commit: '79abe10503bf6dc70486737c94159322e108e496',
    upstreamPluginVersion: '2.0.7',
    distributionVersion: '1.0.0-rc.1',
    syncedAt: '2026-10-25T00:00:00.000Z',
    skillInventory: ['adk', 'adk-dev-console', 'adk-docs'],
    commandInventory: [],
    skillFileCount: 6,
    commandFileCount: 0,
    licenseSha256: '0'.repeat(64),
    files: {},
  }
  writeJson(path.join(root, 'UPSTREAM.json'), upstream)
  for (const skill of upstream.skillInventory) {
    mkdirSync(path.join(root, 'skills', skill, 'references'), { recursive: true })
    writeFileSync(path.join(root, 'skills', skill, 'SKILL.md'), `---\nname: ${skill}\ndescription: Official ${skill} routing\nlicense: MIT\n---\n\n# Official ${skill}\n\nRead \`references/guide.md\`.\n`, 'utf8')
    writeFileSync(path.join(root, 'skills', skill, 'references', 'guide.md'), `# ${skill} official reference\n`, 'utf8')
  }
  return root
}

describe('Cursor routing-only skill generation', () => {
  it('changes only the two routing descriptions and preserves official bodies and references', () => {
    const root = fixture()
    try {
      const result = writeGeneratedSkills(root)
      expect(result.files).toHaveLength(6)
      expect(result.routingOverlays).toBe(2)
      for (const skill of ['adk', 'adk-dev-console']) {
        const sourcePath = path.join(root, 'skills', skill, 'SKILL.md')
        const generatedPath = path.join(root, CURSOR_SKILL_DIRECTORY, skill, 'SKILL.md')
        const source = parseFrontmatter(readFileSync(sourcePath, 'utf8'))
        const generated = parseFrontmatter(readFileSync(generatedPath, 'utf8'))
        expect(generated.values.description).toBe(cursorRoutingDescriptions[skill])
        expect(generated.values.name).toBe(source.values.name)
        expect(generated.values.license).toBe(source.values.license)
        expect(generated.body).toBe(source.body)
        expect(readFileSync(path.join(root, CURSOR_SKILL_DIRECTORY, skill, 'references', 'guide.md'), 'utf8'))
          .toBe(readFileSync(path.join(root, 'skills', skill, 'references', 'guide.md'), 'utf8'))
      }
      expect(readFileSync(path.join(root, CURSOR_SKILL_DIRECTORY, 'adk-docs', 'SKILL.md')))
        .toEqual(readFileSync(path.join(root, 'skills', 'adk-docs', 'SKILL.md')))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects missing, extra, edited, and stale generated files', () => {
    const root = fixture()
    try {
      writeGeneratedSkills(root)
      const target = path.join(root, CURSOR_SKILL_DIRECTORY, 'adk', 'SKILL.md')
      writeFileSync(target, `${readFileSync(target, 'utf8')}manual edit\n`)
      expect(() => verifyGeneratedSkills(root)).toThrow(/Modified/)
      writeGeneratedSkills(root)
      writeFileSync(path.join(root, CURSOR_SKILL_DIRECTORY, 'adk', 'extra.md'), 'extra\n')
      expect(() => verifyGeneratedSkills(root)).toThrow(/Extra/)
      rmSync(target)
      expect(() => verifyGeneratedSkills(root)).toThrow(/Missing|Extra/)
      writeGeneratedSkills(root)
      writeFileSync(path.join(root, 'skills', 'adk', 'references', 'guide.md'), '# Reviewed upstream change\n')
      expect(() => verifyGeneratedSkills(root)).toThrow(/Modified/)
      expect(expectedCursorSkills(root).size).toBe(6)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('keeps unrelated skills byte-identical and refuses non-Cursor generation', () => {
    const root = fixture()
    try {
      const distributionPath = path.join(root, 'distribution.json')
      const distribution = JSON.parse(readFileSync(distributionPath, 'utf8')) as { host: string }
      distribution.host = 'codex'
      writeFileSync(distributionPath, `${JSON.stringify(distribution, null, 2)}\n`)
      expect(() => expectedCursorSkills(root)).toThrow(/only by the Cursor distribution/)
      expect(() => verifyGeneratedSkills(root)).toThrow(/only by the Cursor distribution/)
      expect(() => relativeFile(root, `${CURSOR_SKILL_DIRECTORY}/adk/SKILL.md`)).not.toBe(path.join(root, 'skills', 'adk', 'SKILL.md'))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
