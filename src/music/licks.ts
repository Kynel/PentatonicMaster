import type { Finger, FretNote, ScaleType } from './boxes'
import { minorRootPc } from './boxes'
import { TUNING } from './theory'

export type LickStyle = 'keys' | 'rock' | 'blues' | 'jrock' | 'custom'

export interface Lick {
  id: string
  title: string
  style: LickStyle
  description: string
  /**
   * Tab notation written in A minor. Tokens are `string:fret[:finger][tech]` where string uses
   * guitar numbering (1 = high e … 6 = low E), finger is 1–4 and tech is h (hammer-on),
   * p (pull-off) or s (slide) into this note. `|` is only a visual group separator.
   */
  tab: string
}

export const STYLE_LABELS: Record<LickStyle, string> = {
  keys: '키 순서',
  rock: '록',
  blues: '블루스',
  jrock: 'J-rock 스타일',
  custom: '내 패턴',
}

/** Original practice licks in the style of each genre, all written in A minor. */
export const LICKS: Lick[] = [
  {
    id: 'keys-solo-example',
    title: '빠른 솔로 손가락 순서 (예시)',
    style: 'keys',
    description: '중지·새끼·약지를 빠르게 오가는 솔로 손가락 순서입니다. 키 순서만으로 연습합니다.',
    tab: 'sfdfsfsfdfsfsfsfsasaffdfsfsfds',
  },
  {
    id: 'rock-triplet-roll',
    title: '1·2번줄 트리플렛 롤',
    style: 'rock',
    description: '박스 1 위쪽 두 줄을 셋잇단으로 굴리는 록 솔로 단골 릭. 새끼-검지 풀링이 핵심입니다.',
    tab: '1:8:4 1:5:1p 2:8:4 | 1:8:4 1:5:1p 2:8:4 | 1:8:4 1:5:1p 2:8:4 | 2:5:1 3:7:3 3:5:1p',
  },
  {
    id: 'rock-string-cross',
    title: '줄 넘나들기 왕복',
    style: 'rock',
    description: '이웃한 두 줄을 번갈아 치며 내려갑니다. 피킹 줄 이동과 손가락 독립을 함께 훈련합니다.',
    tab: '2:5:1 1:5:1 2:8:4 1:8:4 | 3:5:1 2:5:1 3:7:3 2:8:4 | 4:5:1 3:5:1 4:7:3 3:7:3 | 5:5:1 4:5:1 5:7:3 4:7:3',
  },
  {
    id: 'rock-box1-to-2',
    title: '박스 1 → 2 슬라이드 연결',
    style: 'rock',
    description: '3번줄 슬라이드로 박스 2로 넘어가 1번줄 10프렛까지 올라갑니다. 포지션 이동 감각을 익힙니다.',
    tab: '4:5:1 4:7:3 3:5:1 3:7:3 | 3:9:3s 2:8:2 2:10:4 1:8:2 | 1:10:4 1:8:2p 2:10:4 2:8:2p | 3:9:3',
  },
  {
    id: 'blues-blue-note',
    title: '블루노트 경유 하행',
    style: 'blues',
    description: '3번줄 8프렛(♭5)을 지나 내려오는 블루스 릭. 약지-새끼 사이 반음 이동을 연습합니다.',
    tab: '3:5:1 3:7:3h 3:8:4h 3:7:3p 3:5:1p | 4:7:3 4:5:1p 5:7:3 | 5:6:2 5:5:1p 6:8:4 6:5:1p',
  },
  {
    id: 'blues-call-response',
    title: '콜 앤 리스폰스 턴어라운드',
    style: 'blues',
    description: '위쪽 줄에서 짧게 묻고 아래 줄에서 대답하는 구조의 블루스 프레이즈입니다.',
    tab: '1:5:1 2:8:4 2:5:1 3:7:3 | 1:5:1 2:8:4 2:5:1 3:7:3 | 3:5:1 4:7:3 4:5:1 5:7:3 | 5:5:1 6:8:4 6:5:1',
  },
  {
    id: 'jrock-sextuplet-9th',
    title: '6연음 하행 런 (9도 포함)',
    style: 'jrock',
    description: '박스 4에서 9도(B)를 섞어 6음씩 쏟아지듯 내려옵니다. 빠른 J-rock 솔로에서 자주 들리는 흐름입니다.',
    tab: '1:15:4 1:12:1p 2:15:4 2:13:2 2:12:1 3:14:3 | 2:13:2 2:12:1 3:14:3 3:12:1 4:14:3 4:12:1 | 3:14:3 3:12:1 4:14:3 4:12:1 5:15:4 5:12:1',
  },
  {
    id: 'jrock-climb-positions',
    title: '포지션 계단 상승 런',
    style: 'jrock',
    description: '4·3번줄 4음 묶음을 박스 1→2→3→4로 옮겨가며 지판을 타고 올라가 1번줄 17프렛에서 끝냅니다.',
    tab: '4:5:1 4:7:3 3:5:1 3:7:3 | 4:7:1 4:10:4 3:7:1 3:9:3 | 4:10:2 4:12:4 3:9:1 3:12:4 | 4:12:1 4:14:3 3:12:1 3:14:3 | 2:13:2 2:15:4 1:12:1 1:15:4 | 1:17:4s',
  },
  {
    id: 'jrock-legato-trill',
    title: '레가토 트릴 체인',
    style: 'jrock',
    description: '한 번 피킹하고 해머링·풀링으로 굴리는 고속 레가토. 1번줄에서 3번줄로 내려가며 새끼와 약지 힘을 기릅니다.',
    tab: '1:5:1 1:8:4h 1:5:1p 1:8:4h 1:5:1p 2:8:4 | 2:5:1p 2:8:4h 2:5:1p 2:8:4h 2:5:1p 3:7:3 | 3:5:1p 3:7:3h 3:5:1p 3:7:3h 3:5:1p 4:7:3',
  },
  {
    id: 'jrock-wide-descent',
    title: '박스 5 → 1 와이드 하행',
    style: 'jrock',
    description: '17프렛에서 5프렛까지 박스를 넘나들며 내려오는 긴 런. 포지션이 바뀌어도 손가락 순서가 무너지지 않게 연습합니다.',
    tab: '1:17:4 1:15:2 2:17:4 2:15:2 3:17:4 3:14:1 | 1:15:4 1:12:1 2:15:4 2:13:2 3:14:3 3:12:1 | 1:10:4 1:8:2 2:10:4 2:8:2 3:9:3 3:7:1 | 1:8:4 1:5:1 2:8:4 2:5:1 3:7:3 3:5:1 | 4:7:3',
  },
  {
    id: 'jrock-string-skip',
    title: '스트링 스킵 아르페지오',
    style: 'jrock',
    description: '한 줄씩 건너뛰며 넓은 음정을 오가는 화려한 프레이즈. 줄 건너뛰기 정확도를 훈련합니다.',
    tab: '6:5:1 4:7:3 3:5:1 4:7:3 | 5:7:3 3:7:3 2:5:1 3:7:3 | 4:7:3 2:8:4 1:5:1 2:8:4 | 3:7:3 1:8:4 1:5:1 2:5:1',
  },
]

