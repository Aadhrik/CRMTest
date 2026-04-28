import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  ObjectSchema,
  PickListOption,
  Record_,
  SmartVariable,
} from '@/lib/types'
import { Icon } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { FieldValueCell } from '@/components/FieldValue'
import { useCrmStore } from '@/store/useCrmStore'
import { cn, formatCurrency } from '@/lib/utils'

interface Props {
  schema: ObjectSchema
  groupBy: SmartVariable // the pick_list variable we're grouping by
  records: Record_[]
}

// Dot color classes that match Badge's COLOR_MAP keys
const DOT_BG: Record<string, string> = {
  slate: 'bg-slate-400',
  zinc: 'bg-zinc-400',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
}

const COL_TINT: Record<string, string> = {
  slate: 'bg-slate-50/60',
  zinc: 'bg-zinc-50/60',
  indigo: 'bg-indigo-50/40',
  violet: 'bg-violet-50/40',
  sky: 'bg-sky-50/40',
  emerald: 'bg-emerald-50/40',
  amber: 'bg-amber-50/40',
  rose: 'bg-rose-50/40',
  pink: 'bg-pink-50/40',
  teal: 'bg-teal-50/40',
}

export function Kanban({ schema, groupBy, records }: Props) {
  const moveRecord = useCrmStore((s) => s.moveRecordToGroup)
  const updateOption = useCrmStore((s) => s.updatePickListOption)
  const navigate = useNavigate()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoverCol, setHoverCol] = useState<string | null>(null)
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  function startEdit(optionId: string, currentLabel: string) {
    setEditingColId(optionId)
    setEditLabel(currentLabel)
    setTimeout(() => editInputRef.current?.select(), 0)
  }

  function commitEdit() {
    if (editingColId && editLabel.trim()) {
      updateOption(schema.key, groupBy.key, editingColId, { label: editLabel.trim() })
    }
    setEditingColId(null)
  }

  const options = useMemo<PickListOption[]>(
    () => (groupBy.options ?? []).slice().sort((a, b) => a.order - b.order),
    [groupBy],
  )

  const buckets = useMemo(() => {
    const map: globalThis.Record<string, Record_[]> = {}
    for (const o of options) map[o.id] = []
    const unstaged: Record_[] = []
    for (const r of records) {
      const v = r.fields[groupBy.key]
      if (v && typeof v === 'object' && 'optionId' in v && map[v.optionId]) {
        map[v.optionId].push(r)
      } else {
        unstaged.push(r)
      }
    }
    return { map, unstaged }
  }, [records, options, groupBy.key])

  const columns = useMemo(() => {
    const base = options.map((o) => ({ option: o, records: buckets.map[o.id] }))
    if (buckets.unstaged.length > 0) {
      base.push({
        option: {
          id: '__unstaged__',
          label: `No ${groupBy.name.toLowerCase()}`,
          color: 'zinc',
          order: 999,
        },
        records: buckets.unstaged,
      })
    }
    return base
  }, [options, buckets, groupBy.name])

  const primaryKey = schema.variables.find((v) => v.pinned)?.key ?? 'name'

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-4">
      {columns.map((col) => {
        const isHover = hoverCol === col.option.id && draggingId
        const tint = COL_TINT[col.option.color] ?? COL_TINT.zinc
        const dot = DOT_BG[col.option.color] ?? DOT_BG.zinc
        const totalValue = col.records.reduce((sum, r) => {
          const amt = r.fields.amount ?? r.fields.price
          return typeof amt === 'number' ? sum + amt : sum
        }, 0)

        return (
          <div
            key={col.option.id}
            onDragOver={(e) => {
              e.preventDefault()
              setHoverCol(col.option.id)
            }}
            onDragLeave={() => setHoverCol(null)}
            onDrop={(e) => {
              e.preventDefault()
              const recordId = e.dataTransfer.getData('text/plain')
              if (recordId && col.option.id !== '__unstaged__') {
                moveRecord(recordId, groupBy.key, col.option.id)
              }
              setHoverCol(null)
              setDraggingId(null)
            }}
            className={cn(
              'flex w-[300px] shrink-0 flex-col rounded-xl border transition-colors',
              isHover
                ? 'border-accent-400 bg-accent-50/60 ring-2 ring-accent-500/20'
                : cn('border-ink-200', tint),
            )}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />
              {editingColId === col.option.id ? (
                <input
                  ref={editInputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                    if (e.key === 'Escape') { setEditingColId(null) }
                  }}
                  className="min-w-0 flex-1 rounded border border-accent-400 bg-white px-1.5 py-0.5 text-[12.5px] font-semibold text-ink-900 outline-none ring-2 ring-accent-500/20"
                />
              ) : (
                <span
                  onClick={() =>
                    col.option.id !== '__unstaged__' &&
                    startEdit(col.option.id, col.option.label)
                  }
                  title={col.option.id !== '__unstaged__' ? 'Click to rename' : undefined}
                  className={cn(
                    'text-[12.5px] font-semibold text-ink-900',
                    col.option.id !== '__unstaged__' && 'cursor-text hover:text-accent-700',
                  )}
                >
                  {col.option.label}
                </span>
              )}
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-ink-500 ring-1 ring-inset ring-ink-200">
                {col.records.length}
              </span>
              {totalValue > 0 && (
                <span className="ml-auto text-[10.5px] font-medium tabular-nums text-ink-500">
                  {formatCurrency(totalValue)}
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {col.records.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-ink-200 p-4 text-center">
                  <span className="text-[11.5px] text-ink-400">
                    Drop here
                  </span>
                </div>
              ) : (
                col.records.map((r) => {
                  const isDragging = draggingId === r.id
                  const name = (r.fields[primaryKey] as string) ?? 'Untitled'
                  return (
                    <article
                      key={r.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', r.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggingId(r.id)
                      }}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setHoverCol(null)
                      }}
                      onClick={() => navigate(`/o/${schema.key}/${r.id}`)}
                      className={cn(
                        'group cursor-grab rounded-lg border border-ink-200 bg-white p-3 shadow-elev-1',
                        'transition-all hover:shadow-elev-2 hover:-translate-y-px active:cursor-grabbing',
                        isDragging && 'opacity-40 rotate-1',
                      )}
                    >
                      <KanbanCard
                        schema={schema}
                        record={r}
                        name={name}
                      />
                    </article>
                  )
                })
              )}
            </div>

            {/* Add record stub */}
            <button
              className="group flex h-9 items-center gap-1.5 border-t border-ink-200/60 px-3.5 text-[12px] font-medium text-ink-500 hover:bg-white hover:text-ink-900"
              onClick={() => {}}
            >
              <Icon name="Plus" size={12} strokeWidth={2.5} />
              <span>Add {schema.name.toLowerCase()}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({
  schema,
  record,
  name,
}: {
  schema: ObjectSchema
  record: Record_
  name: string
}) {
  // Show up to 3 secondary fields on the card
  const secondary = schema.variables
    .filter((v) => !v.pinned || v.key !== schema.variables.find((x) => x.pinned)?.key)
    .filter((v) => {
      const val = record.fields[v.key]
      return val != null && val !== ''
    })
    .slice(0, 3)

  const linkedCount = record.links?.length ?? 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {schema.key === 'customer' ? (
          <Avatar name={name} size="sm" />
        ) : (
          <span
            className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-ink-50 ring-1 ring-inset ring-ink-200"
            style={{ color: schema.color }}
          >
            <Icon name={schema.icon} size={12} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink-900">
            {name}
          </div>
        </div>
        {record.aiWritten && Object.keys(record.aiWritten).length > 0 && (
          <span
            title="AI-written values on this record"
            className="mt-1 text-accent-500"
          >
            <Icon name="Sparkles" size={10} strokeWidth={2} />
          </span>
        )}
      </div>

      {secondary.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {secondary.map((v) => (
            <span
              key={v.key}
              className="inline-flex items-center gap-1 text-[11px] text-ink-600"
            >
              <FieldValueCell
                variable={v}
                value={record.fields[v.key] as never}
                muted
              />
            </span>
          ))}
        </div>
      )}

      {(linkedCount > 0 || record.updatedAt) && (
        <div className="flex items-center gap-2 border-t border-ink-100 pt-2 text-[10.5px] text-ink-500">
          {linkedCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Icon name="Link2" size={10} />
              {linkedCount}
            </span>
          )}
          <span className="ml-auto">
            {new Date(record.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  )
}

