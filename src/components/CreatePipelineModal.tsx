import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useCrmStore } from '@/store/useCrmStore'
import { cn } from '@/lib/utils'
import type { ObjectSchema, PickListOption, SmartVariable } from '@/lib/types'

const COLOR_CYCLE = ['indigo', 'violet', 'sky', 'emerald', 'amber', 'rose', 'pink', 'teal', 'slate', 'zinc']

const DOT_BG: globalThis.Record<string, string> = {
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

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

function uniqueKey(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}_${i}`)) i++
  return `${base}_${i}`
}

interface DraftColumn {
  id: string
  label: string
}

interface Props {
  open: boolean
  onClose: () => void
  schema: ObjectSchema
  /** Called after the variable + view are created. variableKey is the new pick-list key. */
  onCreate: (variableKey: string, viewId: string) => void
}

export function CreatePipelineModal({ open, onClose, schema, onCreate }: Props) {
  const addVar = useCrmStore((s) => s.addSmartVariable)
  const createView = useCrmStore((s) => s.createSavedView)

  const [name, setName] = useState('')
  const [columns, setColumns] = useState<DraftColumn[]>([])
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setColumns([
      { id: 'c1', label: 'New' },
      { id: 'c2', label: 'In Progress' },
      { id: 'c3', label: 'Done' },
    ])
    setTimeout(() => nameRef.current?.focus(), 50)
  }, [open])

  function addColumn() {
    setColumns((prev) => [
      ...prev,
      { id: `c${Date.now().toString(36)}`, label: '' },
    ])
  }

  function updateColumn(id: string, label: string) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)))
  }

  function removeColumn(id: string) {
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  function moveColumn(id: string, dir: -1 | 1) {
    setColumns((prev) => {
      const i = prev.findIndex((c) => c.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const cleanedColumns = columns.map((c) => c.label.trim()).filter(Boolean)
  const canSave = name.trim().length > 0 && cleanedColumns.length >= 2

  function handleCreate() {
    if (!canSave) return
    const trimmedName = name.trim()
    const existingKeys = new Set(schema.variables.map((v) => v.key))
    const baseKey = slugify(trimmedName) || `pipeline_${Date.now().toString(36)}`
    const variableKey = uniqueKey(baseKey, existingKeys)

    const options: PickListOption[] = cleanedColumns.map((label, idx) => ({
      id: `${variableKey}_${slugify(label) || idx}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      color: COLOR_CYCLE[idx % COLOR_CYCLE.length],
      order: idx,
    }))

    const variable: SmartVariable = {
      id: `var_${Date.now().toString(36)}`,
      key: variableKey,
      name: trimmedName,
      type: 'pick_list',
      description: `${trimmedName} pipeline stages.`,
      aiManaged: false,
      locked: false,
      options,
    }
    addVar(schema.key, variable)

    const viewId = `view_${Date.now()}`
    createView({
      id: viewId,
      objectKey: schema.key,
      name: trimmedName,
      layout: 'board',
      groupBy: variableKey,
      icon: 'LayoutGrid',
      color: schema.color,
      pinned: true,
      createdAt: new Date().toISOString(),
    })

    onCreate(variableKey, viewId)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-50 text-accent-600">
          <Icon name="LayoutGrid" size={14} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-ink-900">
            Create new pipeline
          </div>
          <div className="text-[11.5px] text-ink-500">
            Adds a pick-list property to {schema.plural.toLowerCase()} and a pinned view.
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <Icon name="X" size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-500">
            Pipeline name
          </label>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales stage, Onboarding"
            className="h-8 text-[13px]"
          />
        </div>

        {/* Columns */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
              Columns
            </label>
            <span className="text-[10.5px] text-ink-400">at least 2</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {columns.map((c, idx) => {
              const dot = DOT_BG[COLOR_CYCLE[idx % COLOR_CYCLE.length]]
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />
                  <Input
                    value={c.label}
                    onChange={(e) => updateColumn(c.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (idx === columns.length - 1) addColumn()
                      }
                    }}
                    placeholder={`Column ${idx + 1}`}
                    className="h-8 flex-1 text-[13px]"
                  />
                  <button
                    onClick={() => moveColumn(c.id, -1)}
                    disabled={idx === 0}
                    title="Move up"
                    className="flex h-7 w-6 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Icon name="ChevronUp" size={12} />
                  </button>
                  <button
                    onClick={() => moveColumn(c.id, 1)}
                    disabled={idx === columns.length - 1}
                    title="Move down"
                    className="flex h-7 w-6 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Icon name="ChevronDown" size={12} />
                  </button>
                  <button
                    onClick={() => removeColumn(c.id)}
                    disabled={columns.length <= 1}
                    title="Remove"
                    className="flex h-7 w-6 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              )
            })}
          </div>
          <button
            onClick={addColumn}
            className="mt-2 flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
          >
            <Icon name="Plus" size={12} strokeWidth={2.5} />
            Add column
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-ink-200 bg-ink-50/40 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!canSave}
          onClick={handleCreate}
        >
          <Icon name="Check" size={13} strokeWidth={2.5} />
          Create pipeline
        </Button>
      </div>
    </Dialog>
  )
}
