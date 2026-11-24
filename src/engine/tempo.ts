import type { Finger } from '../music/boxes'
import { hitWindows, noteInterval } from './timing'
import type { Judgement, Step } from './types'

export interface TempoOptions {
  bpm: number
  perBeat: number
  /** loops to play; the session ends after them */
  loops: number
  /** raise/lower BPM between loops based on whether the loop was clean */
  ladder: boolean
  ladderStep: number
}

export interface TimedNote {
  k: number
  loop: number
  idx: number
  time: number
  finger: Finger
  judgement?: Judgement
  /** ms, negative = early */
  offset?: number
}

export interface Click {
  time: number
  accent: boolean
}

export interface LoopReport {
  loop: number
  bpm: number
  clean: boolean
  accuracy: number
}

/**
 * Rhythm-game style tempo session. Notes are laid on a time grid (with a one-bar count-in, and
 * a one-bar rest between loops when the speed ladder is on). A press is matched to the nearest
 * pending note in its hit window instead of a strict "current note", so one late press never
 * pushes every later note out of step.
 */
export class TempoSession {
  readonly steps: Step[]
  readonly opts: TempoOptions
  bpm: number
  interval: number
  notes: TimedNote[] = []
  clicks: Click[] = []
  loopsDone: LoopReport[] = []
  strays = 0
  startTime: number
  endTime: number | null = null
  finished = false

  // generator cursor
  private genTime: number
  private genSlot = 0
  private genLoop = 0
  private genIdx = 0
  private gapLeft: number
  private waitingFor: number | null = null
  private allGenerated = false

  constructor(steps: Step[], opts: TempoOptions, startTime: number) {
    this.steps = steps
    this.opts = opts
    this.bpm = opts.bpm
    this.interval = noteInterval(opts.bpm, opts.perBeat)
    this.startTime = startTime
    this.genTime = startTime
    this.gapLeft = 4 * opts.perBeat // count-in bar
  }

  get windows() {
    return hitWindows(this.interval)
  }

  /** Time of the first note (end of count-in). */
  get firstNoteTime(): number {
    return this.startTime + 4 * this.opts.perBeat * noteInterval(this.opts.bpm, this.opts.perBeat)
  }

  /** Extend the timeline up to `until` (seconds). */
  generate(until: number): void {
    const len = this.steps.length
    while (this.genTime < until && !this.allGenerated) {
      if (this.gapLeft === 0 && this.waitingFor !== null) break // ladder decision pending
      if (this.genSlot % this.opts.perBeat === 0) {
        this.clicks.push({ time: this.genTime, accent: this.genSlot % (4 * this.opts.perBeat) === 0 })
      }
      if (this.gapLeft > 0) {
        this.gapLeft--
      } else {
        const step = this.steps[this.genIdx]
        this.notes.push({ k: this.notes.length, loop: this.genLoop, idx: this.genIdx, time: this.genTime, finger: step.finger })
        this.genIdx++
        if (this.genIdx === len) {
          this.genIdx = 0
          this.genLoop++
          if (this.genLoop >= this.opts.loops) {
            this.allGenerated = true
            this.endTime = this.genTime + this.interval
          } else if (this.opts.ladder) {
            this.gapLeft = 4 * this.opts.perBeat
            this.waitingFor = this.genLoop - 1
            // a rest bar starts on a downbeat: realign the bar counter
            this.genSlot = -1
          }
        }
      }
      this.genTime += this.interval
      this.genSlot++
    }
  }

  /** Mark notes whose window has passed as missed and settle finished loops. */
  update(now: number): void {
    const w = this.windows
    for (const n of this.notes) {
      if (n.judgement === undefined && now > n.time + w.good) n.judgement = 'miss'
    }
    this.settleLoops()
    if (this.allGenerated && this.notes.every((n) => n.judgement !== undefined)) this.finished = true
  }

  private settleLoops(): void {
    const len = this.steps.length
    for (;;) {
      const loop = this.loopsDone.length
      const ofLoop = this.notes.filter((n) => n.loop === loop)
      if (ofLoop.length < len || ofLoop.some((n) => n.judgement === undefined)) return
      const hits = ofLoop.filter((n) => n.judgement === 'perfect' || n.judgement === 'good').length
      const clean = hits === len
      this.loopsDone.push({ loop, bpm: this.bpm, clean, accuracy: hits / len })
      if (this.waitingFor === loop) {
        const next = clean ? this.bpm + this.opts.ladderStep : Math.max(30, this.bpm - this.opts.ladderStep)
        this.bpm = Math.min(400, next)
        this.interval = noteInterval(this.bpm, this.opts.perBeat)
        this.waitingFor = null
      }
    }
  }

  /**
   * Judge a press at time `t`. Returns the judged note, or null for a stray press that is
   * outside every hit window.
   */
  press(finger: Finger, t: number): TimedNote | null {
    const w = this.windows
    const candidates = this.notes.filter((n) => n.judgement === undefined && Math.abs(t - n.time) <= w.good)
    if (candidates.length === 0) {
      this.strays++
      return null
    }
    const match = candidates.find((n) => n.finger === finger)
    const note = match ?? candidates[0]
    const delta = t - note.time
    note.offset = Math.round(delta * 1000)
    note.judgement = !match ? 'wrong' : Math.abs(delta) <= w.perfect ? 'perfect' : 'good'
    return note
  }
}
