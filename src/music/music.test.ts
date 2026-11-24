import { describe, expect, it } from 'vitest'
import { getBoxNotes } from './boxes'
import { getPattern, PATTERNS } from './patterns'
import { midiToName } from './theory'

const A = 9
const names = (box: number) => getBoxNotes(A, 'minor', box).map((n) => `${n.fret}${midiToName(n.midi)}`)

describe('pentatonic boxes', () => {
  it('A minor box 1 sits at fret 5 with the expected notes and fingers', () => {
    const notes = getBoxNotes(A, 'minor', 0)
    expect(notes.map((n) => n.fret)).toEqual([5, 8, 5, 7, 5, 7, 5, 7, 5, 8, 5, 8])
    expect(notes.map((n) => n.finger)).toEqual([1, 4, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4])
    expect(notes.filter((n) => n.isRoot).length).toBe(3)
  })

  it('every box contains only A minor pentatonic notes, 2 per string, ascending in pitch', () => {
    const allowed = new Set(['A', 'C', 'D', 'E', 'G'])
    for (let b = 0; b < 5; b++) {
      const notes = getBoxNotes(A, 'minor', b)
      expect(notes).toHaveLength(12)
      for (const n of notes) expect(allowed.has(midiToName(n.midi))).toBe(true)
      for (let i = 1; i < notes.length; i++) expect(notes[i].midi).toBeGreaterThan(notes[i - 1].midi)
    }
    expect(names(1)).toEqual(['8C', '10D', '7E', '10G', '7A', '10C', '7D', '9E', '8G', '10A', '8C', '10D'])
  })

  it('C major uses the same shapes as A minor, with C as the root', () => {
    const maj = getBoxNotes(0, 'major', 0)
    const min = getBoxNotes(A, 'minor', 0)
    expect(maj.map((n) => n.midi)).toEqual(min.map((n) => n.midi))
    expect(maj.filter((n) => n.isRoot).every((n) => midiToName(n.midi) === 'C')).toBe(true)
  })

  it('keeps boxes in a playable fret range for every key', () => {
    for (let k = 0; k < 12; k++)
      for (let b = 0; b < 5; b++)
        for (const n of getBoxNotes(k, 'minor', b)) {
          expect(n.fret).toBeGreaterThanOrEqual(2)
          expect(n.fret).toBeLessThanOrEqual(17)
        }
  })
})

describe('patterns', () => {
  const notes = getBoxNotes(A, 'minor', 0)
  it('builds non-empty sequences from box notes', () => {
    for (const p of PATTERNS) expect(p.build(notes).length).toBeGreaterThan(0)
  })
  it('up-down loops without repeating the turnaround notes', () => {
    const seq = getPattern('updown').build(notes)
    expect(seq).toHaveLength(22)
    expect(seq[11]).toBe(notes[11])
    expect(seq[12]).toBe(notes[10])
  })
  it('threes go 1-2-3, 2-3-4 …', () => {
    const seq = getPattern('threes').build(notes)
    expect(seq.slice(0, 6)).toEqual([notes[0], notes[1], notes[2], notes[1], notes[2], notes[3]])
  })
  it('six-note descending run steps down one string per group', () => {
    const seq = getPattern('sixes-down').build(notes)
    expect(seq.slice(0, 6).map((n) => n.string)).toEqual([5, 5, 4, 4, 3, 3])
    expect(seq.slice(6, 12).map((n) => n.string)).toEqual([4, 4, 3, 3, 2, 2])
  })
})
