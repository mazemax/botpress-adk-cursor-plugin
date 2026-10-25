import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { isSemanticVersion, parseFrontmatter, sha256File, writeJson, type UpstreamManifest } from '../../scripts/lib/common.js'
import { verifyProvenance } from '../../scripts/validate.js'

function temporaryDirectory(): string {
  return mkdtempSync(path.join(process.cwd(), '.test-tmp-'))
}

function manifest(root: string): UpstreamManifest {
  const license = path.join(root, 'LICENSE')
  return {
    repository: 'https://github.com/botpress/skills',
    sourceBranch: 'master',
    tag: 'v2.0.7',
    commit: '79abe10503bf6dc70486737c94159322e108e496',
    upstreamPluginVersion: '2.0.7',
    distributionVersion: '1.0.0-rc.1',
    syncedAt: '2026-10-25T00:00:00.000Z',
    skillInventory: [],
    commandInventory: [],
    skillFileCount: 0,
    commandFileCount: 0,
    licenseSha256: sha256File(license),
    files: {
      LICENSE: { upstreamPath: 'LICENSE', sha256: sha256File(license) },
      'upstream/plugin.json': { upstreamPath: '.claude-plugin/plugin.json', sha256: sha256File(path.join(root, 'upstream', 'plugin.json')) },
      'upstream/skills.json': { upstreamPath: 'skills.json', sha256: sha256File(path.join(root, 'upstream', 'skills.json')) },
    },
  }
}

function fixture(): { root: string; upstream: UpstreamManifest } {
  const root = temporaryDirectory()
  mkdirSync(path.join(root, 'upstream'), { recursive: true })
  writeFileSync(path.join(root, 'LICENSE'), 'MIT\n')
  writeFileSync(path.join(root, 'upstream', 'plugin.json'), '{"version":"2.0.7"}\n')
  writeFileSync(path.join(root, 'upstream', 'skills.json'), '{"adk-version":"2.0.7"}\n')
  return { root, upstream: manifest(root) }
}

describe('frontmatter and versions', () => {
  it('parses the official simple skill metadata', () => {
    const parsed = parseFrontmatter('---\nname: adk\ndescription: Build ADK bots\nlicense: MIT\n---\n\n# ADK\n')
    expect(parsed.values).toEqual({ name: 'adk', description: 'Build ADK bots', license: 'MIT' })
    expect(parsed.body).toBe('\n# ADK\n')
  })

  it('rejects malformed frontmatter and non-semantic versions', () => {
    expect(() => parseFrontmatter('# No metadata')).toThrow(/frontmatter/)
    expect(isSemanticVersion('1.0.0-rc.1')).toBe(true)
    expect(isSemanticVersion('v1.0.0')).toBe(false)
    expect(isSemanticVersion('01.0.0')).toBe(false)
  })
})

describe('provenance verification', () => {
  it('accepts an exact tracked snapshot', () => {
    const { root, upstream } = fixture()
    try {
      expect(verifyProvenance(root, upstream).expectedFiles).toBe(3)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('detects modified and unrecorded synced files', () => {
    const { root, upstream } = fixture()
    try {
      writeFileSync(path.join(root, 'LICENSE'), 'changed\n')
      expect(() => verifyProvenance(root, upstream)).toThrow(/Modified|checksum/)
      const restored = fixture()
      try {
        mkdirSync(path.join(restored.root, 'skills', 'adk'), { recursive: true })
        writeFileSync(path.join(restored.root, 'skills', 'adk', 'SKILL.md'), 'unexpected\n')
        expect(() => verifyProvenance(restored.root, restored.upstream)).toThrow(/Unrecorded/)
      } finally {
        rmSync(restored.root, { recursive: true, force: true })
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
