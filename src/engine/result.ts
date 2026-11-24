import type { LearnSession } from './learn'
import type { TempoSession } from './tempo'
import type { Mode } from './types'

export interface SessionResult {
  mode: Mode
  accuracy: number
  /** per step: share of attempts that went wrong (0..1) */
  heat: number[]
  loops: number
  tempo?: {
    startBpm: number
    endBpm: number
    /** highest BPM of a loop finished without a mistake */
    bestCleanBpm?: number
    perfect: number
    good: number
    miss: number
    wrong: number
    strays: number
    meanOffset: number | null
    spread: number | null
  }
  learn?: {
    speed: number
    bestLoop: number
  }
  suggestion: { bpm: number; text: string }
}

const round5 = (x: number) => Math.round(x / 5) * 5

export function tempoResult(s: TempoSession): SessionResult {
  const len = s.steps.length
  const count = (j: string) => s.notes.filter((n) => n.judgement === j).length
  const perfect = count('perfect')
  const good = count('good')
  const miss = count('miss')
  const wrong = count('wrong')
  const total = s.notes.length || 1
  const accuracy = (perfect + good) / total
  const bad = Array(len).fill(0)
  const seen = Array(len).fill(0)
  for (const n of s.notes) {
    seen[n.idx]++
    if (n.judgement !== 'perfect' && n.judgement !== 'good') bad[n.idx]++
  }
  const offsets = s.notes.filter((n) => n.offset !== undefined && n.judgement !== 'wrong').map((n) => n.offset!)
  const mean = offsets.length ? offsets.reduce((a, b) => a + b, 0) / offsets.length : 0
  const spread = offsets.length ? Math.sqrt(offsets.reduce((a, b) => a + (b - mean) ** 2, 0) / offsets.length) : 0
  const clean = s.loopsDone.filter((l) => l.clean).map((l) => l.bpm)
  const endBpm = s.bpm
  let suggestion: SessionResult['suggestion']
  if (accuracy >= 0.95) suggestion = { bpm: endBpm + 5, text: '깔끔해요. 5 올려서 다시 해보세요.' }
  else if (accuracy >= 0.8) suggestion = { bpm: endBpm, text: '거의 다 왔어요. 같은 속도로 한 번 더.' }
  else suggestion = { bpm: Math.max(40, round5(endBpm * 0.85)), text: '틀린 곳이 많아요. 속도를 낮춰 정확하게 먼저.' }
  return {
    mode: 'tempo',
    accuracy,
    heat: bad.map((b, i) => (seen[i] ? b / seen[i] : 0)),
    loops: s.loopsDone.length,
    tempo: {
      startBpm: s.opts.bpm,
      endBpm,
      bestCleanBpm: clean.length ? Math.max(...clean) : undefined,
      perfect,
      good,
      miss,
      wrong,
      strays: s.strays,
      meanOffset: offsets.length ? Math.round(mean) : null,
      spread: offsets.length ? Math.round(spread) : null,
    },
    suggestion,
  }
}

export function learnResult(s: LearnSession, perBeat: number): SessionResult {
  const accuracy = s.correct / Math.max(1, s.correct + s.wrong)
  const speed = s.speed
  const bpm = Math.min(240, Math.max(40, round5(((speed * 60) / perBeat) * 0.75)))
  return {
    mode: 'learn',
    accuracy,
    heat: s.errors.map((e) => Math.min(1, e / Math.max(1, s.loop))),
    loops: s.loop,
    learn: { speed, bestLoop: s.loopTimes.length ? Math.min(...s.loopTimes) : 0 },
    suggestion:
      accuracy >= 0.9
        ? { bpm, text: `순서는 손에 익었어요. 템포 모드 ♩=${bpm}부터 박자에 맞춰 보세요.` }
        : { bpm, text: '틀린 곳(빨간 글자)을 천천히 몇 번 더 익히고 넘어가세요.' },
  }
}
