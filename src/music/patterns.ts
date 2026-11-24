import type { FretNote } from './boxes'

export interface Pattern {
  id: string
  label: string
  description: string
  build: (notes: FretNote[]) => FretNote[]
}

/** Ascending groups of `size` notes, each group starting `step` notes higher. */
function groupsUp<T>(notes: T[], size: number, step = 1): T[] {
  const out: T[] = []
  for (let i = 0; i + size <= notes.length; i += step) out.push(...notes.slice(i, i + size))
  return out
}

/** Descending groups: same as groupsUp on the reversed list. */
function groupsDown<T>(notes: T[], size: number, step = 1): T[] {
  return groupsUp([...notes].reverse(), size, step)
}

/** Interval skips: 1-3, 2-4, 3-5 … */
function skipsUp<T>(notes: T[]): T[] {
  const out: T[] = []
  for (let i = 0; i + 2 < notes.length; i++) out.push(notes[i], notes[i + 2])
  return out
}

export const PATTERNS: Pattern[] = [
  {
    id: 'up',
    label: '상행',
    description: '6번줄부터 1번줄까지 차례로 올라갑니다.',
    build: (n) => [...n],
  },
  {
    id: 'down',
    label: '하행',
    description: '1번줄부터 6번줄까지 차례로 내려옵니다.',
    build: (n) => [...n].reverse(),
  },
  {
    id: 'updown',
    label: '상행 + 하행',
    description: '끝에서 멈추지 않고 왕복합니다. 반복할 때 끊김이 없습니다.',
    build: (n) => [...n, ...[...n].reverse().slice(1, -1)],
  },
  {
    id: 'threes',
    label: '3음 시퀀스',
    description: '1-2-3, 2-3-4 … 로 올라갔다가 같은 방식으로 내려옵니다.',
    build: (n) => [...groupsUp(n, 3), ...groupsDown(n, 3)],
  },
  {
    id: 'fours',
    label: '4음 시퀀스',
    description: '1-2-3-4, 2-3-4-5 … 로 올라갔다가 내려옵니다. 16분음표 연습에 좋습니다.',
    build: (n) => [...groupsUp(n, 4), ...groupsDown(n, 4)],
  },
  {
    id: 'skips',
    label: '건너뛰기 (3도)',
    description: '1-3, 2-4, 3-5 … 한 음씩 건너뛰며 올라갔다 내려옵니다.',
    build: (n) => [...skipsUp(n), ...skipsUp([...n].reverse())],
  },
  {
    id: 'pairs-down',
    label: '2줄 롤 하행',
    description: '두 줄씩 4음을 묶어 한 줄씩 내려오는 솔로 단골 패턴입니다.',
    build: (n) => groupsDown(n, 4, 2),
  },
  {
    id: 'sixes-down',
    label: '6음 하행 런',
    description: '6음씩 묶어 한 줄씩 내려오는 빠른 솔로 런입니다. 셋잇단으로 치면 좋습니다.',
    build: (n) => groupsDown(n, 6, 2),
  },
]

export function getPattern(id: string): Pattern {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0]
}
