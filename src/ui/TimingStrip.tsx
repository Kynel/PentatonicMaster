interface Props {
  offsets: number[]
  perfectMs: number
  goodMs: number
}

/** Compact early/late gauge: centre line is the beat, marks show recent presses. */
export function TimingStrip({ offsets, perfectMs, goodMs }: Props) {
  const range = goodMs * 1.3
  const pos = (ms: number) => 50 + (Math.max(-range, Math.min(range, ms)) / range) * 50
  const recent = offsets.slice(-10)
  const latest = recent[recent.length - 1]
  const mean = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 0
  const tendency =
    recent.length < 3 ? '' : Math.abs(mean) <= perfectMs / 2 ? '박자에 잘 붙어 있어요' : mean < 0 ? `평균 ${-mean}ms 서두름` : `평균 ${mean}ms 밀림`
  return (
    <div className="strip">
      <span className="strip-label">빠름</span>
      <div className="strip-track">
        <div className="strip-zone good" style={{ left: `${pos(-goodMs)}%`, right: `${100 - pos(goodMs)}%` }} />
        <div className="strip-zone perfect" style={{ left: `${pos(-perfectMs)}%`, right: `${100 - pos(perfectMs)}%` }} />
        <div className="strip-center" />
        {recent.map((ms, i) => (
          <div
            key={offsets.length - recent.length + i}
            className={`strip-mark ${i === recent.length - 1 ? 'latest' : ''}`}
            style={{ left: `${pos(ms)}%`, opacity: 0.2 + (0.8 * (i + 1)) / recent.length }}
          />
        ))}
      </div>
      <span className="strip-label">느림</span>
      <span className="strip-text">{latest === undefined ? '치면 여기에 타이밍이 찍혀요' : tendency || `${latest > 0 ? '+' : ''}${latest}ms`}</span>
    </div>
  )
}
