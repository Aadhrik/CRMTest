import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { FieldValueCell } from '@/components/FieldValue'
import { useCrmStore } from '@/store/useCrmStore'
import { cn } from '@/lib/utils'
import type { FieldUpdateProposal, SmartVariable } from '@/lib/types'

interface Props {
  proposal: FieldUpdateProposal
  variable: SmartVariable
}

export function FieldUpdateChip({ proposal, variable }: Props) {
  const accept = useCrmStore((s) => s.acceptProposal)
  const reject = useCrmStore((s) => s.rejectProposal)
  const [expanded, setExpanded] = useState(false)

  const confidence = proposal.confidence ?? 0

  return (
    <div
      className={cn(
        'mt-1 rounded-md border border-accent-200 bg-accent-50/60 text-[11.5px] transition-all',
        expanded ? 'p-2.5' : 'px-2 py-1',
      )}
    >
      {expanded ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Icon name="Sparkles" size={11} className="text-accent-600" />
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-accent-700">
              AI suggests
            </span>
            {proposal.confidence != null && (
              <span className="ml-auto text-[10.5px] font-medium tabular-nums text-ink-600">
                {Math.round(confidence * 100)}% confident
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-ink-500">
              Now
            </span>
            <FieldValueCell
              variable={variable}
              value={proposal.currentValue as never}
              muted
            />
            <Icon name="ArrowRight" size={11} className="text-ink-400" />
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-accent-700">
              Proposed
            </span>
            <FieldValueCell
              variable={variable}
              value={proposal.proposedValue as never}
            />
          </div>
          {proposal.sourceQuote && (
            <p className="border-l-2 border-accent-300 pl-2 text-[11px] italic leading-relaxed text-ink-700">
              "{proposal.sourceQuote}"
            </p>
          )}
          <p className="text-[11px] text-ink-600">{proposal.reason}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setExpanded(false)}
              className="mr-auto flex h-6 items-center rounded-md px-2 text-[11px] font-medium text-ink-600 hover:bg-white hover:text-ink-900"
            >
              Hide
            </button>
            <button
              onClick={() => reject(proposal.id)}
              className="flex h-6 items-center rounded-md px-2 text-[11px] font-medium text-ink-600 hover:bg-white hover:text-ink-900"
            >
              Dismiss
            </button>
            <button
              onClick={() => accept(proposal.id)}
              className="flex h-6 items-center gap-1 rounded-md bg-accent-500 px-2 text-[11px] font-medium text-white shadow-elev-1 hover:bg-accent-600"
            >
              <Icon name="Check" size={10} strokeWidth={2.5} />
              Accept
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Icon
            name="Sparkles"
            size={10}
            className="shrink-0 text-accent-600"
          />
          <span className="text-ink-600">AI suggests</span>
          <FieldValueCell
            variable={variable}
            value={proposal.proposedValue as never}
          />
          <button
            onClick={() => setExpanded(true)}
            className="text-[10.5px] font-medium text-ink-500 hover:text-ink-900"
          >
            Why?
          </button>
          <button
            onClick={() => reject(proposal.id)}
            className="ml-auto flex h-5 items-center rounded px-1.5 text-[10.5px] font-medium text-ink-500 hover:bg-white hover:text-ink-900"
          >
            Dismiss
          </button>
          <button
            onClick={() => accept(proposal.id)}
            className="flex h-5 items-center gap-0.5 rounded bg-accent-500 px-1.5 text-[10.5px] font-medium text-white hover:bg-accent-600"
          >
            <Icon name="Check" size={9} strokeWidth={2.5} />
            Accept
          </button>
        </div>
      )}
    </div>
  )
}
