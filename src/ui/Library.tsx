import { GROUP_LABELS, type Exercise, type Group } from '../exercises'
import type { ExRecord } from '../store'

interface Props {
  exercises: Exercise[]
  selected: string
  records: { [key: string]: ExRecord }
  onSelect: (id: string) => void
  onNewPattern: () => void
}

const ORDER: Group[] = ['drill', 'pattern', 'lick', 'custom']

function bestFor(ex: Exercise, records: Props['records']): number | undefined {
  // patterns are recorded per box; show the best box
  const keys = Object.keys(records).filter((k) => k === ex.id || k.startsWith(`${ex.id}@`))
  const bpms = keys.map((k) => records[k].bestBpm).filter((b): b is number => b !== undefined)
  return bpms.length ? Math.max(...bpms) : undefined
}

export function Library({ exercises, selected, records, onSelect, onNewPattern }: Props) {
  return (
    <nav className="library" aria-label="연습 목록">
      {ORDER.map((g) => {
        const items = exercises.filter((e) => e.group === g)
        return (
          <section key={g} className="lib-group">
            <h3>{GROUP_LABELS[g]}</h3>
            {items.map((ex) => {
              const best = bestFor(ex, records)
              return (
                <button
                  key={ex.id}
                  type="button"
                  className={`lib-item ${ex.id === selected ? 'on' : ''}`}
                  onClick={(e) => {
                    onSelect(ex.id)
                    e.currentTarget.blur()
                  }}
                >
                  <span className="lib-title">{ex.title}</span>
                  {ex.tag && <span className="lib-tag">{ex.tag}</span>}
                  {best !== undefined && <span className="lib-best">♩{best}</span>}
                </button>
              )
            })}
            {g === 'custom' && (
              <button type="button" className="lib-item add" onClick={onNewPattern}>
                + 새 패턴 만들기
              </button>
            )}
          </section>
        )
      })}
    </nav>
  )
}
