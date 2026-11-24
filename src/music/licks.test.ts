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

describe('key sequences', () => {
  it('reads a s d f as fingers 1-4 and spaces as group breaks', () => {
    const { notes, errors } = parseTab('sfdf sa')
    expect(errors).toEqual([])
    expect(notes.map((n) => n.finger)).toEqual([2, 4, 3, 4, 2, 1])
    expect(notes.map((n) => !!n.gap)).toEqual([false, false, false, false, true, false])
    expect(notes.every((n) => n.string === -1)).toBe(true)
  })
  it('accepts j k l ; too and rejects other letters', () => {
    expect(parseTab('jkl;').notes.map((n) => n.finger)).toEqual([1, 2, 3, 4])
    expect(parseTab('sfx').errors).toHaveLength(1)
  })
})

describe('built-in licks', () => {
  // A minor pentatonic plus the 9th (B) and the blue note (D#)
  const allowed = new Set(['A', 'C', 'D', 'E', 'G', 'B', 'D#'])
  it.each(LICKS.filter((l) => l.style !== 'keys').map((l) => [l.id, l] as const))('%s parses cleanly and stays in A minor', (_, lick) => {
    const { notes, errors } = parseTab(lick.tab)
    expect(errors).toEqual([])
    expect(notes.length).toBeGreaterThanOrEqual(8)
    for (const n of notes) expect(allowed.has(midiToName(n.midi))).toBe(true)
  })
  it('transposes to other keys within the playable range', () => {
    for (const lick of LICKS.filter((l) => l.style !== 'keys'))
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
