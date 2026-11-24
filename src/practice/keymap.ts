import type { Finger } from '../music/boxes'

export type Hand = 'left' | 'right'

export interface KeyBinding {
  code: string
  label: string
  finger: Finger
}

/**
 * Keyboard finger → guitar fretting finger. Uses KeyboardEvent.code so it works the same
 * with a Korean IME or any keyboard layout.
 */
export const KEYMAPS: Record<Hand, KeyBinding[]> = {
  left: [
    { code: 'KeyA', label: 'A', finger: 4 },
    { code: 'KeyS', label: 'S', finger: 3 },
    { code: 'KeyD', label: 'D', finger: 2 },
    { code: 'KeyF', label: 'F', finger: 1 },
  ],
  right: [
    { code: 'KeyJ', label: 'J', finger: 1 },
    { code: 'KeyK', label: 'K', finger: 2 },
    { code: 'KeyL', label: 'L', finger: 3 },
    { code: 'Semicolon', label: ';', finger: 4 },
  ],
}

export const FINGER_NAMES: Record<Finger, string> = { 1: '검지', 2: '중지', 3: '약지', 4: '새끼' }

export function fingerForCode(hand: Hand, code: string): Finger | null {
  return KEYMAPS[hand].find((k) => k.code === code)?.finger ?? null
}

export function keyLabelForFinger(hand: Hand, finger: Finger): string {
  return KEYMAPS[hand].find((k) => k.finger === finger)?.label ?? '?'
}
