import { Fragment } from 'react'
import type { Step } from '../engine/types'
import { keyLabelForFinger, type Hand } from '../practice/keymap'
import { FINGER_COLOR } from './fingers'

interface Props {
  steps: Step[]
  hand: Hand
  /** current position, or -1 when not playing */
  pos: number
  /** indexes that had a wrong press in this loop */
  missed?: Set<number>
  /** per-step heat 0..1 for the result view */
  heat?: number[]
  size?: 'large' | 'small'
}

/** The loop as a line of keys, coloured by finger. */
export function SequenceView({ steps, hand, pos, missed, heat, size = 'large' }: Props) {
  return (
    <div className={`seq ${size}`}>
      {steps.map((s, i) => {
        const state = pos < 0 ? '' : i < pos ? 'done' : i === pos ? 'current' : 'todo'
        const h = heat?.[i] ?? 0
        return (
          <Fragment key={i}>
            {s.gap && <span className="seq-gap" />}
            <span
              className={`seq-key ${state} ${missed?.has(i) ? 'missed' : ''} ${heat ? 'heat' : ''}`}
              style={
                {
                  '--fc': FINGER_COLOR[s.finger],
                  '--heat': h,
                } as React.CSSProperties
              }
              title={s.where}
            >
              {keyLabelForFinger(hand, s.finger).toLowerCase()}
              {s.tech && <sup>{s.tech === 's' ? '/' : s.tech.toUpperCase()}</sup>}
            </span>
          </Fragment>
        )
      })}
    </div>
  )
}
