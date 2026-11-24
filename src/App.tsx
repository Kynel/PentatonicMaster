import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { audio } from './audio/engine'
import { LearnSession } from './engine/learn'
import { learnResult, tempoResult, type SessionResult } from './engine/result'
import { TempoSession } from './engine/tempo'
import { hitWindows, noteInterval } from './engine/timing'
import type { Mode } from './engine/types'
import { BUILT_IN, GROUP_LABELS, customExercise, exerciseKey, type CustomPattern } from './exercises'
import { BOX_COUNT, type Finger } from './music/boxes'
import { KEYMAPS, fingerForCode } from './practice/keymap'
import { useStore, type ExRecord } from './store'
import { FINGER_COLOR } from './ui/fingers'
import { Highway } from './ui/Highway'
import { KeyRow } from './ui/KeyRow'
import { Library } from './ui/Library'
import { PatternEditor } from './ui/PatternEditor'
import { ResultCard } from './ui/ResultCard'
import { SequenceView } from './ui/SequenceView'
import { SettingsPanel } from './ui/SettingsPanel'
import { TimingStrip } from './ui/TimingStrip'

type Phase = 'idle' | 'running' | 'done'

const PER_BEAT = [
  { v: 1, label: '4분' },
  { v: 2, label: '8분' },
  { v: 3, label: '셋잇단' },
  { v: 4, label: '16분' },
]

