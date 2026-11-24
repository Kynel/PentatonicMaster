import { useEffect, useRef } from 'react'
import type { TempoSession } from '../engine/tempo'
import { FINGER_COLOR } from './fingers'

interface Props {
  session: React.RefObject<TempoSession | null>
  /** current time on the session clock (already latency-corrected) */
  clock: () => number
  labels: string[]
  lastHit: React.RefObject<{ text: string; color: string; at: number } | null>
}

const SLOT_PX = 46
const NOTE_H = 22
const JUDGE_COLORS = { perfect: '#7ee08a', good: '#5ec8f2', miss: '#8a90a0', wrong: '#ff5d5d' }

/**
 * Falling-note view: one lane per finger, notes drop toward the hit line in time with the
 * metronome, so the player can see exactly when the next key is due.
 */
export function Highway({ session, clock, labels, lastHit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const dpr = window.devicePixelRatio || 1
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const s = session.current
      const laneW = W / 4
      const hitY = H - 28

      // lanes
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.045)'
        ctx.fillRect(i * laneW, 0, laneW, H)
      }
      if (!s) return
      const now = clock()
      const pxPerSec = SLOT_PX / s.interval
      const ahead = hitY / pxPerSec
      const yOf = (t: number) => hitY - (t - now) * pxPerSec

      // beat lines
      for (const c of s.clicks) {
        if (c.time < now - 0.3 || c.time > now + ahead) continue
        const y = yOf(c.time)
        ctx.fillStyle = c.accent ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'
        ctx.fillRect(0, y - (c.accent ? 1 : 0.5), W, c.accent ? 2 : 1)
      }

      // hit line
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillRect(0, hitY - 1.5, W, 3)

      // notes
      ctx.font = '700 13px "JetBrains Mono", ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const n of s.notes) {
        if (n.time < now - 0.5 || n.time > now + ahead + 0.1) continue
        const hit = n.judgement === 'perfect' || n.judgement === 'good'
        const x = (n.finger - 1) * laneW + 8
        const w = laneW - 16
        if (hit) {
          // short burst on the hit line
          const age = now - n.time
          if (age < 0.25) {
            ctx.globalAlpha = 1 - age / 0.25
            ctx.fillStyle = FINGER_COLOR[n.finger]
            ctx.fillRect(x - 4, hitY - NOTE_H / 2 - 4, w + 8, NOTE_H + 8)
            ctx.globalAlpha = 1
          }
          continue
        }
        const y = yOf(n.time)
        ctx.globalAlpha = n.judgement === 'miss' ? 0.3 : 1
        ctx.fillStyle = n.judgement === 'wrong' ? '#ff5d5d' : FINGER_COLOR[n.finger]
        roundRect(ctx, x, y - NOTE_H / 2, w, NOTE_H, 6)
        ctx.fill()
        ctx.fillStyle = '#101114'
        ctx.fillText(labels[n.finger - 1], x + w / 2, y + 1)
        ctx.globalAlpha = 1
      }

      // count-in
      if (now < s.firstNoteTime) {
        const beat = (s.firstNoteTime - now) / (s.interval * s.opts.perBeat)
        const nShow = Math.ceil(beat)
        if (nShow <= 4) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          ctx.font = '800 72px "JetBrains Mono", ui-monospace, monospace'
          ctx.fillText(String(nShow), W / 2, H / 2 - 20)
        }
      }

      // judgement popup
      const lh = lastHit.current
      if (lh) {
        const age = performance.now() - lh.at
        if (age < 500) {
          ctx.globalAlpha = 1 - age / 500
          ctx.fillStyle = lh.color
          ctx.font = '800 22px "Noto Sans KR", system-ui, sans-serif'
          ctx.fillText(lh.text, W / 2, hitY - 46 - age / 25)
          ctx.globalAlpha = 1
        }
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [session, clock, labels, lastHit])

  return <canvas ref={canvasRef} className="highway" aria-label="다가오는 음" />
}

export { JUDGE_COLORS }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
