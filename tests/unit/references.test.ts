import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { checkReferences } from '../../scripts/check-references.js'

function withFixture(run: (root: string) => void): void {
  const root = mkdtempSync(path.join(process.cwd(), '.test-tmp-'))
  try {
    mkdirSync(path.join(root, 'docs'), { recursive: true })
    mkdirSync(path.join(root, 'skills', 'adk', 'references'), { recursive: true })
    writeFileSync(path.join(root, 'docs', 'guide.md'), '# Guide\n')
    writeFileSync(path.join(root, 'skills', 'adk', 'references', 'actions.md'), '# Actions\n')
    run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe('reference integrity', () => {
  it('resolves local Markdown links and skill reference mentions', () => {
    withFixture((root) => {
      writeFileSync(path.join(root, 'README.md'), '[Guide](docs/guide.md)\n[External](https://example.com)\n')
      writeFileSync(path.join(root, 'skills', 'adk', 'SKILL.md'), '---\nname: adk\ndescription: test\n---\nRead `references/actions.md`.\n')
      const result = checkReferences(root)
      expect(result.issues).toEqual([])
      expect(result.markdownLinks).toBe(1)
      expect(result.skillReferenceMentions).toBe(1)
    })
  })

  it('reports missing local targets', () => {
    withFixture((root) => {
      writeFileSync(path.join(root, 'README.md'), '[Missing](docs/missing.md)\n')
      writeFileSync(path.join(root, 'skills', 'adk', 'SKILL.md'), 'Read `references/missing.md`.\n')
      const result = checkReferences(root)
      expect(result.issues).toHaveLength(2)
      expect(result.issues.map((issue) => issue.target)).toContain('references/missing.md')
    })
  })

  it('applies exact upstream exceptions and rejects stale entries', () => {
    withFixture((root) => {
      const source = 'skills/adk/references/guide.md'
      writeFileSync(path.join(root, 'skills', 'adk', 'references', 'guide.md'), '[Missing](../missing.md)\n')
      mkdirSync(path.join(root, 'tests'), { recursive: true })
      writeFileSync(path.join(root, 'UPSTREAM.json'), JSON.stringify({ commit: 'a'.repeat(40) }))
      const exceptionPath = path.join(root, 'tests', 'reference-exceptions.json')
      const exception = { file: source, target: '../missing.md', note: 'Pinned upstream test fixture' }
      writeFileSync(exceptionPath, JSON.stringify({ upstreamCommit: 'a'.repeat(40), exceptions: [exception] }))

      const result = checkReferences(root)
      expect(result.issues).toEqual([])
      expect(result.documentedExceptions).toHaveLength(1)

      writeFileSync(exceptionPath, JSON.stringify({
        upstreamCommit: 'a'.repeat(40),
        exceptions: [{ ...exception, target: '../fixed.md' }],
      }))
      const stale = checkReferences(root)
      expect(stale.issues).toHaveLength(2)
      expect(stale.issues.some((issue) => issue.reason.startsWith('Stale reference exception'))).toBe(true)
    })
  })
})