export default function App() {
  const { store, setStore, setPrefs } = useStore()
  const prefs = store.prefs
  const [, bump] = useReducer((x: number) => x + 1, 0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<SessionResult | null>(null)
  const [newRecord, setNewRecord] = useState(false)
  const [editor, setEditor] = useState<CustomPattern | 'new' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [flash, setFlash] = useState<{ finger: Finger; ok: boolean; at: number } | null>(null)

  const exercises = useMemo(() => [...BUILT_IN, ...store.customs.map(customExercise)], [store.customs])
  const ex = exercises.find((e) => e.id === prefs.exerciseId) ?? exercises[0]
  const box = ex.boxed ? prefs.box : 0
  const exKey = exerciseKey(ex, box)
  const steps = useMemo(() => ex.build(box), [ex, box])
  const bpm = prefs.bpm[exKey] ?? 80
  const perBeat = prefs.perBeat[exKey] ?? ex.perBeat
  const mode = prefs.mode
  const record: ExRecord | undefined = store.records[exKey]

  const learnRef = useRef<LearnSession | null>(null)
  const tempoRef = useRef<TempoSession | null>(null)
  const rafRef = useRef(0)
  const clickCursor = useRef(0)
  const lastHit = useRef<{ text: string; color: string; at: number } | null>(null)
  const latency = prefs.latencyMs / 1000

  const clock = useCallback(() => audio.now - latency, [latency])
  const labels = useMemo(() => KEYMAPS[prefs.hand].slice().sort((a, b) => a.finger - b.finger).map((k) => k.label), [prefs.hand])

  const stopLoop = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }

  const abort = useCallback(() => {
    stopLoop()
    learnRef.current = null
    tempoRef.current = null
    setPhase('idle')
  }, [])

  // any change of exercise, box or mode cancels the running session
  useEffect(() => {
    abort()
    setResult(null)
  }, [exKey, mode, abort])

  // stop when the tab is hidden: animation frames pause and timing would break
  useEffect(() => {
    const onVis = () => document.hidden && abort()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [abort])

  const finish = (r: SessionResult) => {
    stopLoop()
    setResult(r)
    setPhase('done')
    const prev: ExRecord = storeRef.current.records[exKey] ?? { history: [] }
    const next: ExRecord = {
      ...prev,
      history: [
        ...prev.history.slice(-29),
        { at: Date.now(), mode: r.mode, bpm: r.tempo?.endBpm, accuracy: r.accuracy, speed: r.learn?.speed },
      ],
    }
    let isRecord = false
    if (r.tempo?.bestCleanBpm && r.accuracy >= 0.95 && r.tempo.bestCleanBpm > (prev.bestBpm ?? 0)) {
      next.bestBpm = r.tempo.bestCleanBpm
      isRecord = true
    }
    if (r.learn && r.accuracy >= 0.95 && r.learn.speed > (prev.bestSpeed ?? 0)) {
      next.bestSpeed = Math.round(r.learn.speed * 10) / 10
      isRecord = true
    }
    setNewRecord(isRecord)
    setStore((s) => ({ ...s, records: { ...s.records, [exKey]: next } }))
  }

  const tempoTick = () => {
    const t = tempoRef.current
    if (!t) return
    const now = audio.now
    t.generate(now + 4)
    while (clickCursor.current < t.clicks.length && t.clicks[clickCursor.current].time < now + 0.15) {
      const c = t.clicks[clickCursor.current]
      if (prefsRef.current.click) audio.click(Math.max(c.time, now), c.accent)
      clickCursor.current++
    }
    const before = t.notes.filter((n) => n.judgement !== undefined).length + t.loopsDone.length
    t.update(now - latencyRef.current)
    const after = t.notes.filter((n) => n.judgement !== undefined).length + t.loopsDone.length
    if (t.finished) {
      finish(tempoResult(t))
      return
    }
    if (after !== before) bump()
    rafRef.current = requestAnimationFrame(tempoTick)
  }

  const start = async (opts?: { bpm?: number; mode?: Mode }) => {
    const m = opts?.mode ?? mode
    const useBpm = opts?.bpm ?? bpm
    if (opts?.bpm !== undefined) setPrefs({ bpm: { ...prefs.bpm, [exKey]: opts.bpm } })
    if (opts?.mode) setPrefs({ mode: opts.mode })
    setResult(null)
    setNewRecord(false)
    await audio.resume()
    stopLoop()
    if (m === 'learn') {
      learnRef.current = new LearnSession(steps, prefs.learnLoops)
      tempoRef.current = null
    } else {
      learnRef.current = null
      tempoRef.current = new TempoSession(
        steps,
        { bpm: useBpm, perBeat, loops: prefs.tempoLoops, ladder: prefs.ladder, ladderStep: 5 },
        audio.now + 0.3,
      )
      clickCursor.current = 0
      lastHit.current = null
      rafRef.current = requestAnimationFrame(tempoTick)
    }
    setPhase('running')
  }

  const press = (finger: Finger, perfMs: number) => {
    setFlash({ finger, ok: true, at: performance.now() })
    if (phase === 'done') return
    if (mode === 'learn') {
      let s = learnRef.current
      if (!s || phase === 'idle') {
        void audio.resume()
        s = learnRef.current = new LearnSession(steps, prefs.learnLoops)
        setResult(null)
        setPhase('running')
      }
      const step = steps[s.pos]
      const r = s.press(finger, perfMs / 1000)
      setFlash({ finger, ok: r === 'ok', at: performance.now() })
      if (r === 'ok' && prefs.sound) audio.pluck(step.midi)
      if (s.finished) finish(learnResult(s, perBeat))
      else bump()
      return
    }
    const t = tempoRef.current
    if (!t || phase !== 'running') return
    const at = audio.perfToCtx(perfMs) - latency
    const note = t.press(finger, at)
    const now = performance.now()
    if (!note) {
      lastHit.current = { text: '헛침', color: '#8a90a0', at: now }
      setFlash({ finger, ok: false, at: now })
    } else {
      const j = note.judgement
      const hit = j === 'perfect' || j === 'good'
      if (hit && prefs.sound) audio.pluck(steps[note.idx].midi)
      lastHit.current =
        j === 'perfect'
          ? { text: '퍼펙트', color: '#7ee08a', at: now }
          : j === 'good'
            ? { text: note.offset! < 0 ? '조금 빠름' : '조금 느림', color: '#5ec8f2', at: now }
            : { text: '손가락 틀림', color: '#ff5d5d', at: now }
      setFlash({ finger, ok: hit, at: now })
    }
    bump()
  }

  // keep the latest values for the keyboard and animation handlers
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs
  const storeRef = useRef(store)
  storeRef.current = store
  const latencyRef = useRef(latency)
  latencyRef.current = latency
  const handlers = useRef({ press, start, abort, result, phase, modal: false })
  handlers.current = { press, start, abort, result, phase, modal: editor !== null || settingsOpen }

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const h = handlers.current
      if (h.modal) {
        if (ev.code === 'Escape') {
          setEditor(null)
          setSettingsOpen(false)
        }
        return
      }
      const el = ev.target as HTMLElement | null
      if (el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text'))) return
      const finger = fingerForCode(prefsRef.current.hand, ev.code)
      const isControl = ev.code === 'Space' || ev.code === 'Enter' || ev.code === 'Escape'
      if (finger === null && !isControl) return
      if (el && el !== document.body) el.blur()
      ev.preventDefault()
      if (ev.repeat) return
      if (ev.code === 'Escape') return h.abort()
      if (ev.code === 'Space') {
        if (h.phase === 'running') return h.abort()
        if (h.phase === 'done' && h.result) {
          return void (h.result.mode === 'tempo'
            ? h.start({ bpm: h.result.suggestion.bpm })
            : h.start({ bpm: h.result.suggestion.bpm, mode: 'tempo' }))
        }
        return void h.start()
      }
      if (ev.code === 'Enter') {
        if (h.phase !== 'running') void h.start()
        return
      }
      if (finger !== null) h.press(finger, ev.timeStamp)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => () => stopLoop(), [])

  // live numbers
  const learn = learnRef.current
  const tempo = tempoRef.current
  const offsets = tempo ? tempo.notes.filter((n) => n.offset !== undefined && n.judgement !== 'wrong').map((n) => n.offset!) : []
  const judged = tempo ? tempo.notes.filter((n) => n.judgement !== undefined) : []
  const liveAcc = tempo
    ? judged.length
      ? judged.filter((n) => n.judgement === 'perfect' || n.judgement === 'good').length / judged.length
      : null
    : learn && learn.correct + learn.wrong > 0
      ? learn.correct / (learn.correct + learn.wrong)
      : null
  const w = hitWindows(tempo ? tempo.interval : noteInterval(bpm, perBeat))
  const running = phase === 'running'
  const loopNow = tempo ? Math.min(prefs.tempoLoops, tempo.loopsDone.length + 1) : learn ? Math.min(prefs.learnLoops, learn.loop + 1) : 0
  const loopsTotal = mode === 'tempo' ? prefs.tempoLoops : prefs.learnLoops
  const nextFinger = mode === 'learn' && phase !== 'done' ? steps[learn?.pos ?? 0]?.finger ?? null : null
  const currentStep = mode === 'learn' ? steps[learn?.pos ?? 0] : null

  const setBpm = (v: number) => setPrefs({ bpm: { ...prefs.bpm, [exKey]: Math.max(30, Math.min(300, v)) } })

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dots" aria-hidden="true">
            {([1, 2, 3, 4] as Finger[]).map((f) => (
              <i key={f} style={{ background: FINGER_COLOR[f] }} />
            ))}
          </span>
          <span className="brand-name">손가락 운동기</span>
          <span className="brand-sub">기타 솔로 운지를 키보드로</span>
        </div>
        <button type="button" className="btn ghost" onClick={() => setSettingsOpen(true)}>
          설정
        </button>
      </header>

      <div className="layout">
        <Library
          exercises={exercises}
          selected={ex.id}
          records={store.records}
          onSelect={(id) => setPrefs({ exerciseId: id })}
          onNewPattern={() => setEditor('new')}
        />

        <main className="main">
          <div className="ex-head">
            <div className="ex-info">
              <span className="eyebrow">
                {GROUP_LABELS[ex.group]}
                {ex.tag && ` · ${ex.tag}`}
              </span>
              <h1>{ex.title}</h1>
              <p className="muted">{ex.description}</p>
            </div>
            <div className="ex-side">
              {record?.bestBpm && <span className="pill">최고 ♩{record.bestBpm}</span>}
              {record?.bestSpeed && <span className="pill">최고 {record.bestSpeed}타/초</span>}
              {ex.group === 'custom' && (
                <button type="button" className="btn ghost small" onClick={() => setEditor(store.customs.find((c) => c.id === ex.id) ?? null)}>
                  수정
                </button>
              )}
            </div>
          </div>
          {ex.boxed && (
            <div className="boxes">
              <span className="muted">박스 포지션</span>
              <div className="seg">
                {Array.from({ length: BOX_COUNT }, (_, i) => (
                  <button key={i} type="button" className={box === i ? 'on' : ''} onClick={(e) => (setPrefs({ box: i }), e.currentTarget.blur())}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="controls">
            <div className="seg mode">
              <button type="button" className={mode === 'learn' ? 'on' : ''} onClick={(e) => (setPrefs({ mode: 'learn' }), e.currentTarget.blur())}>
                익히기
              </button>
              <button type="button" className={mode === 'tempo' ? 'on' : ''} onClick={(e) => (setPrefs({ mode: 'tempo' }), e.currentTarget.blur())}>
                템포
              </button>
            </div>
            {mode === 'tempo' && (
              <>
                <div className="stepper" aria-label="BPM">
                  <button type="button" disabled={running} onClick={() => setBpm(bpm - 5)}>−</button>
                  <span>
                    ♩<b>{tempo ? tempo.bpm : bpm}</b>
                  </span>
                  <button type="button" disabled={running} onClick={() => setBpm(bpm + 5)}>+</button>
                </div>
                <div className="seg small" aria-label="박자당 음 수">
                  {PER_BEAT.map((d) => (
                    <button
                      key={d.v}
                      type="button"
                      disabled={running}
                      className={perBeat === d.v ? 'on' : ''}
                      onClick={(e) => (setPrefs({ perBeat: { ...prefs.perBeat, [exKey]: d.v } }), e.currentTarget.blur())}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <label className="check small">
                  <input
                    id="opt-ladder"
                    type="checkbox"
                    checked={prefs.ladder}
                    disabled={running}
                    onChange={(e) => (setPrefs({ ladder: e.target.checked }), e.currentTarget.blur())}
                  />
                  속도 사다리
                </label>
              </>
            )}
            <div className="seg small" aria-label="반복 횟수">
              {(mode === 'tempo' ? [4, 8, 16] : [3, 5, 10]).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={running}
                  className={loopsTotal === n ? 'on' : ''}
                  onClick={(e) => (setPrefs(mode === 'tempo' ? { tempoLoops: n } : { learnLoops: n }), e.currentTarget.blur())}
                >
                  {n}회
                </button>
              ))}
            </div>
            <span className="spacer" />
            <button type="button" className={`btn ${running ? 'ghost' : 'primary'} start`} onClick={(e) => (running ? abort() : void start(), e.currentTarget.blur())}>
              {running ? '그만' : '시작'} <kbd>Space</kbd>
            </button>
          </div>
          {mode === 'tempo' && prefs.ladder && (
            <p className="muted note">속도 사다리: 한 바퀴를 실수 없이 치면 5 빨라지고, 틀리면 5 느려져요. 바퀴 사이에 한 마디 쉬어요.</p>
          )}

          <section className={`stage ${mode}`}>
            {phase === 'done' && result ? (
              <ResultCard
                result={result}
                steps={steps}
                hand={prefs.hand}
                newRecord={newRecord}
                onRetry={(b) => void start(b !== undefined ? { bpm: b } : undefined)}
                onSwitchToTempo={(b) => void start({ bpm: b, mode: 'tempo' })}
              />
            ) : (
              <>
                <div className="live">
                  <span>
                    반복 <b>{running ? loopNow : 0}</b>/{loopsTotal}
                  </span>
                  <span>
                    정확도 <b>{liveAcc === null ? '–' : `${Math.round(liveAcc * 100)}%`}</b>
                  </span>
                  {mode === 'learn' && (
                    <span>
                      속도 <b>{learn && learn.speed ? learn.speed.toFixed(1) : '–'}</b>타/초
                    </span>
                  )}
                  {mode === 'learn' && currentStep?.where && <span className="where">지금: {currentStep.where}</span>}
                </div>

                {mode === 'learn' ? (
                  <div className="learn-view">
                    <SequenceView steps={steps} hand={prefs.hand} pos={learn ? learn.pos : 0} missed={learn?.loopMissed} />
                    {!running && <p className="prompt">첫 키를 누르면 바로 시작해요. 틀리면 맞는 키를 칠 때까지 기다려요.</p>}
                  </div>
                ) : (
                  <div className="tempo-view">
                    <div className="highway-wrap">
                      <Highway session={tempoRef} clock={clock} labels={labels} lastHit={lastHit} />
                      {!running && (
                        <div className="highway-overlay">
                          <SequenceView steps={steps} hand={prefs.hand} pos={-1} size="small" />
                          <p>
                            <kbd>Space</kbd>를 누르면 4박 카운트 후 음이 위에서 내려와요.
                            <br />
                            흰 선에 닿을 때 그 줄의 키를 누르세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={mode === 'tempo' ? 'keys-tempo' : 'keys-learn'}>
                  <KeyRow hand={prefs.hand} next={nextFinger} flash={flash} onPress={(f) => press(f, performance.now())} />
                  {mode === 'tempo' && <TimingStrip offsets={offsets} perfectMs={w.perfect * 1000} goodMs={w.good * 1000} />}
                </div>
              </>
            )}
          </section>

          <p className="shortcuts muted">
            <kbd>Space</kbd> 시작/그만 · <kbd>Esc</kbd> 그만 · 결과 화면에서 <kbd>Space</kbd> 제안대로 다시, <kbd>Enter</kbd> 같은 설정으로 다시
          </p>
        </main>
      </div>

      {editor !== null && (
        <PatternEditor
          editing={editor === 'new' ? null : editor}
          hand={prefs.hand}
          onClose={() => setEditor(null)}
          onSave={(p) => {
            setStore((s) => ({
              ...s,
              customs: s.customs.some((c) => c.id === p.id) ? s.customs.map((c) => (c.id === p.id ? p : c)) : [...s.customs, p],
              prefs: { ...s.prefs, exerciseId: p.id },
            }))
            setEditor(null)
          }}
          onDelete={(id) => {
            setStore((s) => ({ ...s, customs: s.customs.filter((c) => c.id !== id), prefs: { ...s.prefs, exerciseId: BUILT_IN[0].id } }))
            setEditor(null)
          }}
        />
      )}
      {settingsOpen && <SettingsPanel prefs={prefs} onChange={setPrefs} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
