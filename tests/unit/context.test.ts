import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { measureSkills } from '../../scripts/measure-context.js'

describe('context measurements', () => {
  it('measures discovery and reference costs without claiming provider tokens', () => {
    const root = mkdtempSync(path.join(process.cwd(), '.test-tmp-'))
    try {
      const skill = path.join(root, 'skills', 'adk')
      mkdirSync(path.join(skill, 'references'), { recursive: true })
      writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: adk\ndescription: Build bots\n---\n# ADK\n')
      writeFileSync(path.join(skill, 'references', 'actions.md'), '# Actions\n')
      const [measurement] = measureSkills(root, ['adk'])
      expect(measurement.name).toBe('adk')
      expect(measurement.discoveryCharacters).toBe('adk\nBuild bots'.length)
      expect(measurement.estimatedDiscoveryTokens).toBe(Math.ceil('adk\nBuild bots'.length / 4))
      expect(measurement.referenceFiles).toBe(1)
      expect(measurement.totalUtf8Bytes).toBeGreaterThan(measurement.skillMarkdownBytes)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
