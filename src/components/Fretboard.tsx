import type { FretNote } from '../music/boxes'
import { STRING_LABELS } from '../music/theory'

interface Props {
  notes: FretNote[]
  target: FretNote | null
  next: FretNote | null
}

const MARKERS = new Set([3, 5, 7, 9, 15, 17, 19, 21])
const same = (a: FretNote | null, b: FretNote) => !!a && a.string === b.string && a.fret === b.fret

export function Fretboard({ notes, target, next }: Props) {
  const frets = notes.map((n) => n.fret)
  const lo = Math.max(0, Math.min(...frets) - 1)
  const hi = Math.max(lo + 6, Math.max(...frets) + 1)
  const left = 34
  const top = 22
  const width = 640
  const fw = (width - left - 12) / (hi - lo)
  const sh = 26
  const height = top + sh * 5 + 34
  const xLine = (f: number) => left + (f - lo) * fw
  const xNote = (f: number) => left + (f - lo - 0.5) * fw
  const yString = (s: number) => top + (5 - s) * sh

  return (
    <svg className="fretboard" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="지판">
      <rect x={left} y={top - 8} width={xLine(hi) - left} height={sh * 5 + 16} rx={4} className="fb-wood" />
      {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((f) => (
        <g key={f}>
          <line x1={xLine(f)} x2={xLine(f)} y1={top - 8} y2={top + sh * 5 + 8} className={f === 0 ? 'fb-nut' : 'fb-fret'} />
          {f > lo && (
            <text x={xNote(f)} y={height - 6} className="fb-fretnum">{f}</text>
          )}
          {f > lo && MARKERS.has(f) && <circle cx={xNote(f)} cy={top + sh * 2.5} r={5} className="fb-marker" />}
          {f > lo && f === 12 && (
            <>
              <circle cx={xNote(f)} cy={top + sh * 1.5} r={5} className="fb-marker" />
              <circle cx={xNote(f)} cy={top + sh * 3.5} r={5} className="fb-marker" />
            </>
          )}
        </g>
      ))}
      {STRING_LABELS.map((label, s) => (
        <g key={s}>
          <line x1={left} x2={xLine(hi)} y1={yString(s)} y2={yString(s)} className="fb-string" strokeWidth={1 + (5 - s) * 0.35} />
          <text x={left - 14} y={yString(s) + 4} className="fb-label">{label}</text>
        </g>
      ))}
      {notes.map((n) => {
        const isTarget = same(target, n)
        const isNext = !isTarget && same(next, n)
        const cls = ['fb-note', n.isRoot ? 'root' : '', isTarget ? 'target' : '', isNext ? 'next' : ''].join(' ')
        return (
          <g key={`${n.string}-${n.fret}`} className={cls}>
            {isTarget && <circle cx={xNote(n.fret)} cy={yString(n.string)} r={16} className="fb-pulse" />}
            <circle cx={xNote(n.fret)} cy={yString(n.string)} r={11} />
            <text x={xNote(n.fret)} y={yString(n.string) + 4}>{isTarget && target ? target.finger : n.finger}</text>
          </g>
        )
      })}
    </svg>
  )
}
