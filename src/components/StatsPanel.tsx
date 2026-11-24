import type { Mode, Stats } from '../practice/usePractice'

interface Props {
  stats: Stats
  mode: Mode
  bpm: number
}

function average(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

export function StatsPanel({ stats, mode, bpm }: Props) {
  const hits = stats.perfect + stats.good
  const total = hits + stats.miss + stats.wrong
  const accuracy = total ? Math.round((hits / total) * 100) : null

  let speed: string
  let speedSub: string
  if (mode === 'free') {
    const t = stats.pressTimes
    const nps = t.length >= 4 ? (t.length - 1) / (t[t.length - 1] - t[0]) : 0
    speed = nps ? nps.toFixed(1) : '–'
    speedSub = nps ? `음/초 · 16분음표 ≈ ${Math.round((nps * 60) / 4)} BPM` : '음/초'
  } else {
    speed = String(bpm)
    speedSub = 'BPM'
  }

  const avgOffset = Math.round(average(stats.offsets))
  const offsetText =
    stats.offsets.length < 4 ? '–' : avgOffset === 0 ? '정확' : avgOffset < 0 ? `${-avgOffset}ms 빠름` : `${avgOffset}ms 느림`

  return (
    <div className="stats">
      <div className="stat">
        <div className="stat-value">{accuracy === null ? '–' : `${accuracy}%`}</div>
        <div className="stat-label">정확도</div>
      </div>
      <div className="stat">
        <div className="stat-value">{speed}</div>
        <div className="stat-label">{speedSub}</div>
      </div>
      <div className="stat">
        <div className="stat-value">{stats.streak}</div>
        <div className="stat-label">연속 (최고 {stats.bestStreak})</div>
      </div>
      <div className="stat">
        <div className="stat-value">
          {stats.cleanLoops}/{stats.loops}
        </div>
        <div className="stat-label">무실수 반복</div>
      </div>
      {mode === 'tempo' && (
        <div className="stat wide">
          <div className="stat-breakdown">
            <span className="perfect">퍼펙트 {stats.perfect}</span>
            <span className="good">굿 {stats.good}</span>
            <span className="miss">놓침 {stats.miss}</span>
            <span className="wrong">틀림 {stats.wrong}</span>
          </div>
          <div className="stat-label">평균 타이밍: {offsetText}</div>
        </div>
      )}
      {mode === 'free' && (
        <div className="stat wide">
          <div className="stat-breakdown">
            <span className="perfect">맞음 {stats.perfect}</span>
            <span className="wrong">틀림 {stats.wrong}</span>
          </div>
          <div className="stat-label">틀린 손가락은 맞을 때까지 넘어가지 않습니다</div>
        </div>
      )}
    </div>
  )
}
