import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useCrmStore } from '@/store/useCrmStore'
import { cn } from '@/lib/utils'
import type { NewVariableProposal, ObjectSchema, SmartVariableType } from '@/lib/types'

interface Props {
  proposals: NewVariableProposal[]
  schema: ObjectSchema
}

const TYPE_META: globalThis.Record<
  SmartVariableType,
  { label: string; icon: string }
> = {
  text: { label: 'Text', icon: 'Type' },
  number: { label: 'Number', icon: 'Hash' },
  pick_list: { label: 'Pick list', icon: 'List' },
  yes_no: { label: 'Yes / No', icon: 'ToggleRight' },
  date: { label: 'Date', icon: 'Calendar' },
}

export function NewVariableBanner({ proposals, schema }: Props) {
  const accept = useCrmStore((s) => s.acceptProposal)
  const reject = useCrmStore((s) => s.rejectProposal)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  if (proposals.length === 0 || collapsed) return null

  return (
    <div className="border-b border-accent-200 bg-gradient-to-r from-accent-50/70 via-white to-white">
      <div className="flex items-center gap-2 px-6 py-2">
        <Icon name="Sparkles" size={12} className="text-accent-600" />
        <span className="text-[11.5px] font-medium text-ink-700">
          AI wants to track{' '}
          <span className="font-semibold text-accent-700">
            {proposals.length} new {proposals.length === 1 ? 'property' : 'properties'}
          </span>{' '}
          on {schema.plural}
        </span>
        <span className="text-[11px] text-ink-500">
          · based on patterns in recent conversations
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          title="Hide"
        >
          <Icon name="X" size={11} />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-6 pb-3">
        {proposals.map((p) => {
          const meta = TYPE_META[p.suggestedType]
          const isExpanded = expanded === p.id
          return (
            <div
              key={p.id}
              className={cn(
                'flex shrink-0 flex-col rounded-lg border bg-white p-3 transition-all',
                isExpanded
                  ? 'w-[420px] border-accent-300 shadow-elev-2'
                  : 'w-[280px] border-ink-200 hover:border-ink-300',
              )}
            >
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-200">
                  <Icon name={meta.icon} size={11} />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-semibold text-ink-900">
                      {p.suggestedName}
                    </span>
                    <span className="rounded bg-ink-100 px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider text-ink-500">
                      {meta.label}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-[11.5px] leading-relaxed text-ink-600',
                      !isExpanded && 'line-clamp-2',
                    )}
                  >
                    {p.suggestedDescription}
                  </p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
                    {p.evidenceCount} evidence · example quotes
                  </div>
                  <ul className="space-y-1 rounded-md bg-ink-50/60 p-2">
                    {p.exampleQuotes.map((q, i) => (
                      <li
                        key={i}
                        className="border-l-2 border-ink-300 pl-2 text-[11.5px] italic leading-relaxed text-ink-700"
                      >
                        "{q}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 flex items-center gap-1">
                {!isExpanded && (
                  <span className="mr-auto inline-flex items-center gap-1 text-[10.5px] font-medium text-ink-500">
                    <Icon name="BadgeCheck" size={10} />
                    {p.evidenceCount} evidence
                  </span>
                )}
                <button
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                  className="text-[10.5px] font-medium text-ink-500 hover:text-ink-900"
                >
                  {isExpanded ? 'Hide quotes' : 'Why?'}
                </button>
                <button
                  onClick={() => reject(p.id)}
                  className="ml-auto flex h-6 items-center rounded-md px-2 text-[11px] font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => accept(p.id)}
                  className="flex h-6 items-center gap-1 rounded-md bg-accent-500 px-2 text-[11px] font-medium text-white shadow-elev-1 hover:bg-accent-600"
                >
                  <Icon name="Plus" size={10} strokeWidth={2.5} />
                  Add
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
