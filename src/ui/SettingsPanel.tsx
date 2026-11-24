import type { Prefs } from '../store'

interface Props {
  prefs: Prefs
  onChange: (p: Partial<Prefs>) => void
  onClose: () => void
}

export function SettingsPanel({ prefs, onChange, onClose }: Props) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-label="설정" onMouseDown={(e) => e.stopPropagation()}>
        <h2>설정</h2>
        <div className="field">
          <span>연습할 손</span>
          <div className="seg">
            <button type="button" className={prefs.hand === 'left' ? 'on' : ''} onClick={() => onChange({ hand: 'left' })}>
              왼손 A S D F
            </button>
            <button type="button" className={prefs.hand === 'right' ? 'on' : ''} onClick={() => onChange({ hand: 'right' })}>
              오른손 J K L ;
            </button>
          </div>
        </div>
        <label className="check">
          <input id="opt-sound" type="checkbox" checked={prefs.sound} onChange={(e) => onChange({ sound: e.target.checked })} />
          맞게 치면 기타 소리 내기
        </label>
        <label className="check">
          <input id="opt-click" type="checkbox" checked={prefs.click} onChange={(e) => onChange({ click: e.target.checked })} />
          템포 모드 메트로놈 소리
        </label>
        <label className="field">
          <span>
            입력 지연 보정 <b>{prefs.latencyMs}ms</b>
          </span>
          <input
            id="opt-latency"
            type="range"
            min={0}
            max={150}
            step={5}
            value={prefs.latencyMs}
            onChange={(e) => onChange({ latencyMs: Number(e.target.value) })}
          />
          <span className="muted">박자에 맞게 쳤는데 계속 "밀림"으로 나오면 이 값을 올리세요. 블루투스 이어폰은 100ms 이상이 필요할 수 있어요.</span>
        </label>
        <div className="modal-actions">
          <span className="spacer" />
          <button type="button" className="btn primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
