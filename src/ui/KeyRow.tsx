import type { Finger } from '../music/boxes'
import { KEYMAPS, type Hand } from '../practice/keymap'
import { FINGER_COLOR, FINGER_SHORT } from './fingers'

interface Props {
  hand: Hand
  /** finger to highlight as "press this next" (learn mode) */
  next: Finger | null
  flash: { finger: Finger; ok: boolean; at: number } | null
  onPress: (f: Finger) => void
}

export function KeyRow({ hand, next, flash, onPress }: Props) {
  return (
    <div className="keyrow">
      {KEYMAPS[hand].map((k) => (
        <button
          key={k.code}
          type="button"
          tabIndex={-1}
          className={`key ${next === k.finger ? 'next' : ''}`}
          style={{ '--fc': FINGER_COLOR[k.finger] } as React.CSSProperties}
          onPointerDown={(e) => {
            e.preventDefault()
            onPress(k.finger)
          }}
        >
          {flash && flash.finger === k.finger && <span key={flash.at} className={`key-flash ${flash.ok ? 'ok' : 'bad'}`} />}
          <span className="key-cap">{k.label}</span>
          <span className="key-sub">
            {k.finger} {FINGER_SHORT[k.finger]}
          </span>
        </button>
      ))}
    </div>
  )
}
