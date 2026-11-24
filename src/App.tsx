import { useMemo } from 'react'
import { Fretboard } from './components/Fretboard'
import { KeyPad } from './components/KeyPad'
import { NoteTape } from './components/NoteTape'
import { StatsPanel } from './components/StatsPanel'
import { BOX_COUNT, getBoxNotes } from './music/boxes'
import { PATTERNS, getPattern } from './music/patterns'
import { NOTE_NAMES, stringLabel } from './music/theory'
import { FINGER_NAMES, keyLabelForFinger } from './practice/keymap'
import { usePractice } from './practice/usePractice'
import { useSettings } from './settings'

const SUBDIVISIONS = [
  { value: 1, label: '4분음표' },
  { value: 2, label: '8분음표' },
  { value: 3, label: '셋잇단' },
  { value: 4, label: '16분음표' },
]

const JUDGE_TEXT = { perfect: '퍼펙트', good: '굿', miss: '놓침', wrong: '틀림', early: '너무 빠름' } as const

export default function App() {
  const { settings: s, update } = useSettings()
  const notes = useMemo(() => getBoxNotes(s.keyPc, s.scale, s.box), [s.keyPc, s.scale, s.box])
  const pattern = getPattern(s.pattern)
  const seq = useMemo(() => pattern.build(notes), [pattern, notes])

  const p = usePractice(seq, {
    mode: s.mode,
    bpm: s.bpm,
    notesPerBeat: s.notesPerBeat,
    autoSpeed: s.autoSpeed,
    speedStep: s.speedStep,
    hand: s.hand,
    sound: s.sound,
    latencyMs: s.latencyMs,
    onBpmChange: (bpm) => update('bpm', bpm),
  })

  const target = seq[p.index] ?? null
  const next = seq.length ? seq[(p.index + 1) % seq.length] : null
  const running = p.status !== 'idle'
  const keyName = `${NOTE_NAMES[s.keyPc]} ${s.scale === 'minor' ? '마이너' : '메이저'}`

  return (
    <div className="app">
      <header className="header">
        <h1>
          펜타토닉 <span>손가락 운동기</span>
        </h1>
        <p className="tagline">기타 솔로 운지 패턴을 키보드로 미리 손에 익히세요.</p>
      </header>

      <section className="controls" aria-label="연습 설정">
        <label>
          키
          <select value={s.keyPc} onChange={(e) => update('keyPc', Number(e.target.value))}>
            {NOTE_NAMES.map((n, i) => (
              <option key={n} value={i}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          스케일
          <select value={s.scale} onChange={(e) => update('scale', e.target.value as 'minor' | 'major')}>
            <option value="minor">마이너 펜타토닉</option>
            <option value="major">메이저 펜타토닉</option>
          </select>
        </label>
        <div className="field">
          <span>박스 포지션</span>
          <div className="segmented">
            {Array.from({ length: BOX_COUNT }, (_, i) => (
              <button key={i} type="button" className={s.box === i ? 'on' : ''} onClick={() => update('box', i)}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <label>
          패턴
          <select value={s.pattern} onChange={(e) => update('pattern', e.target.value)}>
            {PATTERNS.map((pt) => (
              <option key={pt.id} value={pt.id}>{pt.label}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>모드</span>
          <div className="segmented">
            <button type="button" className={s.mode === 'free' ? 'on' : ''} onClick={() => update('mode', 'free')}>
              자유 연습
            </button>
            <button type="button" className={s.mode === 'tempo' ? 'on' : ''} onClick={() => update('mode', 'tempo')}>
              메트로놈
            </button>
          </div>
        </div>
        {s.mode === 'tempo' && (
          <>
            <label className="bpm">
              BPM <strong>{p.bpm}</strong>
              <input
                type="range" min={40} max={240} value={s.bpm} disabled={running}
                onChange={(e) => update('bpm', Number(e.target.value))}
              />
            </label>
            <label>
              박자당 음
              <select value={s.notesPerBeat} disabled={running} onChange={(e) => update('notesPerBeat', Number(e.target.value))}>
                {SUBDIVISIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={s.autoSpeed} onChange={(e) => update('autoSpeed', e.target.checked)} />
              실수 없이 한 바퀴 돌면 +{s.speedStep} BPM
            </label>
          </>
        )}
      </section>

      <section className="stage">
        <div className="stage-head">
          <div>
            <div className="stage-title">
              {keyName} · 박스 {s.box + 1} · {pattern.label}
            </div>
            <div className="stage-desc">{pattern.description} ({seq.length}음 한 바퀴)</div>
          </div>
          <button type="button" className={`start ${running ? 'stop' : ''}`} onClick={() => (running ? p.stop() : void p.start())}>
            {running ? '정지 (Space)' : '시작 (Space)'}
          </button>
        </div>

        <Fretboard notes={notes} target={running || s.mode === 'free' ? target : null} next={running ? next : null} />

        <div className="now">
          {target && (
            <div className="now-target">
              <span className="now-finger">{target.finger}</span>
              <span>
                <strong>{FINGER_NAMES[target.finger]}</strong> ({keyLabelForFinger(s.hand, target.finger)} 키) ·{' '}
                {stringLabel(target.string)} {target.fret}프렛
              </span>
            </div>
          )}
          <div className="judge-slot">
            {p.lastJudgement && (
              <span key={p.lastJudgement.at} className={`judge ${p.lastJudgement.j}`}>
                {JUDGE_TEXT[p.lastJudgement.j]}
              </span>
            )}
            {p.status === 'countin' && <span className="judge countin">준비…</span>}
          </div>
        </div>

        <NoteTape seq={seq} index={p.index} results={p.results} hand={s.hand} active={running} />
        <KeyPad hand={s.hand} target={running || s.mode === 'free' ? target?.finger ?? null : null} pressed={p.pressed} onPress={p.press} />

        <p className="hint">
          {s.mode === 'free'
            ? '키를 누르면 바로 시작합니다. 속도보다 정확하게, 손가락 순서를 몸에 익히는 데 집중하세요.'
            : 'Space로 시작하면 4박 카운트 후 메트로놈에 맞춰 칩니다. 손가락이 꼬이면 BPM을 낮추세요.'}
        </p>
      </section>

      <StatsPanel stats={p.stats} mode={s.mode} bpm={p.bpm} />

      <section className="options" aria-label="기타 설정">
        <label>
          연습 손
          <select value={s.hand} onChange={(e) => update('hand', e.target.value as 'left' | 'right')}>
            <option value="left">왼손 (A S D F)</option>
            <option value="right">오른손 (J K L ;)</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={s.sound} onChange={(e) => update('sound', e.target.checked)} />
          기타 소리
        </label>
        {s.mode === 'tempo' && (
          <label className="bpm">
            입력 지연 보정 <strong>{s.latencyMs}ms</strong>
            <input type="range" min={0} max={150} step={5} value={s.latencyMs} onChange={(e) => update('latencyMs', Number(e.target.value))} />
          </label>
        )}
      </section>
    </div>
  )
}
