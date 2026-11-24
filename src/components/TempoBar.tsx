import { useEffect, useRef, useState } from 'react'
import { windows } from '../practice/timing'

interface Props {
  getClock: () => { beats: number; status: string } | null
  interval: number
  /** recent timing offsets in ms, negative = early */
  offsets: number[]
  running: boolean
}

/**
 * Metronome helpers shown above the key line: four beat lights (with a count-in number) and a
 * timing gauge, a horizontal bar with the beat in the middle where each press lands left
 * (early) or right (late).
 */
export function TempoBar({ getClock, interval, offsets, running }: Props) {
  const [beat, setBeat] = useState<{ index: number; countIn: number | null } | null>(null)
  const last = useRef('')

  useEffect(() => {
    if (!running) {
      setBeat(null)
      last.current = ''
      return
    }
    let raf = 0
    const loop = () => {
      const c = getClock()
      if (c) {
        const whole = Math.floor(c.beats)
        const next = whole < 0 ? { index: 4 + whole, countIn: -whole } : { index: ((whole % 4) + 4) % 4, countIn: null }
        const key = `${whole}`
        if (key !== last.current) {
          last.current = key
          setBeat(next)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, getClock])

  const w = windows(interval || 0.25)
  const range = w.good * 1000 * 1.4 // ms shown on each side
  const pos = (ms: number) => 50 + (Math.max(-range, Math.min(range, ms)) / range) * 50
  const recent = offsets.slice(-8)
  const latest = recent[recent.length - 1]
  const verdict =
    latest === undefined ? '' : Math.abs(latest) <= w.perfect * 1000 ? '딱 맞음' : latest < 0 ? `${-latest}ms 빠름` : `${latest}ms 느림`

  return (
    <div className="tempo">
      <div className="beats" aria-label="현재 박자">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`beat ${beat && beat.index === i ? (beat.countIn ? 'count' : i === 0 ? 'on down' : 'on') : ''}`}>
            {beat && beat.index === i && beat.countIn ? beat.countIn : i + 1}
          </span>
        ))}
        <span className="beat-caption">{beat?.countIn ? '준비' : running ? '' : '시작하면 박자가 표시돼요'}</span>
      </div>
      <div className="gauge" aria-label="타이밍 게이지">
        <div className="gauge-track">
          <div className="gauge-good" style={{ left: `${pos(-w.good * 1000)}%`, right: `${100 - pos(w.good * 1000)}%` }} />
          <div className="gauge-perfect" style={{ left: `${pos(-w.perfect * 1000)}%`, right: `${100 - pos(w.perfect * 1000)}%` }} />
          <div className="gauge-center" />
          {recent.map((ms, i) => (
            <div
              key={`${offsets.length - recent.length + i}`}
              className={`gauge-mark ${i === recent.length - 1 ? 'latest' : ''} ${Math.abs(ms) <= w.perfect * 1000 ? 'perfect' : Math.abs(ms) <= w.good * 1000 ? 'good' : 'off'}`}
              style={{ left: `${pos(ms)}%`, opacity: 0.25 + (0.75 * (i + 1)) / recent.length }}
            />
          ))}
        </div>
        <div className="gauge-labels">
          <span>◀ 빠름</span>
          <span className="gauge-verdict">{verdict}</span>
          <span>느림 ▶</span>
        </div>
      </div>
    </div>
  )
}
