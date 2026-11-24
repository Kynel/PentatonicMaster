import { useState } from 'react'
import { parseTab } from '../music/licks'
import type { CustomLick } from '../settings'

interface Props {
  editing: CustomLick | null
  onSave: (lick: CustomLick) => void
  onDelete: (id: string) => void
}

const EXAMPLE = '1:8:4 1:5:1p 2:8:4 2:5:1p 3:7:3 3:5:1'

export function LickEditor({ editing, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [tab, setTab] = useState(editing?.tab ?? '')
  const { notes, errors } = parseTab(tab)
  const canSave = notes.length >= 2 && errors.length === 0

  return (
    <div className="lick-editor">
      <p className="help">
        탭을 <code>줄:프렛:손가락</code> 형식으로 띄어쓰기해서 적으세요. 줄은 1(가장 얇은 줄)~6, 손가락은 1(검지)~4(새끼)이고
        생략하면 주변 프렛을 보고 정해요. 끝에 <code>h</code>(해머링), <code>p</code>(풀링), <code>s</code>(슬라이드)를 붙일 수 있고{' '}
        <code>|</code>는 구분용이에요. 예: <code>{EXAMPLE}</code>
      </p>
      <div className="row">
        <input id="lick-title" type="text" placeholder="릭 이름" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <textarea id="lick-tab" placeholder={EXAMPLE} value={tab} onChange={(e) => setTab(e.target.value)} spellCheck={false} />
      {errors.length > 0 && <p className="errors">{errors[0]}</p>}
      <div className="row">
        <button
          type="button"
          className="btn primary"
          disabled={!canSave}
          onClick={() =>
            onSave({ id: editing?.id ?? `custom-${Date.now()}`, title: title.trim() || `내 릭 ${new Date().toLocaleDateString()}`, tab: tab.trim() })
          }
        >
          {editing ? '수정 저장' : '내 릭으로 저장'}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={() => onDelete(editing.id)}>
            이 릭 삭제
          </button>
        )}
        <span className="help">{notes.length}음</span>
      </div>
    </div>
  )
}
