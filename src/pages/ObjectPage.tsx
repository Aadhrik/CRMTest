import { useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ObjectTable } from '@/components/ObjectTable'
import { Kanban } from '@/components/Kanban'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useCrmStore } from '@/store/useCrmStore'
import { SchemaEditorPanel } from '@/components/SchemaEditorPanel'
import { NewVariableBanner } from '@/components/NewVariableBanner'
import { cn } from '@/lib/utils'
import type {
  FilterCondition,
  ObjectSchema,
  Record_,
  SmartVariableType,
  ViewLayout,
} from '@/lib/types'

// ─── Filter helpers ───────────────────────────────────────────────────────────

type FilterOp = FilterCondition['op']

type ActiveFilter = {
  id: string
  fieldKey: string
  op: FilterOp
  value: string // always stored as string; parsed on eval
}

const OPS_BY_TYPE: Record<SmartVariableType, { op: FilterOp; label: string }[]> = {
  text: [
    { op: 'contains', label: 'contains' },
    { op: 'eq', label: 'is' },
    { op: 'neq', label: 'is not' },
    { op: 'is_empty', label: 'is empty' },
    { op: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { op: 'eq', label: '=' },
    { op: 'neq', label: '≠' },
    { op: 'gt', label: '>' },
    { op: 'lt', label: '<' },
    { op: 'is_empty', label: 'is empty' },
    { op: 'is_not_empty', label: 'is not empty' },
  ],
  pick_list: [
    { op: 'eq', label: 'is' },
    { op: 'neq', label: 'is not' },
    { op: 'is_empty', label: 'is empty' },
    { op: 'is_not_empty', label: 'is not empty' },
  ],
  yes_no: [
    { op: 'eq', label: 'is' },
    { op: 'is_empty', label: 'is empty' },
    { op: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { op: 'lt', label: 'before' },
    { op: 'gt', label: 'after' },
    { op: 'is_empty', label: 'is empty' },
    { op: 'is_not_empty', label: 'is not empty' },
  ],
}

function defaultOp(type: SmartVariableType): FilterOp {
  return OPS_BY_TYPE[type][0].op
}

const NO_VALUE_OPS: FilterOp[] = ['is_empty', 'is_not_empty']

function evalFilter(
  f: ActiveFilter,
  record: Record_,
  schema: ObjectSchema,
): boolean {
  const variable = schema.variables.find((v) => v.key === f.fieldKey)
  if (!variable) return true
  const raw = record.fields[f.fieldKey]

  if (f.op === 'is_empty') return raw == null || raw === ''
  if (f.op === 'is_not_empty') return raw != null && raw !== ''
  if (raw == null || raw === '') return false

  if (variable.type === 'pick_list') {
    const optionId =
      typeof raw === 'object' && 'optionId' in raw ? raw.optionId : null
    if (!optionId) return false
    if (f.op === 'eq') return optionId === f.value
    if (f.op === 'neq') return optionId !== f.value
    return true
  }

  if (variable.type === 'yes_no') {
    const boolVal = Boolean(raw)
    if (f.op === 'eq') return boolVal === (f.value === 'true')
    return true
  }

  if (variable.type === 'number') {
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw))
    if (isNaN(num)) return false
    if (f.op === 'eq') return num === parseFloat(f.value)
    if (f.op === 'neq') return num !== parseFloat(f.value)
    if (f.op === 'gt') return num > parseFloat(f.value)
    if (f.op === 'lt') return num < parseFloat(f.value)
    return true
  }

  const str = String(raw).toLowerCase()
  const fVal = f.value.toLowerCase()
  if (f.op === 'contains') return str.includes(fVal)
  if (f.op === 'eq') return str === fVal
  if (f.op === 'neq') return str !== fVal
  return true
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ObjectPage() {
  const { objectKey } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeViewId = searchParams.get('view') ?? undefined

  const schemas = useCrmStore((s) => s.schemas)
  const allRecords = useCrmStore((s) => s.records)
  const savedViews = useCrmStore((s) => s.savedViews)
  const proposals = useCrmStore((s) => s.proposals)
  const createView = useCrmStore((s) => s.createSavedView)
  const updateView = useCrmStore((s) => s.updateSavedView)

  const schema = useMemo(
    () => schemas.find((s) => s.key === objectKey),
    [schemas, objectKey],
  )
  const records = useMemo(
    () => allRecords.filter((r) => r.objectKey === objectKey),
    [allRecords, objectKey],
  )
  const activeView = useMemo(
    () => savedViews.find((v) => v.id === activeViewId),
    [savedViews, activeViewId],
  )
  const objectViews = useMemo(
    () => savedViews.filter((v) => v.objectKey === objectKey),
    [savedViews, objectKey],
  )
  const pickListVars = useMemo(
    () => (schema?.variables ?? []).filter((v) => v.type === 'pick_list'),
    [schema],
  )
  const newVarProposals = useMemo(
    () =>
      proposals.filter(
        (p) =>
          p.kind === 'new_variable' &&
          p.objectKey === objectKey &&
          p.status === 'pending',
      ),
    [proposals, objectKey],
  )

  // When no view is active, layout/groupBy live in local state.
  // When a view IS active, we read directly from the store so the source of
  // truth is always the persisted view — no drift possible.
  const [localLayout, setLocalLayout] = useState<ViewLayout>('table')
  const [localGroupByKey, setLocalGroupByKey] = useState<string | undefined>(
    pickListVars[0]?.key,
  )

  const layout: ViewLayout = activeView?.layout ?? localLayout
  const groupByKey: string | undefined =
    activeView?.groupBy ?? localGroupByKey ?? pickListVars[0]?.key

  const [search, setSearch] = useState('')
  const [schemaEditorOpen, setSchemaEditorOpen] = useState(false)

  // Filter state
  const [filterBarOpen, setFilterBarOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  // New-view creation state
  const [creatingView, setCreatingView] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const newViewInputRef = useRef<HTMLInputElement>(null)

  // Sync filters when switching views
  useEffect(() => {
    if (activeView) {
      setActiveFilters(
        (activeView.filters ?? []).map((f) => ({
          ...f,
          id: Math.random().toString(36).slice(2),
          value: f.value == null ? '' : String(f.value),
        })),
      )
    } else {
      setActiveFilters([])
    }
    setFilterBarOpen(false)
  }, [activeViewId]) // eslint-disable-line

  useEffect(() => {
    if (creatingView) {
      setTimeout(() => newViewInputRef.current?.focus(), 0)
    }
  }, [creatingView])

  // Filter + search
  const filtered = useMemo(() => {
    let result = records
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        Object.values(r.fields).some((v) => {
          if (v == null) return false
          if (typeof v === 'object' && 'optionId' in v) return false
          return String(v).toLowerCase().includes(q)
        }),
      )
    }
    for (const f of activeFilters) {
      if (NO_VALUE_OPS.includes(f.op) || f.value !== '' || NO_VALUE_OPS.includes(f.op)) {
        result = result.filter((r) => evalFilter(f, r, schema!))
      }
    }
    return result
  }, [records, search, activeFilters, schema])

  if (!schema) return <Navigate to="/" replace />

  const groupByVar = groupByKey
    ? schema.variables.find((v) => v.key === groupByKey)
    : undefined

  function addFilter() {
    const firstVar = schema!.variables[0]
    if (!firstVar) return
    setActiveFilters((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        fieldKey: firstVar.key,
        op: defaultOp(firstVar.type),
        value: '',
      },
    ])
    setFilterBarOpen(true)
  }

  function removeFilter(id: string) {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id))
  }

  function updateFilter(id: string, patch: Partial<ActiveFilter>) {
    setActiveFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    )
  }

  function commitNewView() {
    const name = newViewName.trim()
    if (!name) { setCreatingView(false); return }
    const id = `view_${Date.now()}`
    const filtersToSave = activeFilters
      .filter((f) => NO_VALUE_OPS.includes(f.op) || f.value !== '')
      .map(({ id: _id, ...f }) => ({ ...f, value: f.value || undefined }))
    createView({
      id,
      objectKey: objectKey!,
      name,
      layout,
      groupBy: layout === 'board' ? groupByKey : undefined,
      filters: filtersToSave.length > 0 ? filtersToSave : undefined,
      icon: layout === 'board' ? 'LayoutGrid' : 'Rows3',
      color: schema!.color,
      pinned: true,
      createdAt: new Date().toISOString(),
    })
    setNewViewName('')
    setCreatingView(false)
    setFilterBarOpen(false)
    searchParams.set('view', id)
    setSearchParams(searchParams, { replace: true })
  }

  const filterCount = activeFilters.filter(
    (f) => NO_VALUE_OPS.includes(f.op) || f.value !== '',
  ).length

  return (
    <>
      {newVarProposals.length > 0 && (
        <NewVariableBanner proposals={newVarProposals} schema={schema} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 bg-white px-6 py-2.5">
        {/* View tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50/60 p-0.5">
          <ViewTab
            label="All"
            active={!activeViewId}
            onClick={() => {
              searchParams.delete('view')
              setSearchParams(searchParams, { replace: true })
            }}
          />
          {objectViews.map((v) => (
            <ViewTab
              key={v.id}
              label={v.name}
              icon={v.icon}
              active={activeViewId === v.id}
              onClick={() => {
                searchParams.set('view', v.id)
                setSearchParams(searchParams, { replace: true })
              }}
            />
          ))}
          {creatingView ? (
            <input
              ref={newViewInputRef}
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onBlur={() => {
                if (!newViewName.trim()) setCreatingView(false)
                else commitNewView()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitNewView() }
                if (e.key === 'Escape') { setCreatingView(false); setNewViewName('') }
              }}
              placeholder="View name…"
              className="mx-0.5 h-7 w-[130px] rounded-md border border-accent-400 bg-white px-2 text-[12.5px] font-medium text-ink-900 outline-none ring-2 ring-accent-500/20 placeholder:text-ink-400"
            />
          ) : (
            <button
              onClick={() => setCreatingView(true)}
              title="Create new view"
              className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-md text-ink-500 hover:bg-white hover:text-ink-900"
            >
              <Icon name="Plus" size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Layout toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-ink-200 bg-ink-50/60 p-0.5">
          <LayoutToggle
            label="Table"
            icon="Rows3"
            active={layout === 'table'}
            onClick={() => {
              if (activeViewId) updateView(activeViewId, { layout: 'table', groupBy: undefined })
              else setLocalLayout('table')
            }}
          />
          <LayoutToggle
            label="Board"
            icon="LayoutGrid"
            active={layout === 'board'}
            disabled={pickListVars.length === 0}
            onClick={() => {
              if (activeViewId) updateView(activeViewId, { layout: 'board', groupBy: groupByKey ?? pickListVars[0]?.key })
              else setLocalLayout('board')
            }}
          />
        </div>

        {/* GroupBy picker — only when Board */}
        {layout === 'board' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-ink-500">Group by</span>
            <select
              value={groupByKey ?? ''}
              onChange={(e) => {
                if (activeViewId) updateView(activeViewId, { groupBy: e.target.value })
                else setLocalGroupByKey(e.target.value)
              }}
              className="h-7 rounded-md border border-ink-200 bg-white px-2 text-[12.5px] font-medium text-ink-800 hover:border-ink-300 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            >
              {pickListVars.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Icon
              name="Search"
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[220px] pl-7 text-[13px]"
            />
          </div>
          <div className="h-5 w-px bg-ink-200" />
          <button
            onClick={() => {
              if (!filterBarOpen && activeFilters.length === 0) addFilter()
              else setFilterBarOpen((v) => !v)
            }}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors',
              filterCount > 0
                ? 'bg-accent-50 text-accent-700 ring-1 ring-accent-300'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
            )}
          >
            <Icon name="Filter" size={13} />
            Filter
            {filterCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
          <Button variant="ghost" size="sm">
            <Icon name="ArrowUpDown" size={13} />
            Sort
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSchemaEditorOpen(true)}
            title="Edit properties for this object"
          >
            <Icon name="Sparkles" size={13} />
            Properties
          </Button>
          <div className="h-5 w-px bg-ink-200" />
          <Button variant="primary" size="sm">
            <Icon name="Plus" size={13} strokeWidth={2.5} />
            New {schema.name.toLowerCase()}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {filterBarOpen && (
        <div className="flex flex-col gap-1.5 border-b border-ink-200 bg-ink-50/40 px-6 py-2.5">
          {activeFilters.length === 0 && (
            <span className="text-[12px] text-ink-500">No filters. Add one below.</span>
          )}
          {activeFilters.map((f) => {
            const variable = schema.variables.find((v) => v.key === f.fieldKey)
            const ops = variable ? OPS_BY_TYPE[variable.type] : []
            const needsValue = !NO_VALUE_OPS.includes(f.op)
            return (
              <div key={f.id} className="flex items-center gap-2">
                {/* Field */}
                <select
                  value={f.fieldKey}
                  onChange={(e) => {
                    const v = schema.variables.find((x) => x.key === e.target.value)!
                    updateFilter(f.id, {
                      fieldKey: e.target.value,
                      op: defaultOp(v.type),
                      value: '',
                    })
                  }}
                  className="h-7 rounded-md border border-ink-200 bg-white px-2 text-[12.5px] font-medium text-ink-800 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                >
                  {schema.variables.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.name}
                    </option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={f.op}
                  onChange={(e) =>
                    updateFilter(f.id, { op: e.target.value as FilterOp, value: '' })
                  }
                  className="h-7 rounded-md border border-ink-200 bg-white px-2 text-[12.5px] font-medium text-ink-800 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                >
                  {ops.map(({ op, label }) => (
                    <option key={op} value={op}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Value */}
                {needsValue && variable && (
                  <FilterValueInput
                    variable={variable}
                    value={f.value}
                    onChange={(v) => updateFilter(f.id, { value: v })}
                  />
                )}

                {/* Remove */}
                <button
                  onClick={() => removeFilter(f.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-ink-200 hover:text-ink-700"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            )
          })}

          <div className="mt-0.5 flex items-center gap-2">
            <button
              onClick={addFilter}
              className="flex h-7 w-fit items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-ink-600 hover:bg-ink-200 hover:text-ink-900"
            >
              <Icon name="Plus" size={12} strokeWidth={2.5} />
              Add filter
            </button>
            {filterCount > 0 && !creatingView && (
              <button
                onClick={() => setCreatingView(true)}
                className="flex h-7 items-center gap-1.5 rounded-md bg-accent-500 px-2.5 text-[12px] font-medium text-white shadow-elev-1 hover:bg-accent-600"
              >
                <Icon name="Bookmark" size={12} strokeWidth={2.5} />
                Save as view
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body — Table or Board */}
      {layout === 'table' ? (
        <ObjectTable schema={schema} records={filtered} />
      ) : groupByVar && groupByVar.type === 'pick_list' ? (
        <Kanban schema={schema} groupBy={groupByVar} records={filtered} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
              <Icon name="LayoutGrid" size={16} />
            </div>
            <div className="text-[13px] font-semibold text-ink-900">
              Add a pick-list property to use Board view
            </div>
            <p className="mt-1 text-[12px] text-ink-500">
              Board view groups records by a pick-list property. This object
              doesn't have one yet.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setSchemaEditorOpen(true)}
            >
              <Icon name="Plus" size={13} strokeWidth={2.5} />
              Add property
            </Button>
          </div>
        </div>
      )}

      <SchemaEditorPanel
        open={schemaEditorOpen}
        onClose={() => setSchemaEditorOpen(false)}
        schema={schema}
      />
    </>
  )
}

// ─── Filter value input ───────────────────────────────────────────────────────

function FilterValueInput({
  variable,
  value,
  onChange,
}: {
  variable: { type: SmartVariableType; options?: { id: string; label: string }[] }
  value: string
  onChange: (v: string) => void
}) {
  const base =
    'h-7 rounded-md border border-ink-200 bg-white px-2 text-[12.5px] font-medium text-ink-800 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20'

  if (variable.type === 'pick_list') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">Pick one…</option>
        {(variable.options ?? []).map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }

  if (variable.type === 'yes_no') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">Pick one…</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  if (variable.type === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Number…"
        className={cn(base, 'w-[120px]')}
      />
    )
  }

  if (variable.type === 'date') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(base, 'w-[150px]')}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value…"
      className={cn(base, 'w-[180px]')}
    />
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ViewTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors',
        active
          ? 'bg-white text-ink-900 shadow-elev-1 ring-1 ring-ink-200/60'
          : 'text-ink-600 hover:bg-white/60 hover:text-ink-900',
      )}
    >
      {icon && <Icon name={icon} size={12} className="text-ink-500" />}
      {label}
    </button>
  )
}

function LayoutToggle({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string
  icon: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Needs a pick-list property' : label}
      className={cn(
        'flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium transition-colors',
        active
          ? 'bg-white text-ink-900 shadow-elev-1 ring-1 ring-ink-200/60'
          : 'text-ink-500 hover:bg-white/60 hover:text-ink-900',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      <Icon name={icon} size={12} />
      {label}
    </button>
  )
}
