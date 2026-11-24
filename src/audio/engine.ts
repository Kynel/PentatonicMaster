import { midiToFreq } from '../music/theory'

/** Small Web Audio wrapper: plucked-string notes (Karplus-Strong) and metronome clicks. */
export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private cache = new Map<number, AudioBuffer>()
  volume = 0.7

  get context(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' })
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
    }
    return this.ctx
  }

  async resume(): Promise<void> {
    if (this.context.state !== 'running') await this.context.resume()
  }

  get now(): number {
    return this.context.currentTime
  }

  /** Convert a performance.now()-based timestamp (ms) into AudioContext time (s). */
  perfToCtx(perfMs: number): number {
    const ctx = this.context
    const ts = ctx.getOutputTimestamp?.()
    if (ts && ts.performanceTime && ts.contextTime !== undefined) {
      return ts.contextTime + (perfMs - ts.performanceTime) / 1000
    }
    return ctx.currentTime + (perfMs - performance.now()) / 1000
  }

  private buffer(midi: number): AudioBuffer {
    const hit = this.cache.get(midi)
    if (hit) return hit
    const ctx = this.context
    const sr = ctx.sampleRate
    const length = Math.floor(sr * 1.6)
    const buf = ctx.createBuffer(1, length, sr)
    const data = buf.getChannelData(0)
    const period = Math.max(2, Math.round(sr / midiToFreq(midi)))
    const ring = new Float32Array(period)
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1
    const decay = 0.996
    let idx = 0
    for (let i = 0; i < length; i++) {
      const next = (idx + 1) % period
      const v = ring[idx]
      ring[idx] = decay * 0.5 * (ring[idx] + ring[next])
      data[i] = v
      idx = next
    }
    this.cache.set(midi, buf)
    return buf
  }

  pluck(midi: number, when = 0, gain = 0.5): void {
    const ctx = this.context
    const src = ctx.createBufferSource()
    src.buffer = this.buffer(midi)
    const g = ctx.createGain()
    g.gain.value = gain
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 3500
    src.connect(lp).connect(g).connect(this.master!)
    src.start(Math.max(when, ctx.currentTime))
  }

  click(when: number, accent: boolean): void {
    const ctx = this.context
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.value = accent ? 1600 : 1000
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05)
    osc.connect(g).connect(this.master!)
    osc.start(when)
    osc.stop(when + 0.06)
  }
}

export const audio = new AudioEngine()
