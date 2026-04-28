import { useMemo } from 'react'
import { Link, useMatch, useParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useCrmStore } from '@/store/useCrmStore'
import { cn } from '@/lib/utils'

// Top-level CRM navigation. Replaces what would normally live in a sidebar.
// Lives at the top of every CRM page so users can switch between objects
// without leaving the surface.
//
//   ╭──────╮ ╭───────╮ ╭──────────╮  +              🔔  👤
//   │Custs │ │Deals  │ │Properties│
//   ╰──────╯ ╰───────╯ ╰──────────╯
//
// "Home" comes first (links to dashboard / AI activity overview).

export function ObjectTabs() {
  const schemas = useCrmStore((s) => s.schemas)
  const records = useCrmStore((s) => s.records)
  const { objectKey } = useParams()
  const onHome = !!useMatch('/')

  const counts = useMemo(() => {
    const map: globalThis.Record<string, number> = {}
    for (const r of records) map[r.objectKey] = (map[r.objectKey] ?? 0) + 1
    return map
  }, [records])

  return (
    <div className="flex h-12 shrink-0 items-center gap-0.5 border-b border-ink-200 bg-white px-3">
      {/* Home */}
      <Tab
        to="/"
        icon="Sparkles"
        label="Home"
        active={onHome}
        accentColor="#5B5BF5"
      />

      <div className="mx-1 h-5 w-px bg-ink-200" />

      {/* Objects */}
      {schemas.map((s) => (
        <Tab
          key={s.key}
          to={`/o/${s.key}`}
          icon={s.icon}
          label={s.plural}
          count={counts[s.key]}
          active={objectKey === s.key}
          accentColor={s.color}
        />
      ))}

      {/* New object */}
      <button
        title="Add object"
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
      >
        <Icon name="Plus" size={14} strokeWidth={2.5} />
      </button>

      {/* Right side: search + global actions */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Icon
            name="Search"
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search records…"
            className="h-8 w-[220px] rounded-md border border-ink-200 bg-white pl-7 pr-2 text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          <kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded border border-ink-200 bg-white px-1 text-[10px] font-medium text-ink-400">
            ⌘K
          </kbd>
        </div>
      </div>
    </div>
  )
}

function Tab({
  to,
  icon,
  label,
  count,
  active,
  accentColor,
}: {
  to: string
  icon: string
  label: string
  count?: number
  active?: boolean
  accentColor?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors',
        active
          ? 'bg-ink-100 text-ink-900'
          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
      )}
    >
      <Icon
        name={icon}
        size={13}
        className={cn(active ? '' : 'text-ink-500 group-hover:text-ink-700')}
        style={active && accentColor ? { color: accentColor } : undefined}
      />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'rounded px-1 text-[10.5px] tabular-nums',
            active ? 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200' : 'text-ink-400',
          )}
        >
          {count}
        </span>
      )}
      {active && (
        <span
          className="absolute inset-x-2 -bottom-[7px] h-[2px] rounded-full"
          style={{ backgroundColor: accentColor ?? '#5B5BF5' }}
        />
      )}
    </Link>
  )
}
