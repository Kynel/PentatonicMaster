import type { FretNote } from '../music/boxes'
import { STRING_LABELS } from '../music/theory'
import type { Judgement } from '../practice/timing'
import { keyLabelForFinger, type Hand } from '../practice/keymap'

interface Props {
  seq: FretNote[]
  index: number
  results: (Judgement | undefined)[]
  hand: Hand
  active: boolean
}

const TECH_LABEL = { h: 'H', p: 'P', s: '/' } as const

const BEHIND = 3
const AHEAD = 13

export function NoteTape({ seq, index, results, hand, active }: Props) {
  if (seq.length === 0) return null
  const items = []
  for (let off = -BEHIND; off <= AHEAD; off++) {
    const p = index + off
    if (p < 0) {
      items.push(<div key={off} className="tape-item empty" />)
      continue
    }
    const i = p % seq.length
    const n = seq[i]
    const r = off < 0 && p < seq.length ? results[i] : undefined
    const cls = ['tape-item', off === 0 ? 'current' : '', off < 0 ? 'past' : '', r ?? '', i === 0 && off > 0 ? 'loop-start' : '']
      .filter(Boolean)
      .join(' ')
    items.push(
      <div key={off} className={cls} title={`${STRING_LABELS[n.string]}줄 ${n.fret}프렛`}>
        {n.tech && <span className="tape-tech">{TECH_LABEL[n.tech]}</span>}
        <span className="tape-finger">{n.finger}</span>
        <span className="tape-key">{keyLabelForFinger(hand, n.finger)}</span>
        <span className="tape-pos">{STRING_LABELS[n.string]} {n.fret}</span>
      </div>,
    )
  }
  return (
    <div className={`tape ${active ? 'active' : ''}`} aria-label="다음에 칠 음">
      {items}
    </div>
  )
}
