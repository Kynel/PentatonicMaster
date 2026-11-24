export type Judgement = 'perfect' | 'good' | 'miss' | 'wrong'

/** Timing windows (seconds) scaled to the note interval, with sensible floors/caps. */
export function windows(interval: number): { perfect: number; good: number } {
  const good = Math.min(0.18, Math.max(0.08, interval * 0.5))
  const perfect = Math.min(0.06, Math.max(0.035, interval * 0.2))
  return { perfect, good: Math.max(good, perfect) }
}

/** Seconds between notes for a BPM and a number of notes per beat. */
export function noteInterval(bpm: number, notesPerBeat: number): number {
  return 60 / bpm / notesPerBeat
}

/**
 * Judge a key press against the expected time of the current target note.
 * Returns null when the press is too early to count for this note.
 */
export function judgePress(
  delta: number,
  correctFinger: boolean,
  interval: number,
): Judgement | null {
  const w = windows(interval)
  if (delta < -w.good) return null
  if (!correctFinger) return 'wrong'
  if (Math.abs(delta) <= w.perfect) return 'perfect'
  if (delta <= w.good) return 'good'
  return 'miss'
}