const TECHS = new Set(['h', 'p', 's'])

export interface ParseResult {
  notes: FretNote[]
  errors: string[]
}

const LETTER_FINGERS: Record<string, Finger> = { a: 1, s: 2, d: 3, f: 4, j: 1, k: 2, l: 3, ';': 4 }
/** Pitches used to sound key-only patterns: A B C D on the high e string. */
const LETTER_MIDI: Record<Finger, number> = { 1: 69, 2: 71, 3: 72, 4: 74 }

/** True when the text is a plain key sequence like "sfdf sfsf" rather than tab notation. */
export function isKeySequence(text: string): boolean {
  return !text.includes(':')
}

function parseKeys(text: string): ParseResult {
  const notes: FretNote[] = []
  const errors: string[] = []
  let gap = false
  for (const ch of text.toLowerCase()) {
    if (/[\s|,]/.test(ch)) {
      gap = notes.length > 0
      continue
    }
    const finger = LETTER_FINGERS[ch]
    if (!finger) {
      if (errors.length === 0) errors.push(`"${ch}"는 쓸 수 없어요. a s d f (또는 j k l ;)만 적어주세요.`)
      continue
    }
    notes.push({ string: -1, fret: 0, finger, midi: LETTER_MIDI[finger], isRoot: false, gap })
    gap = false
  }
  return { notes, errors }
}

