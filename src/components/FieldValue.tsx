import type { FieldValue, SmartVariable } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface Props {
  variable: SmartVariable
  value: FieldValue | undefined
  muted?: boolean
}

// Renders a field value according to its smart-variable type.
// Keep this pure — no layout, no padding. Containers handle spacing.
export function FieldValueCell({ variable, value, muted }: Props) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-ink-300">—</span>
  }

  switch (variable.type) {
    case 'pick_list': {
      const opt = variable.options?.find(
        (o) => typeof value === 'object' && value !== null && 'optionId' in value && o.id === value.optionId,
      )
      if (!opt) return <span className="text-ink-300">—</span>
      return (
        <Badge color={opt.color} dot>
          {opt.label}
        </Badge>
      )
    }
    case 'yes_no':
      return value ? (
        <span className="inline-flex items-center gap-1 text-[13px] text-emerald-700">
          <Icon name="Check" size={13} strokeWidth={2.5} />
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[13px] text-ink-500">
          <Icon name="X" size={13} strokeWidth={2.5} />
          No
        </span>
      )
    case 'number': {
      // Heuristic: currency fields end with _revenue, price, amount
      const k = variable.key
      const isCurrency =
        k.includes('revenue') || k.includes('price') || k.includes('amount')
      return (
        <span className={muted ? 'text-ink-500' : 'text-ink-900'}>
          {isCurrency ? formatCurrency(value as number) : formatNumber(value as number)}
        </span>
      )
    }
    case 'date': {
      const d = new Date(value as string)
      return (
        <span className={muted ? 'text-ink-500' : 'text-ink-900'}>
          {d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      )
    }
    case 'text':
    default:
      return (
        <span className={muted ? 'truncate text-ink-500' : 'truncate text-ink-900'}>
          {String(value)}
        </span>
      )
  }
}
