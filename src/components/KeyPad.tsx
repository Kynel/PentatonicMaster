import type { Finger } from '../music/boxes'
import { FINGER_NAMES, KEYMAPS, type Hand } from '../practice/keymap'

interface Props {
  hand: Hand
  target: Finger | null
  pressed: { finger: Finger; ok: boolean; at: number } | null
  onPress: (f: Finger) => void
}

export function KeyPad({ hand, target, pressed, onPress }: Props) {
  return (
    <div className="keypad">
      {KEYMAPS[hand].map((k) => (
        <button
          key={k.code}
          type="button"
          className={`key ${target === k.finger ? 'target' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault()
            onPress(k.finger)
          }}
          tabIndex={-1}
        >
          {pressed && pressed.finger === k.finger && (
            <span key={pressed.at} className={`key-flash ${pressed.ok ? 'ok' : 'bad'}`} />
          )}
          <span className="key-label">{k.label}</span>
          <span className="key-finger">
            {k.finger} · {FINGER_NAMES[k.finger]}
          </span>
        </button>
      ))}
    </div>
  )
}
