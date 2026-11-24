import type { Finger } from '../music/boxes'

/** One step of an exercise: which finger to press, plus optional context for display. */
export interface Step {
  finger: Finger
  /** starts a new visual group (shown as a gap) */
  gap?: boolean
  /** e.g. "B 8" — string and fret, when the exercise comes from tab */
  where?: string
  tech?: 'h' | 'p' | 's'
  /** pitch to play on a correct press */
  midi: number
}

export type Judgement = 'perfect' | 'good' | 'miss' | 'wrong'
export type Mode = 'learn' | 'tempo'
