import { getBoxNotes, type FretNote } from './music/boxes'
import { LICKS, STYLE_LABELS, buildLick, parseTab, type Lick } from './music/licks'
import { PATTERNS } from './music/patterns'
import { STRING_LABELS } from './music/theory'
import type { Step } from './engine/types'

export type Group = 'drill' | 'pattern' | 'lick' | 'custom'

export const GROUP_LABELS: Record<Group, string> = {
  drill: '손가락 독립 드릴',
  pattern: '펜타토닉 패턴',
  lick: '솔로 릭',
  custom: '내 패턴',
}

export interface Exercise {
  id: string
  group: Group
  title: string
  /** short tag shown in the list, e.g. "J-rock" */
  tag?: string
  description: string
  /** default notes per beat in tempo mode */
  perBeat: number
  /** pentatonic patterns can be played in any of the five boxes */
  boxed?: boolean
  build: (box: number) => Step[]
}

export interface CustomPattern {
  id: string
  title: string
  text: string
}

function toSteps(notes: FretNote[]): Step[] {
  return notes.map((n) => ({
    finger: n.finger,
    gap: n.gap,
    tech: n.tech,
    midi: n.midi,
    where: n.string >= 0 ? `${STRING_LABELS[n.string]} ${n.fret}` : undefined,
  }))
}

function fromKeys(text: string): Step[] {
  return toSteps(parseTab(text).notes)
}

const DRILLS: { id: string; title: string; keys: string; description: string; perBeat?: number }[] = [
  { id: 'chromatic-up', title: '1-2-3-4 크로매틱', keys: 'asdf', description: '검지부터 새끼까지 차례로. 모든 손가락에 같은 힘을 싣는 기본 워밍업입니다.' },
  { id: 'chromatic-down', title: '4-3-2-1 역순', keys: 'fdsa', description: '새끼부터 검지로 내려옵니다. 풀링 오프 방향의 손가락 순서입니다.' },
  { id: 'spider', title: '스파이더 1234-4321', keys: 'asdf fdsa', description: '올라갔다 내려오는 왕복. 손가락이 꼬이지 않고 방향을 바꾸는 연습입니다.' },
  { id: 'cross-1324', title: '1-3-2-4 교차', keys: 'adsf', description: '이웃하지 않은 손가락을 번갈아 누릅니다. 손가락 독립성에 가장 효과적입니다.' },
  { id: 'cross-1423', title: '1-4-2-3 교차', keys: 'afsd', description: '바깥 손가락과 안쪽 손가락을 오갑니다.' },
  { id: 'trill-13', title: '트릴 1-3 (검지-약지)', keys: 'adad', description: '펜타토닉에서 가장 많이 쓰는 검지-약지 반복입니다.' },
  { id: 'trill-14', title: '트릴 1-4 (검지-새끼)', keys: 'afaf', description: '펜타토닉 박스 1의 바깥 두 손가락. 새끼 힘을 기릅니다.' },
  { id: 'trill-24', title: '트릴 2-4 (중지-새끼)', keys: 'sfsf', description: '박스 2·5에서 자주 나오는 중지-새끼 반복입니다.' },
  { id: 'trill-34', title: '트릴 3-4 (약지-새끼)', keys: 'dfdf', description: '가장 약한 두 손가락. 짧게 자주 연습하세요.' },
  { id: 'penta-box1', title: '펜타 박스 1 손가락 흐름', keys: 'af ad ad ad af af', description: '박스 1을 위로 올라갈 때의 손가락 순서만 뽑았습니다.', perBeat: 2 },
]

const LICK_PER_BEAT: Record<string, number> = {
  'rock-triplet-roll': 3,
  'jrock-sextuplet-9th': 3,
  'jrock-legato-trill': 3,
  'jrock-wide-descent': 3,
}

export const BUILT_IN: Exercise[] = [
  ...DRILLS.map<Exercise>((d) => ({
    id: `drill-${d.id}`,
    group: 'drill',
    title: d.title,
    description: d.description,
    perBeat: d.perBeat ?? 4,
    // short drills repeat so one loop fills a line and has some length to build stamina
    build: () => fromKeys(Array(Math.max(1, Math.ceil(16 / d.keys.replace(/\s/g, '').length))).fill(d.keys).join(' ')),
  })),
  ...PATTERNS.map<Exercise>((p) => ({
    id: `pattern-${p.id}`,
    group: 'pattern',
    title: p.label,
    description: p.description,
    perBeat: p.id === 'threes' || p.id === 'sixes-down' ? 3 : 4,
    boxed: true,
    build: (box) =>
      toSteps(p.build(getBoxNotes(9, 'minor', box)).map((n, i, all) => ({ ...n, gap: i > 0 && all[i - 1].string !== n.string }))),
  })),
  ...LICKS.map<Exercise>((l: Lick) => ({
    id: `lick-${l.id}`,
    group: 'lick',
    title: l.title,
    tag: STYLE_LABELS[l.style],
    description: l.description,
    perBeat: LICK_PER_BEAT[l.id] ?? 4,
    build: () => toSteps(buildLick(l, 9, 'minor')),
  })),
]

export function customExercise(c: CustomPattern): Exercise {
  return {
    id: c.id,
    group: 'custom',
    title: c.title,
    description: '직접 만든 손가락 순서입니다.',
    perBeat: 4,
    build: () => fromKeys(c.text),
  }
}

/** Key for records and remembered tempo: patterns are tracked per box. */
export function exerciseKey(ex: Exercise, box: number): string {
  return ex.boxed ? `${ex.id}@${box}` : ex.id
}
