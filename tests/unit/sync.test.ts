import { describe, expect, it } from 'vitest'
import { assertCommit, parseTagRefs } from '../../scripts/sync-upstream.js'

describe('upstream sync safety', () => {
  it('accepts only full commit SHAs', () => {
    expect(assertCommit('79ABE10503BF6DC70486737C94159322E108E496')).toBe('79abe10503bf6dc70486737c94159322e108e496')
    expect(() => assertCommit('v2.0.7')).toThrow(/40-character/)
    expect(() => assertCommit('79abe10503bf')).toThrow(/40-character/)
  })

  it('resolves lightweight and annotated tag targets', () => {
    const refs = [
      '79abe10503bf6dc70486737c94159322e108e496\trefs/tags/v2.0.7',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/tags/v2.0.6',
      '9085e5d2c1731bc88b43792590c1ef0ac98c259b\trefs/tags/v2.0.6^{}',
    ].join('\n')
    expect(parseTagRefs(refs)).toEqual([
      { tag: 'v2.0.6', targetCommit: '9085e5d2c1731bc88b43792590c1ef0ac98c259b' },
      { tag: 'v2.0.7', targetCommit: '79abe10503bf6dc70486737c94159322e108e496' },
    ])
  })
})
