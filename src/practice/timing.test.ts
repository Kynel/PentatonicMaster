import { describe, expect, it } from 'vitest'
import { judgePress, noteInterval } from './timing'

describe('timing judgement', () => {
  const iv = noteInterval(100, 4) // 150ms per 16th at 100 BPM
  it('perfect when on time with the right finger', () => expect(judgePress(0.01, true, iv)).toBe('perfect'))
  it('good when slightly off', () => expect(judgePress(-0.05, true, iv)).toBe('good'))
  it('wrong finger in the window is wrong', () => expect(judgePress(0, false, iv)).toBe('wrong'))
  it('too early does not count for this note', () => expect(judgePress(-0.2, true, iv)).toBeNull())
  it('late beyond the window is a miss', () => expect(judgePress(0.2, true, iv)).toBe('miss'))
})
