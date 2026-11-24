import { describe, expect, it } from 'vitest'
import type { Finger } from '../music/boxes'
import { LearnSession } from './learn'
import { TempoSession } from './tempo'
import type { Step } from './types'

const steps = (fs: number[]): Step[] => fs.map((f) => ({ finger: f as Finger, midi: 60 }))

describe('TempoSession', () => {
  const make = (ladder = false) => {
    const s = new TempoSession(steps([1, 2, 3, 4]), { bpm: 60, perBeat: 1, loops: 2, ladder, ladderStep: 5 }, 0)
    s.generate(100)
    return s
  }

  it('lays notes after a one-bar count-in', () => {
    const s = make()
    expect(s.notes.map((n) => n.time)).toEqual([4, 5, 6, 7, 8, 9, 10, 11])
    expect(s.clicks[0]).toEqual({ time: 0, accent: true })
  })

  it('judges by the nearest note, so one late press does not shift the rest', () => {
    const s = make()
    s.update(4.5) // first note missed
    expect(s.notes[0].judgement).toBe('miss')
    expect(s.press(2, 5.01)?.judgement).toBe('perfect')
    expect(s.press(3, 6.1)?.judgement).toBe('good')
    expect(s.notes[2].offset).toBe(100)
  })

  it('wrong finger in the window is wrong, far presses are strays', () => {
    const s = make()
    expect(s.press(4, 4.0)?.judgement).toBe('wrong')
    expect(s.press(2, 4.5)).toBeNull()
    expect(s.strays).toBe(1)
  })

  it('finishes after the last loop and reports loops', () => {
    const s = make()
    ;[1, 2, 3, 4, 1, 2, 3, 4].forEach((f, i) => s.press(f as Finger, 4 + i))
    s.update(20)
    expect(s.finished).toBe(true)
    expect(s.loopsDone.map((l) => l.clean)).toEqual([true, true])
  })

  it('speed ladder raises BPM after a clean loop and rests a bar in between', () => {
    const s = new TempoSession(steps([1, 2, 3, 4]), { bpm: 60, perBeat: 1, loops: 2, ladder: true, ladderStep: 30 }, 0)
    s.generate(30)
    expect(s.notes).toHaveLength(4) // waits for the decision
    ;[1, 2, 3, 4].forEach((f, i) => s.press(f as Finger, 4 + i))
    s.update(7.5)
    expect(s.bpm).toBe(90)
    s.generate(40)
    expect(s.notes).toHaveLength(8)
    expect(s.notes[4].time).toBeGreaterThan(11) // after the rest bar
  })
})

describe('LearnSession', () => {
  it('only advances on the right finger and counts errors per step once', () => {
    const s = new LearnSession(steps([2, 4]), 2)
    expect(s.press(1, 0)).toBe('wrong')
    expect(s.press(3, 0.1)).toBe('wrong')
    expect(s.press(2, 0.2)).toBe('ok')
    expect(s.press(4, 0.3)).toBe('ok')
    expect(s.errors).toEqual([1, 0])
    s.press(2, 0.4)
    s.press(4, 0.5)
    expect(s.finished).toBe(true)
    expect(s.loopTimes.length).toBe(2)
  })
})
