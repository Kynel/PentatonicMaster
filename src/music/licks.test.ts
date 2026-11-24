import { describe, expect, it } from 'vitest'
import { LICKS, buildLick, parseTab } from './licks'
import { midiToName } from './theory'

describe('lick tab parser', () => {
  it('reads string, fret, finger and technique', () => {
    const { notes, errors } = parseTab('1:8:4 | 1:5:1p 3:9:3s')
    expect(errors).toEqual([])
    expect(notes.map((n) => [n.string, n.fret, n.finger, n.tech])).toEqual([
      [5, 8, 4, undefined],
      [5, 5, 1, 'p'],
      [3, 9, 3, 's'],
    ])
  })
  it('guesses fingers from nearby frets when omitted', () => {
    const { notes } = parseTab('1:5 1:8 2:5 2:7')
    expect(notes.map((n) => n.finger)).toEqual([1, 4, 1, 3])
  })
  it('reports tokens it cannot read', () => {
    expect(parseTab('1:5 x7').errors).toHaveLength(1)
  })
})

describe('built-in licks', () => {
  // A minor pentatonic plus the 9th (B) and the blue note (D#)
  const allowed = new Set(['A', 'C', 'D', 'E', 'G', 'B', 'D#'])
  it.each(LICKS.map((l) => [l.id, l] as const))('%s parses cleanly and stays in A minor', (_, lick) => {
    const { notes, errors } = parseTab(lick.tab)
    expect(errors).toEqual([])
    expect(notes.length).toBeGreaterThanOrEqual(8)
    for (const n of notes) expect(allowed.has(midiToName(n.midi))).toBe(true)
  })
  it('transposes to other keys within the playable range', () => {
    for (const lick of LICKS)
      for (let k = 0; k < 12; k++) {
        const notes = buildLick(lick, k, 'minor')
        const a = buildLick(lick, 9, 'minor')
        for (const n of notes) {
          expect(n.fret).toBeGreaterThanOrEqual(1)
          expect(n.fret).toBeLessThanOrEqual(24)
        }
        const d = (notes[0].midi - a[0].midi + 120) % 12
        expect(d).toBe((k - 9 + 12) % 12)
      }
  })
})
