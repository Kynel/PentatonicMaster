import { useCallback, useEffect, useReducer, useRef } from 'react'
import { audio } from '../audio/engine'
import type { Finger, FretNote } from '../music/boxes'
import { fingerForCode, type Hand } from './keymap'
import { judgePress, noteInterval, windows, type Judgement } from './timing'

export type Mode = 'free' | 'tempo'
export type Status = 'idle' | 'countin' | 'running'

export interface PracticeOptions {
  mode: Mode
  bpm: number
  notesPerBeat: number
  autoSpeed: boolean
  speedStep: number
  hand: Hand
  sound: boolean
  latencyMs: number
  /** called when auto speed-up raises the tempo */
  onBpmChange?: (bpm: number) => void
}

export interface Stats {
  perfect: number
  good: number
  miss: number
  wrong: number
  early: number
  streak: number
  bestStreak: number
  loops: number
  cleanLoops: number
  /** recent timing offsets in ms (tempo mode), negative = early */
  offsets: number[]
  /** recent correct press times in seconds (free mode) */
  pressTimes: number[]
}

const emptyStats = (): Stats => ({
  perfect: 0, good: 0, miss: 0, wrong: 0, early: 0, streak: 0, bestStreak: 0,
  loops: 0, cleanLoops: 0, offsets: [], pressTimes: [],
})

interface Engine {
  status: Status
  /** global note counter: index of the current target (keeps counting across loops) */
  k: number
  results: (Judgement | undefined)[]
  stats: Stats
  bpm: number
  interval: number
  baseTime: number
  baseIndex: number
  nextClickSlot: number
  lastJudgement: { j: Judgement | 'early'; at: number } | null
  pressed: { finger: Finger; ok: boolean; at: number } | null
  /** an early press happened in this loop, so it does not count as clean */
  loopDirty: boolean
  timer: number | null
  raf: number | null
}

