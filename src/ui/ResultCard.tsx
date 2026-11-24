import type { SessionResult } from '../engine/result'
import type { Step } from '../engine/types'
import type { Hand } from '../practice/keymap'
import { SequenceView } from './SequenceView'

interface Props {
  result: SessionResult
  steps: Step[]
  hand: Hand
  newRecord: boolean
  onRetry: (bpm?: number) => void
  onSwitchToTempo: (bpm: number) => void
}

const pct = (x: number) => `${Math.round(x * 100)}%`

export function ResultCard({ result, steps, hand, newRecord, onRetry, onSwitchToTempo }: Props) {
  const t = result.tempo
  const l = result.learn
  const weak = result.heat.some((h) => h > 0)
  return (
    <div className="result">
      <div className="result-head">
        <h2>
          {result.mode === 'tempo' ? '템포 세션 결과' : '익히기 결과'}
          {newRecord && <span className="record-badge">최고 기록</span>}
        </h2>
        <p className="result-suggest">{result.suggestion.text}</p>
      </div>

      <div className="metrics">
        <div className="metric">
          <b>{pct(result.accuracy)}</b>
          <span>정확도</span>
        </div>
        {t && (
          <>
            <div className="metric">
              <b>♩{t.endBpm}</b>
              <span>{t.startBpm !== t.endBpm ? `${t.startBpm}에서 시작` : '템포'}</span>
            </div>
            <div className="metric">
              <b>{t.meanOffset === null ? '–' : `${t.meanOffset > 0 ? '+' : ''}${t.meanOffset}ms`}</b>
              <span>
                {t.meanOffset === null ? '평균 타이밍' : Math.abs(t.meanOffset) < 10 ? '박자에 딱 붙음' : t.meanOffset < 0 ? '평균적으로 서두름' : '평균적으로 밀림'}
              </span>
            </div>
            <div className="metric">
              <b>{t.spread === null ? '–' : `±${t.spread}ms`}</b>
              <span>흔들림 (작을수록 고름)</span>
            </div>
          </>
        )}
        {l && (
          <>
            <div className="metric">
              <b>{l.speed.toFixed(1)}</b>
              <span>초당 타수</span>
            </div>
            <div className="metric">
              <b>{l.bestLoop.toFixed(2)}s</b>
              <span>한 바퀴 최고 기록</span>
            </div>
          </>
        )}
      </div>

      {t && (
        <p className="result-counts">
          <span className="c-perfect">퍼펙트 {t.perfect}</span>
          <span className="c-good">굿 {t.good}</span>
          <span className="c-miss">놓침 {t.miss}</span>
          <span className="c-wrong">틀림 {t.wrong}</span>
          {t.strays > 0 && <span className="c-miss">헛침 {t.strays}</span>}
        </p>
      )}

      <div className="weak">
        <h3>{weak ? '자주 틀린 곳' : '틀린 곳 없음'}</h3>
        <SequenceView steps={steps} hand={hand} pos={-1} heat={result.heat} size="small" />
        {weak && <p className="muted">빨갈수록 자주 틀렸어요. 그 전환만 떼어서 천천히 반복하면 빨리 늘어요.</p>}
      </div>

      <div className="result-actions">
        {result.mode === 'tempo' ? (
          <>
            <button type="button" className="btn primary" onClick={() => onRetry(result.suggestion.bpm)}>
              ♩{result.suggestion.bpm}로 다시 <kbd>Space</kbd>
            </button>
            <button type="button" className="btn ghost" onClick={() => onRetry()}>
              같은 설정으로 <kbd>Enter</kbd>
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary" onClick={() => onSwitchToTempo(result.suggestion.bpm)}>
              템포 모드 ♩{result.suggestion.bpm}로 <kbd>Space</kbd>
            </button>
            <button type="button" className="btn ghost" onClick={() => onRetry()}>
              한 번 더 익히기 <kbd>Enter</kbd>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
