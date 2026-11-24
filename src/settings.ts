import { useEffect, useState } from 'react'
import type { ScaleType } from './music/boxes'
import type { Hand } from './practice/keymap'
import type { Mode } from './practice/usePractice'

export interface CustomLick {
  id: string
  title: string
  tab: string
}

export interface Settings {
  /** practise generated scale patterns or solo licks */
  source: 'pattern' | 'lick'
  lickId: string
  customLicks: CustomLick[]
  keyPc: number
  scale: ScaleType
  box: number
  pattern: string
  mode: Mode
  bpm: number
  notesPerBeat: number
  autoSpeed: boolean
  speedStep: number
  hand: Hand
  sound: boolean
  latencyMs: number
}

export const DEFAULT_SETTINGS: Settings = {
  source: 'pattern',
  lickId: 'rock-triplet-roll',
  customLicks: [],
  keyPc: 9, // A
  scale: 'minor',
  box: 0,
  pattern: 'up',
  mode: 'free',
  bpm: 80,
  notesPerBeat: 2,
  autoSpeed: false,
  speedStep: 4,
  hand: 'left',
  sound: true,
  latencyMs: 0,
}

const STORAGE_KEY = 'pentatonic-master/settings/v1'

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    // storage unavailable: fall back to defaults
  }
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore
    }
  }, [settings])
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }))
  return { settings, update, setSettings }
}