export function usePractice(seq: FretNote[], opts: PracticeOptions) {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const seqRef = useRef(seq)
  seqRef.current = seq

  const eng = useRef<Engine>({
    status: 'idle', k: 0, results: [], stats: emptyStats(), bpm: opts.bpm, interval: 0,
    baseTime: 0, baseIndex: 0, nextClickSlot: 0, lastJudgement: null, pressed: null,
    timer: null, raf: null, loopDirty: false,
  })

  const expected = (k: number) => {
    const e = eng.current
    return e.baseTime + (k - e.baseIndex) * e.interval
  }

  const clearLoops = () => {
    const e = eng.current
    if (e.timer !== null) clearInterval(e.timer)
    if (e.raf !== null) cancelAnimationFrame(e.raf)
    e.timer = null
    e.raf = null
  }

  const stop = useCallback(() => {
    clearLoops()
    const e = eng.current
    e.status = 'idle'
    force()
  }, [])

  /** Store a judgement for the current target and advance. */
  const record = (j: Judgement, offsetMs?: number) => {
    const e = eng.current
    const len = seqRef.current.length
    const idx = e.k % len
    const s = e.stats
    // In free mode a wrong press is recorded first, then the correct press advances.
    if (e.results[idx] !== 'wrong') e.results[idx] = j
    if (j === 'perfect') s.perfect++
    else if (j === 'good') s.good++
    else if (j === 'miss') s.miss++
    if (j === 'perfect' || j === 'good') {
      s.streak++
      s.bestStreak = Math.max(s.bestStreak, s.streak)
    } else s.streak = 0
    if (offsetMs !== undefined) s.offsets = [...s.offsets.slice(-31), offsetMs]
    e.lastJudgement = { j, at: performance.now() }
    e.k++
    if (e.k % len === 0) {
      s.loops++
      const clean =
        !e.loopDirty && e.results.length === len && e.results.every((r) => r === 'perfect' || r === 'good')
      if (clean) s.cleanLoops++
      const o = optsRef.current
      if (o.mode === 'tempo' && o.autoSpeed && clean) {
        const at = expected(e.k)
        e.bpm = Math.min(400, e.bpm + o.speedStep)
        e.interval = noteInterval(e.bpm, o.notesPerBeat)
        e.baseIndex = e.k
        e.baseTime = at
        o.onBpmChange?.(e.bpm)
      }
      e.results = []
      e.loopDirty = false
    }
  }

  const tick = () => {
    const e = eng.current
    if (e.status === 'idle') return
    const o = optsRef.current
    const now = audio.now - o.latencyMs / 1000
    const w = windows(e.interval)
    let changed = false
    if (e.status === 'countin' && now >= e.baseTime - w.good) {
      e.status = 'running'
      changed = true
    }
    let guard = 0
    while (e.status === 'running' && now > expected(e.k) + w.good && guard++ < 64) {
      record('miss')
      changed = true
    }
    if (changed) force()
    e.raf = requestAnimationFrame(tick)
  }

  const schedule = () => {
    const e = eng.current
    const o = optsRef.current
    const horizon = audio.now + 0.12
    while (expected(e.nextClickSlot) < horizon) {
      const rel = e.nextClickSlot - e.baseIndex
      if (rel % o.notesPerBeat === 0) {
        const beat = rel / o.notesPerBeat
        audio.click(expected(e.nextClickSlot), ((beat % 4) + 4) % 4 === 0)
      }
      e.nextClickSlot++
    }
  }

  const start = useCallback(async () => {
    await audio.resume()
    clearLoops()
    const e = eng.current
    const o = optsRef.current
    e.k = 0
    e.results = []
    e.loopDirty = false
    e.stats = emptyStats()
    e.lastJudgement = null
    e.bpm = o.bpm
    if (o.mode === 'free') {
      e.status = 'running'
      force()
      return
    }
    e.interval = noteInterval(e.bpm, o.notesPerBeat)
    const countIn = 4 * o.notesPerBeat
    e.baseIndex = 0
    e.baseTime = audio.now + 0.2 + countIn * e.interval
    e.nextClickSlot = -countIn
    e.status = 'countin'
    schedule()
    e.timer = window.setInterval(schedule, 25)
    e.raf = requestAnimationFrame(tick)
    force()
  }, [])

  const handlePress = useCallback((finger: Finger, perfMs: number) => {
    const e = eng.current
    const o = optsRef.current
    const seq = seqRef.current
    if (seq.length === 0) return

    if (e.status === 'idle' && o.mode === 'free') {
      // free mode starts on the first press, from the first note
      void audio.resume()
      e.k = 0
      e.results = []
      e.loopDirty = false
      e.stats = emptyStats()
      e.status = 'running'
    }

    const target = seq[e.k % seq.length]
    const ok = finger === target.finger
    e.pressed = { finger, ok, at: performance.now() }

    if (e.status === 'idle') {
      force()
      return
    }

    if (o.mode === 'free') {
      if (ok) {
        if (o.sound) audio.pluck(target.midi)
        const t = perfMs / 1000
        e.stats.pressTimes = [...e.stats.pressTimes.slice(-11), t]
        record('perfect')
      } else {
        e.results[e.k % seq.length] = 'wrong'
        e.stats.wrong++
        e.stats.streak = 0
        e.lastJudgement = { j: 'wrong', at: performance.now() }
      }
      force()
      return
    }

    if (e.status !== 'running') {
      force()
      return
    }
    const t = audio.perfToCtx(perfMs) - o.latencyMs / 1000
    const delta = t - expected(e.k)
    const j = judgePress(delta, ok, e.interval)
    if (j === null) {
      e.stats.early++
      e.loopDirty = true
      e.stats.offsets = [...e.stats.offsets.slice(-31), Math.round(delta * 1000)]
      e.lastJudgement = { j: 'early', at: performance.now() }
    } else {
      if (j === 'wrong') e.stats.wrong++
      if (ok && j !== 'miss' && o.sound) audio.pluck(target.midi)
      record(j, Math.round(delta * 1000))
    }
    force()
  }, [])

  // keyboard handling
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const el = ev.target as HTMLElement | null
      // typing into text fields must not trigger practice keys
      if (el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text'))) return
      const practiceKey = ev.code === 'Space' || fingerForCode(optsRef.current.hand, ev.code) !== null
      // after changing a setting, focus stays on that control: hand practice keys back to the app
      if (practiceKey && el && el !== document.body && (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'BUTTON')) el.blur()
      if (ev.code === 'Space') {
        ev.preventDefault()
        if (ev.repeat) return
        if (eng.current.status === 'idle') void start()
        else stop()
        return
      }
      if (ev.code === 'Escape') {
        stop()
        return
      }
      const finger = fingerForCode(optsRef.current.hand, ev.code)
      if (finger === null) return
      ev.preventDefault()
      if (ev.repeat) return
      handlePress(finger, ev.timeStamp)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [start, stop, handlePress])

  useEffect(() => () => clearLoops(), [])

  // a new sequence (key/box/pattern/mode change) resets the session
  useEffect(() => {
    clearLoops()
    const e = eng.current
    e.status = 'idle'
    e.k = 0
    e.results = []
    e.loopDirty = false
    e.stats = emptyStats()
    e.lastJudgement = null
    force()
  }, [seq, opts.mode, opts.notesPerBeat])

  /** live position on the beat grid, read every animation frame by the beat display */
  const getClock = useCallback(() => {
    const en = eng.current
    if (en.status === 'idle' || optsRef.current.mode !== 'tempo') return null
    const now = audio.now - optsRef.current.latencyMs / 1000
    const beats = (now - en.baseTime) / en.interval / optsRef.current.notesPerBeat
    return { beats, status: en.status }
  }, [])

  const e = eng.current
  const len = seq.length
  return {
    status: e.status,
    index: len ? e.k % len : 0,
    results: e.results,
    stats: e.stats,
    bpm: e.status === 'idle' ? opts.bpm : e.bpm,
    lastJudgement: e.lastJudgement,
    pressed: e.pressed,
    start,
    stop,
    press: (finger: Finger) => handlePress(finger, performance.now()),
    interval: e.status === 'idle' ? noteInterval(opts.bpm, opts.notesPerBeat) : e.interval,
    getClock,
  }
}