/**
 * Parse a lick: either a plain key sequence ("sfdfsf", a=1 … f=4) or tab notation
 * (`string:fret[:finger][tech]`). In tab notation a missing finger is guessed from the frets
 * around the note, and `|` starts a new group.
 */
export function parseTab(tab: string): ParseResult {
  if (isKeySequence(tab)) return parseKeys(tab)
  const errors: string[] = []
  const raw: { string: number; fret: number; finger: number | null; tech?: 'h' | 'p' | 's'; gap: boolean }[] = []
  let gap = false
  for (const token of tab.split(/[\s,]+/).filter(Boolean)) {
    if (token === '|') {
      gap = raw.length > 0
      continue
    }
    const m = /^([1-6]):(\d{1,2})(?::([1-4]))?([hps])?$/i.exec(token)
    if (!m) {
      errors.push(`"${token}"을(를) 읽을 수 없어요. 줄:프렛:손가락 형식(예: 1:8:4)으로 적어주세요.`)
      continue
    }
    const fret = Number(m[2])
    if (fret > 24) {
      errors.push(`"${token}": 프렛은 24 이하만 쓸 수 있어요.`)
      continue
    }
    const tech = m[4]?.toLowerCase()
    raw.push({
      string: 6 - Number(m[1]),
      fret,
      finger: m[3] ? Number(m[3]) : null,
      tech: tech && TECHS.has(tech) ? (tech as 'h' | 'p' | 's') : undefined,
      gap,
    })
    gap = false
  }
  const notes = raw.map((n, i) => {
    let finger = n.finger
    if (finger === null) {
      // anchor the hand at the lowest fretted note nearby, then count up
      const near = raw.slice(Math.max(0, i - 3), i + 4).map((r) => r.fret).filter((f) => f > 0)
      const anchor = near.length ? Math.min(...near) : n.fret
      finger = Math.min(4, Math.max(1, n.fret - anchor + 1))
    }
    return {
      string: n.string,
      fret: n.fret,
      finger: finger as Finger,
      midi: TUNING[n.string] + n.fret,
      isRoot: false,
      tech: n.tech,
      gap: n.gap,
    }
  })
  return { notes, errors }
}

/**
 * Notes of a lick moved to the selected key. Licks are written in A minor; they are moved by
 * the smallest shift that keeps every fret between 1 and 24.
 */
export function buildLick(lick: Lick, keyPc: number, scale: ScaleType): FretNote[] {
  const { notes } = parseTab(lick.tab)
  if (notes.length === 0) return []
  if (notes[0].string < 0) return notes
  const up = (((minorRootPc(keyPc, scale) - 9) % 12) + 12) % 12
  const frets = notes.map((n) => n.fret)
  const lo = Math.min(...frets)
  const hi = Math.max(...frets)
  const candidates = [up, up - 12].filter((d) => lo + d >= 1 && hi + d <= 24)
  const shift = lick.style === 'custom' ? 0 : candidates.sort((a, b) => Math.abs(a) - Math.abs(b))[0] ?? up
  const tonicPc = ((keyPc % 12) + 12) % 12
  return notes.map((n) => {
    const fret = n.fret + shift
    const midi = TUNING[n.string] + fret
    return { ...n, fret, midi, isRoot: midi % 12 === tonicPc }
  })
}
