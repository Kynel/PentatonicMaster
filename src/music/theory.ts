export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** Standard tuning, index 0 = low E (6th string) … 5 = high e (1st string). MIDI numbers. */
export const TUNING = [40, 45, 50, 55, 59, 64] as const

export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'] as const

/** Display label for a string index, e.g. 0 → "6번줄 E". */
export function stringLabel(s: number): string {
  return `${6 - s}번줄(${STRING_LABELS[s]})`
}

export function pitchClassName(pc: number): string {
  return NOTE_NAMES[((pc % 12) + 12) % 12]
}

export function midiToName(midi: number): string {
  return pitchClassName(midi)
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}
