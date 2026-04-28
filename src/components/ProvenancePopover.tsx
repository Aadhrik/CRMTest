import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/Icon'
import { FieldValueCell } from '@/components/FieldValue'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { AIProvenance, SmartVariable } from '@/lib/types'

interface Props {
  variable: SmartVariable
  provenance: AIProvenance
}

export function ProvenancePopover({ variable, provenance }: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // Position popover below-and-right of the trigger, clamping to viewport
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const width = 320
    const margin = 8
    const left = Math.min(
      window.innerWidth - width - margin,
      Math.max(margin, rect.left),
    )
    const top = rect.bottom + 6
    setPos({ top, left })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        triggerRef.current?.contains(t) ||
        popoverRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const confidence = provenance.confidence ?? 0

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        title="AI-written · click for details"
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded text-accent-500 hover:bg-accent-50 hover:text-accent-700',
          open && 'bg-accent-50 text-accent-700',
        )}
      >
        <Icon name="Sparkles" size={11} strokeWidth={2} />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-50 w-[320px] rounded-lg border border-ink-200 bg-white p-3 shadow-elev-3 animate-pop-in"
          >
          <div className="flex items-center gap-1.5 pb-2">
            <Icon name="Sparkles" size={11} className="text-accent-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-700">
              AI-written
            </span>
            <span className="ml-auto text-[11px] text-ink-500">
              {formatRelativeTime(provenance.at)}
            </span>
          </div>

          <div className="space-y-2.5 border-t border-ink-100 pt-2.5">
            {/* Source */}
            <Row icon="Radio" label="Source">
              <span className="text-[12px] font-medium text-ink-900">
                {provenance.source}
              </span>
            </Row>

            {/* Confidence bar */}
            {provenance.confidence != null && (
              <Row icon="Gauge" label="Confidence">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        confidence > 0.8
                          ? 'bg-emerald-500'
                          : confidence > 0.6
                          ? 'bg-accent-500'
                          : 'bg-amber-500',
                      )}
                      style={{ width: `${Math.round(confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11.5px] font-medium tabular-nums text-ink-700">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              </Row>
            )}

            {/* Quote */}
            {provenance.quote && (
              <Row icon="Quote" label="Quote">
                <p className="border-l-2 border-accent-300 pl-2 text-[11.5px] italic leading-relaxed text-ink-700">
                  "{provenance.quote}"
                </p>
              </Row>
            )}

            {/* Previous value */}
            {provenance.previousValue != null && (
              <Row icon="History" label="Was">
                <FieldValueCell
                  variable={variable}
                  value={provenance.previousValue as never}
                  muted
                />
              </Row>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1 border-t border-ink-100 pt-2.5">
            <button className="flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900">
              <Icon name="RotateCcw" size={10} />
              Revert
            </button>
            <button className="flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900">
              <Icon name="Lock" size={10} />
              Lock field
            </button>
          </div>
        </div>,
          document.body,
        )}
    </>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex w-[60px] shrink-0 items-center gap-1 text-[10.5px] font-medium uppercase tracking-wider text-ink-500">
        <Icon name={icon} size={10} className="text-ink-400" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
