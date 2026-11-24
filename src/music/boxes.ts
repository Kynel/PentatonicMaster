import { TUNING } from './theory'

export type Finger = 1 | 2 | 3 | 4
export type ScaleType = 'minor' | 'major'

export interface FretNote {
  /** 0 = low E (6th string) … 5 = high e (1st string) */
  string: number
  fret: number
  finger: Finger
  midi: number
  /** true when this note is the tonic of the selected scale */
  isRoot: boolean
}

type Shape = { start: number; strings: [number, Finger][][] }

/**
 * The five minor-pentatonic box shapes. `start` is the index-finger fret relative to the
 * minor root on the low E string; each string lists [fret offset from start, finger].
 * Box 3 has a small position shift on the B/e strings (index moves up one fret), which is
 * how it is usually taught.
 */
const SHAPES: Shape[] = [
  { start: 0, strings: [[[0, 1], [3, 4]], [[0, 1], [2, 3]], [[0, 1], [2, 3]], [[0, 1], [2, 3]], [[0, 1], [3, 4]], [[0, 1], [3, 4]]] },
  { start: 2, strings: [[[1, 2], [3, 4]], [[0, 1], [3, 4]], [[0, 1], [3, 4]], [[0, 1], [2, 3]], [[1, 2], [3, 4]], [[1, 2], [3, 4]]] },
  { start: 4, strings: [[[1, 2], [3, 4]], [[1, 2], [3, 4]], [[1, 2], [3, 4]], [[0, 1], [3, 4]], [[1, 1], [4, 4]], [[1, 1], [3, 3]]] },
  { start: 7, strings: [[[0, 1], [3, 4]], [[0, 1], [3, 4]], [[0, 1], [2, 3]], [[0, 1], [2, 3]], [[1, 2], [3, 4]], [[0, 1], [3, 4]]] },
  { start: 9, strings: [[[1, 2], [3, 4]], [[1, 2], [3, 4]], [[0, 1], [3, 4]], [[0, 1], [3, 4]], [[1, 2], [3, 4]], [[1, 2], [3, 4]]] },
]

export const BOX_COUNT = SHAPES.length

/** Pitch class of the relative-minor root for a given key. */
export function minorRootPc(keyPc: number, scale: ScaleType): number {
  return scale === 'minor' ? keyPc : (keyPc + 9) % 12
}

/**
 * Notes of one pentatonic box, ordered the way they are played ascending:
 * low string → high string, low fret → high fret on each string.
 * Box positions are kept between fret 2 and 13 (index finger) so every box is playable.
 */
export function getBoxNotes(keyPc: number, scale: ScaleType, box: number): FretNote[] {
  const shape = SHAPES[box]
  const rootFret = (((minorRootPc(keyPc, scale) - 4) % 12) + 12) % 12
  const raw = rootFret + shape.start
  const start = ((((raw - 2) % 12) + 12) % 12) + 2
  const tonicPc = ((keyPc % 12) + 12) % 12
  const notes: FretNote[] = []
  shape.strings.forEach((frets, string) => {
    for (const [offset, finger] of frets) {
      const fret = start + offset
      const midi = TUNING[string] + fret
      notes.push({ string, fret, finger, midi, isRoot: midi % 12 === tonicPc })
    }
  })
  return notes
}
