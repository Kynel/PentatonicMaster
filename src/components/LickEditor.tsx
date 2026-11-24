import { useState } from 'react'
import { parseTab } from '../music/licks'
import type { CustomLick } from '../settings'

interface Props {
  editing: CustomLick | null
  onSave: (lick: CustomLick) => void
  onDelete: (id: string) => void
}

const EXAMPLE = 'sfdf sfsf dfsf sfsf sasa ffdf sfsf ds'

export function LickEditor({ editing, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [tab, setTab] = useState(editing?.tab ?? '')
  const { notes, errors } = parseTab(tab)
  const canSave = notes.length >= 2 && errors.length === 0

  return (
    <div className="lick-editor">
      <p className="help">
        솔로에서 손가락이 움직이는 순서를 키로 적으세요. <code>a s d f</code> = 1 2 3 4번 손가락(검지~새끼)이고, 띄어쓰기는
        묶음 구분이에요. 예: <code>{EXAMPLE}</code>
        <br />
        줄과 프렛까지 적고 싶으면 탭 형식(<code>줄:프렛:손가락</code>, 예: <code>1:8:4 1:5:1p 2:8:4</code>)도 쓸 수 있어요.
      </p>
      <div className="row">
        <input id="lick-title" type="text" placeholder="패턴 이름" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <textarea id="lick-tab" placeholder={EXAMPLE} value={tab} onChange={(e) => setTab(e.target.value)} spellCheck={false} />
      {errors.length > 0 && <p className="errors">{errors[0]}</p>}
      <div className="row">
        <button
          type="button"
          className="btn primary"
          disabled={!canSave}
          onClick={() =>
            onSave({ id: editing?.id ?? `custom-${Date.now()}`, title: title.trim() || `내 패턴 ${new Date().toLocaleDateString()}`, tab: tab.trim() })
          }
        >
          {editing ? '수정 저장' : '내 패턴으로 저장'}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={() => onDelete(editing.id)}>
            이 패턴 삭제
          </button>
        )}
        <span className="help">{notes.length}타</span>
      </div>
    </div>
  )
}
