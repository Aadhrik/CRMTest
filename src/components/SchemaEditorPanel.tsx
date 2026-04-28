import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCrmStore } from '@/store/useCrmStore'
import { cn } from '@/lib/utils'
import type {
  ObjectSchema,
  PickListOption,
  SmartVariable,
  SmartVariableType,
} from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  schema: ObjectSchema
}

const TYPE_META: globalThis.Record<
  SmartVariableType,
  { label: string; icon: string; hint: string }
> = {
  text: { label: 'Text', icon: 'Type', hint: 'Freeform text' },
  number: { label: 'Number', icon: 'Hash', hint: 'Numeric value' },
  pick_list: {
    label: 'Pick list',
    icon: 'List',
    hint: 'One of a set of options — required for board views',
  },
  yes_no: { label: 'Yes / No', icon: 'ToggleRight', hint: 'Boolean' },
  date: { label: 'Date', icon: 'Calendar', hint: 'ISO date' },
}

const OPTION_COLORS = [
  'slate',
  'zinc',
  'indigo',
  'violet',
  'sky',
  'emerald',
  'amber',
  'rose',
  'pink',
  'teal',
]

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

export function SchemaEditorPanel({ open, onClose, schema }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="absolute right-0 top-0 flex h-full w-[520px] flex-col bg-white shadow-elev-3 ring-1 ring-ink-200 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-4">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-50 ring-1 ring-inset ring-ink-200"
            style={{ color: schema.color }}
          >
            <Icon name={schema.icon} size={15} />
          </div>
          <div className="flex flex-col leading-tight">
            <h2 className="text-[14px] font-semibold text-ink-900">
              Properties
            </h2>
            <p className="text-[11.5px] text-ink-500">
              {schema.plural} · {schema.variables.length} {schema.variables.length === 1 ? 'property' : 'properties'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Intro strip */}
        <div className="flex items-start gap-2 border-b border-ink-200 bg-accent-50/40 px-5 py-2.5">
          <Icon
            name="Sparkles"
            size={12}
            className="mt-0.5 shrink-0 text-accent-600"
          />
          <p className="text-[11.5px] leading-relaxed text-ink-600">
            Each property's description is what the AI reads when inferring
            values from calls, texts, and emails. Write it like a prompt.
          </p>
        </div>

        {/* List */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <ul className="divide-y divide-ink-100">
            {schema.variables.map((v) => (
              <VariableRow
                key={v.key}
                variable={v}
                objectKey={schema.key}
                expanded={expandedKey === v.key}
                onToggle={() =>
                  setExpandedKey(expandedKey === v.key ? null : v.key)
                }
              />
            ))}
          </ul>

          {addingNew ? (
            <NewVariableEditor
              objectKey={schema.key}
              onDone={() => setAddingNew(false)}
            />
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className="m-4 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-300 bg-transparent text-[12.5px] font-medium text-ink-600 hover:border-accent-400 hover:bg-accent-50/40 hover:text-accent-700"
            >
              <Icon name="Plus" size={13} strokeWidth={2.5} />
              Add property
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

function VariableRow({
  variable: v,
  objectKey,
  expanded,
  onToggle,
}: {
  variable: SmartVariable
  objectKey: string
  expanded: boolean
  onToggle: () => void
}) {
  const updateVar = useCrmStore((s) => s.updateSmartVariable)
  const deleteVar = useCrmStore((s) => s.deleteSmartVariable)
  const addOpt = useCrmStore((s) => s.addPickListOption)
  const updateOpt = useCrmStore((s) => s.updatePickListOption)
  const deleteOpt = useCrmStore((s) => s.deletePickListOption)

  const typeMeta = TYPE_META[v.type]

  return (
    <li>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-ink-50/50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-200">
          <Icon name={v.icon ?? typeMeta.icon} size={13} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-900">
            {v.name}
            {v.pinned && (
              <Icon name="Pin" size={10} className="text-ink-400" />
            )}
            {v.aiManaged && (
              <Icon name="Sparkles" size={10} className="text-accent-500" />
            )}
          </span>
          <span className="truncate text-[11px] text-ink-500">
            <span className="text-ink-400">{typeMeta.label}</span>
            {v.description && <span> · {v.description}</span>}
          </span>
        </div>
        <Icon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={13}
          className="text-ink-400"
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-ink-100 bg-ink-50/40 px-5 py-4">
          {/* Name */}
          <Field label="Name">
            <Input
              value={v.name}
              onChange={(e) =>
                updateVar(objectKey, v.key, { name: e.target.value })
              }
            />
          </Field>

          {/* Type (read-only; changing types mid-flight is out of scope) */}
          <Field label="Type" hint={typeMeta.hint}>
            <div className="flex h-8 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 text-[12.5px] text-ink-800">
              <Icon name={typeMeta.icon} size={12} className="text-ink-500" />
              {typeMeta.label}
            </div>
          </Field>

          {/* Description (= the AI prompt) */}
          <Field
            label="Description"
            hint="This doubles as the AI prompt. Describe how the AI should infer this value."
            badge="AI prompt"
          >
            <textarea
              value={v.description}
              onChange={(e) =>
                updateVar(objectKey, v.key, { description: e.target.value })
              }
              rows={3}
              placeholder="e.g. The industry the customer operates in — infer from company name and conversation."
              className="w-full resize-none rounded-md border border-ink-200 bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </Field>

          {/* Pick-list options */}
          {v.type === 'pick_list' && (
            <Field
              label="Options"
              hint="Drag order matters in board view — leftmost columns first."
            >
              <ul className="flex flex-col gap-1.5">
                {(v.options ?? [])
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((o) => (
                    <OptionRow
                      key={o.id}
                      option={o}
                      onUpdate={(patch) =>
                        updateOpt(objectKey, v.key, o.id, patch)
                      }
                      onDelete={() => deleteOpt(objectKey, v.key, o.id)}
                    />
                  ))}
                <button
                  onClick={() => {
                    const nextOrder = (v.options ?? []).length
                    const newOpt: PickListOption = {
                      id: `opt_${Date.now().toString(36)}`,
                      label: `Option ${nextOrder + 1}`,
                      color: OPTION_COLORS[nextOrder % OPTION_COLORS.length],
                      order: nextOrder,
                    }
                    addOpt(objectKey, v.key, newOpt)
                  }}
                  className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-dashed border-ink-300 text-[12px] font-medium text-ink-600 hover:border-ink-400 hover:bg-white hover:text-ink-900"
                >
                  <Icon name="Plus" size={11} strokeWidth={2.5} />
                  Add option
                </button>
              </ul>
            </Field>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap gap-2">
            <Toggle
              label="AI managed"
              icon="Sparkles"
              value={v.aiManaged}
              onChange={(val) =>
                updateVar(objectKey, v.key, { aiManaged: val })
              }
            />
            <Toggle
              label="Pinned"
              icon="Pin"
              value={!!v.pinned}
              onChange={(val) => updateVar(objectKey, v.key, { pinned: val })}
            />
            <Toggle
              label="Required"
              icon="Asterisk"
              value={!!v.required}
              onChange={(val) =>
                updateVar(objectKey, v.key, { required: val })
              }
            />
            <Toggle
              label="Locked"
              icon="Lock"
              value={v.locked}
              onChange={(val) => updateVar(objectKey, v.key, { locked: val })}
            />
          </div>

          {/* Delete */}
          <div className="flex justify-end border-t border-ink-200 pt-3">
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete "${v.name}"? This will also remove its values from every record on this object.`,
                  )
                ) {
                  deleteVar(objectKey, v.key)
                }
              }}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-600 hover:text-rose-700"
            >
              <Icon name="Trash2" size={11} />
              Delete property
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

function OptionRow({
  option,
  onUpdate,
  onDelete,
}: {
  option: PickListOption
  onUpdate: (patch: Partial<PickListOption>) => void
  onDelete: () => void
}) {
  return (
    <li className="group flex items-center gap-2 rounded-md bg-white px-2 py-1 ring-1 ring-inset ring-ink-200">
      <details className="relative">
        <summary
          className={cn(
            'flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full',
            DOT_BG[option.color] ?? DOT_BG.zinc,
          )}
        />
        <div className="absolute left-0 top-6 z-10 flex flex-wrap gap-1 rounded-md bg-white p-1.5 shadow-elev-2 ring-1 ring-ink-200">
          {OPTION_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              className={cn(
                'h-4 w-4 rounded-full ring-1 ring-inset ring-ink-200 hover:scale-110',
                DOT_BG[c],
              )}
              title={c}
            />
          ))}
        </div>
      </details>
      <Input
        value={option.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="h-7 flex-1 text-[12.5px]"
      />
      <button
        onClick={onDelete}
        className="flex h-6 w-6 items-center justify-center rounded text-ink-400 opacity-0 hover:bg-ink-100 hover:text-rose-600 group-hover:opacity-100"
        title="Delete option"
      >
        <Icon name="X" size={11} />
      </button>
    </li>
  )
}

function Toggle({
  label,
  icon,
  value,
  onChange,
}: {
  label: string
  icon: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors',
        value
          ? 'border-accent-300 bg-accent-50 text-accent-700'
          : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
      )}
    >
      <Icon name={icon} size={11} />
      {label}
    </button>
  )
}

function Field({
  label,
  hint,
  badge,
  children,
}: {
  label: string
  hint?: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label className="text-[11.5px] font-semibold text-ink-700">
          {label}
        </label>
        {badge && (
          <span className="rounded bg-accent-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-accent-700">
            {badge}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  )
}

function NewVariableEditor({
  objectKey,
  onDone,
}: {
  objectKey: string
  onDone: () => void
}) {
  const addVar = useCrmStore((s) => s.addSmartVariable)
  const [name, setName] = useState('')
  const [type, setType] = useState<SmartVariableType>('text')
  const [description, setDescription] = useState('')

  const canSave = name.trim().length > 0

  const save = () => {
    if (!canSave) return
    const key = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40)
    addVar(objectKey, {
      id: `var_${Date.now().toString(36)}`,
      key: key || `var_${Date.now().toString(36)}`,
      name: name.trim(),
      type,
      description: description.trim(),
      aiManaged: true,
      locked: false,
      ...(type === 'pick_list' ? { options: [] } : {}),
    })
    onDone()
  }

  return (
    <div className="m-4 space-y-3 rounded-lg border border-accent-300 bg-accent-50/40 p-4">
      <div className="flex items-center gap-2">
        <Icon name="Plus" size={13} className="text-accent-600" />
        <span className="text-[12.5px] font-semibold text-ink-900">
          New property
        </span>
      </div>
      <Field label="Name">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Industry, Timezone, Pet name"
        />
      </Field>
      <Field label="Type">
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(TYPE_META) as SmartVariableType[]).map((t) => {
            const meta = TYPE_META[t]
            const active = type === t
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md border p-2 text-[11px] font-medium transition-colors',
                  active
                    ? 'border-accent-400 bg-white text-ink-900 ring-2 ring-accent-500/20'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                <Icon name={meta.icon} size={13} />
                {meta.label}
              </button>
            )
          })}
        </div>
      </Field>
      <Field
        label="Description"
        hint="Describe how the AI should infer this value from conversations."
        badge="AI prompt"
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="e.g. The industry the customer operates in. Infer from company name and conversation context."
          className="w-full resize-none rounded-md border border-ink-200 bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={save} disabled={!canSave}>
          Create property
        </Button>
      </div>
    </div>
  )
}
