import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ObjectSchema, Record_, SmartVariable } from '@/lib/types'
import { FieldValueCell } from '@/components/FieldValue'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

interface Props {
  schema: ObjectSchema
  records: Record_[]
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

export function ObjectTable({ schema, records }: Props) {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortState>(null)
  const [hoverRow, setHoverRow] = useState<string | null>(null)

  // Columns: all pinned variables + a few extras (first 7 total)
  const columns = useMemo<SmartVariable[]>(() => {
    const pinned = schema.variables.filter((v) => v.pinned)
    const others = schema.variables.filter((v) => !v.pinned)
    return [...pinned, ...others].slice(0, 8)
  }, [schema])

  const sortedRecords = useMemo(() => {
    if (!sort) return records
    const arr = [...records]
    arr.sort((a, b) => {
      const av = a.fields[sort.key]
      const bv = b.fields[sort.key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      // Compare by string for mixed safety
      const as = typeof av === 'object' ? JSON.stringify(av) : String(av)
      const bs = typeof bv === 'object' ? JSON.stringify(bv) : String(bv)
      return sort.dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return arr
  }, [records, sort])

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const primaryKey = columns[0]?.key ?? 'name'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Scroll container — horizontal for wide tables */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[960px] border-separate border-spacing-0 text-[13px]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              {/* Checkbox col */}
              <th className="w-10 border-b border-ink-200 bg-white px-4 py-0">
                <div className="flex h-9 items-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer rounded border-ink-300 text-accent-500 accent-accent-500"
                    aria-label="Select all"
                  />
                </div>
              </th>
              {columns.map((col, i) => {
                const isSorted = sort?.key === col.key
                return (
                  <th
                    key={col.id}
                    className={cn(
                      'select-none border-b border-ink-200 bg-white px-3 py-0 text-left font-medium text-ink-500',
                      i === 0 && 'min-w-[220px]',
                    )}
                  >
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="group flex h-9 items-center gap-1.5 text-left text-[11.5px] font-semibold uppercase tracking-wider text-ink-500 hover:text-ink-900"
                    >
                      {col.icon && (
                        <Icon name={col.icon} size={12} className="text-ink-400" />
                      )}
                      <span>{col.name}</span>
                      <span
                        className={cn(
                          'opacity-0 transition-opacity',
                          isSorted ? 'opacity-100 text-ink-700' : 'group-hover:opacity-60',
                        )}
                      >
                        {isSorted && sort.dir === 'desc' ? (
                          <Icon name="ArrowDown" size={11} strokeWidth={2.5} />
                        ) : (
                          <Icon name="ArrowUp" size={11} strokeWidth={2.5} />
                        )}
                      </span>
                    </button>
                  </th>
                )
              })}
              <th className="w-10 border-b border-ink-200 bg-white" />
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((r) => {
              const isHover = hoverRow === r.id
              const displayName = (r.fields[primaryKey] as string) ?? '—'
              return (
                <tr
                  key={r.id}
                  onMouseEnter={() => setHoverRow(r.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  onClick={() => navigate(`/o/${schema.key}/${r.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-ink-50/70"
                >
                  <td className="border-b border-ink-100 px-4">
                    <div className="flex h-11 items-center">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'h-3.5 w-3.5 cursor-pointer rounded border-ink-300 text-accent-500 accent-accent-500 transition-opacity',
                          isHover ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </div>
                  </td>
                  {columns.map((col, i) => {
                    const value = r.fields[col.key]
                    const isAi = r.aiWritten?.[col.key]
                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'border-b border-ink-100 px-3 align-middle',
                          i === 0 && 'font-medium text-ink-900',
                        )}
                      >
                        <div className="flex h-11 items-center gap-2">
                          {i === 0 && schema.key === 'customer' && (
                            <Avatar name={String(displayName)} size="sm" />
                          )}
                          {i === 0 && schema.key !== 'customer' && (
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded bg-ink-50 ring-1 ring-inset ring-ink-200"
                              style={{ color: schema.color }}
                            >
                              <Icon name={schema.icon} size={12} />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <FieldValueCell
                              variable={col}
                              value={value as never}
                              muted={i !== 0}
                            />
                          </div>
                          {isAi && (
                            <span
                              title={`AI-written · ${isAi.source}`}
                              className="ml-auto text-accent-500 opacity-80"
                            >
                              <Icon name="Sparkles" size={11} strokeWidth={2} />
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="border-b border-ink-100 pr-3">
                    <div
                      className={cn(
                        'flex h-11 items-center justify-end transition-opacity',
                        isHover ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Row actions"
                      >
                        <Icon name="MoreHorizontal" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex h-10 items-center justify-between border-t border-ink-200 bg-white px-4 text-[11.5px] text-ink-500">
        <span>
          {sortedRecords.length.toLocaleString()} {schema.plural.toLowerCase()}
        </span>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">Page 1 of 1</span>
        </div>
      </div>
    </div>
  )
}
