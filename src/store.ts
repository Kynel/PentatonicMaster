import { useEffect, useState } from 'react'
import type { CustomPattern } from './exercises'
import type { Mode } from './engine/types'
import type { Hand } from './practice/keymap'

export interface HistoryEntry {
  at: number
  mode: Mode
  bpm?: number
  accuracy: number
  speed?: number
}

export interface ExRecord {
  /** best BPM finished with at least 95% accuracy */
  bestBpm?: number
  /** best notes/second in learn mode with at least 95% accuracy */
  bestSpeed?: number
  history: HistoryEntry[]
}

export interface Prefs {
  exerciseId: string
  box: number
  mode: Mode
  learnLoops: number
  tempoLoops: number
  ladder: boolean
  hand: Hand
  sound: boolean
  click: boolean
  latencyMs: number
  /** remembered tempo per exercise key */
  bpm: { [key: string]: number }
  /** remembered notes-per-beat per exercise key */
  perBeat: { [key: string]: number }
}

export interface Store {
  prefs: Prefs
  customs: CustomPattern[]
  records: { [key: string]: ExRecord }
}

const DEFAULT: Store = {
  prefs: {
    exerciseId: 'drill-chromatic-up',
    box: 0,
    mode: 'learn',
    learnLoops: 5,
    tempoLoops: 8,
    ladder: false,
    hand: 'left',
    sound: true,
    click: true,
    latencyMs: 0,
    bpm: {},
    perBeat: {},
  },
  customs: [],
  records: {},
}

const KEY = 'pentatonic-master/v2'

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<Store>
      return { ...DEFAULT, ...s, prefs: { ...DEFAULT.prefs, ...s.prefs } }
    }
  } catch {
    // storage unavailable
  }
  return DEFAULT
}

export function useStore() {
  const [store, setStore] = useState<Store>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store))
    } catch {
      // ignore
    }
  }, [store])
  const setPrefs = (p: Partial<Prefs>) => setStore((s) => ({ ...s, prefs: { ...s.prefs, ...p } }))
  return { store, setStore, setPrefs }
}
