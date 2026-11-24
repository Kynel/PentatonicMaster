import type { Finger } from '../music/boxes'
import type { Step } from './types'

/**
 * Untimed session: press the steps in order. A wrong press is counted against the current
 * step and does not advance, so the sequence is always played correctly in the end.
 */
export class LearnSession {
  readonly steps: Step[]
  readonly loops: number
  pos = 0
  loop = 0
  /** wrong presses per step index, summed over loops */
  errors: number[]
  /** whether the current step already had a wrong press this loop */
  private stepMissed = false
  /** steps that had a wrong press in the current loop */
  loopMissed = new Set<number>()
  correct = 0
  wrong = 0
  firstPress: number | null = null
  lastPress: number | null = null
  loopTimes: number[] = []
  private loopStart: number | null = null
  finished = false

  constructor(steps: Step[], loops: number) {
    this.steps = steps
    this.loops = loops
    this.errors = steps.map(() => 0)
  }

  press(finger: Finger, t: number): 'ok' | 'wrong' | null {
    if (this.finished) return null
    if (this.firstPress === null) this.firstPress = t
    if (this.loopStart === null) this.loopStart = t
    const step = this.steps[this.pos]
    if (finger !== step.finger) {
      this.wrong++
      if (!this.stepMissed) this.errors[this.pos]++
      this.stepMissed = true
      this.loopMissed.add(this.pos)
      return 'wrong'
    }
    this.correct++
    this.lastPress = t
    this.stepMissed = false
    this.pos++
    if (this.pos === this.steps.length) {
      this.loopTimes.push(t - this.loopStart)
      this.loopStart = null
      this.loopMissed = new Set()
      this.pos = 0
      this.loop++
      if (this.loop >= this.loops) this.finished = true
    }
    return 'ok'
  }

  /** Correct notes per second so far. */
  get speed(): number {
    if (this.firstPress === null || this.lastPress === null || this.lastPress === this.firstPress) return 0
    return (this.correct - 1) / (this.lastPress - this.firstPress)
  }
}
