import { useState } from 'react'
import type { CustomPattern } from '../exercises'
import { parseTab } from '../music/licks'
import type { Hand } from '../practice/keymap'
import { SequenceView } from './SequenceView'

interface Props {
  editing: CustomPattern | null
  hand: Hand
  onSave: (p: CustomPattern) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function PatternEditor({ editing, hand, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [text, setText] = useState(editing?.text ?? '')
  const { notes, errors } = parseTab(text)
  const steps = notes.map((n) => ({ finger: n.finger, gap: n.gap, midi: n.midi }))
  const ok = notes.length >= 2 && errors.length === 0

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-label="내 패턴" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{editing ? '패턴 수정' : '새 패턴 만들기'}</h2>
        <p className="muted">
          솔로에서 손가락이 움직이는 순서를 키로 적으세요. <b>a s d f</b> = 검지 중지 약지 새끼, 띄어쓰기는 보기 좋게 묶는 용도예요.
          줄과 프렛까지 적고 싶으면 <code>1:8:4 1:5:1p</code> 같은 탭 형식도 돼요.
        </p>
        <label className="field">
          <span>이름</span>
          <input id="pattern-title" type="text" value={title} placeholder="예: 그 곡 후반 속주" onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span>손가락 순서</span>
          <textarea id="pattern-text" value={text} spellCheck={false} placeholder="sfdf sfsf dfsf sfsf sasa ffdf" onChange={(e) => setText(e.target.value)} />
        </label>
        {errors.length > 0 && <p className="error">{errors[0]}</p>}
        {steps.length > 0 && (
          <div className="editor-preview">
            <SequenceView steps={steps} hand={hand} pos={-1} size="small" />
            <span className="muted">{steps.length}타</span>
          </div>
        )}
        <div className="modal-actions">
          {editing && (
            <button type="button" className="btn ghost danger" onClick={() => onDelete(editing.id)}>
              삭제
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!ok}
            onClick={() => onSave({ id: editing?.id ?? `custom-${Date.now()}`, title: title.trim() || '이름 없는 패턴', text: text.trim() })}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
