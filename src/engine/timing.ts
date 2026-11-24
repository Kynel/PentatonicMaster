/** Seconds between notes for a BPM and a number of notes per beat. */
export function noteInterval(bpm: number, perBeat: number): number {
  return 60 / bpm / perBeat
}

/**
 * Hit windows in seconds. They scale with the note interval so slow tempos stay forgiving and
 * fast ones do not overlap neighbouring notes.
 */
export function hitWindows(interval: number): { perfect: number; good: number } {
  // never wider than half the gap between notes, so neighbours do not compete for a press
  const good = Math.min(0.16, Math.max(0.07, interval * 0.48), interval * 0.5)
  const perfect = Math.min(0.055, Math.max(0.03, interval * 0.2))
  return { perfect: Math.min(perfect, good), good }
}
