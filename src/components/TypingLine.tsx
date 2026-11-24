import { Fragment } from 'react'
import type { FretNote } from '../music/boxes'
import { keyLabelForFinger, type Hand } from '../practice/keymap'
import type { Judgement } from '../practice/timing'

interface Props {
  seq: FretNote[]
  index: number
  results: (Judgement | undefined)[]
  hand: Hand
  loops: number
}

/**
 * The whole loop as a line of keys to type, like a typing trainer. Typed keys are coloured by
 * result, the current key is underlined, and groups are separated by a small space.
 */
export function TypingLine({ seq, index, results, hand, loops }: Props) {
  return (
    <div className="typing" aria-label="입력할 키 순서">
      <div className="typing-line">
        {seq.map((n, i) => {
          const r = i < index ? results[i] : undefined
          const state = i === index ? 'current' : i < index ? `done ${r ?? 'perfect'}` : ''
          return (
            <Fragment key={i}>
              {n.gap && <span className="typing-gap" />}
              <span className={`typing-key ${state}`}>{keyLabelForFinger(hand, n.finger).toLowerCase()}</span>
            </Fragment>
          )
        })}
      </div>
      <div className="typing-meta">
        {seq.length}타 한 바퀴 · {loops}바퀴 완료
      </div>
    </div>
  )
}
