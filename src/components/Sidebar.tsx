import { useMemo } from 'react'
import { NavLink, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useCrmStore } from '@/store/useCrmStore'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const schemas = useCrmStore((s) => s.schemas)
  const records = useCrmStore((s) => s.records)
  const savedViews = useCrmStore((s) => s.savedViews)
  const { objectKey } = useParams()
  const [searchParams] = useSearchParams()
  const activeViewId = searchParams.get('view') ?? undefined

  const countsByObject = useMemo(() => {
    const counts: globalThis.Record<string, number> = {}
    for (const r of records) counts[r.objectKey] = (counts[r.objectKey] ?? 0) + 1
    return counts
  }, [records])

  const pinnedViewsByObject = useMemo(() => {
    const map: globalThis.Record<string, typeof savedViews> = {}
    for (const v of savedViews) {
      if (!v.pinned) continue
      ;(map[v.objectKey] ??= []).push(v)
    }
    return map
  }, [savedViews])

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-ink-200 bg-ink-50/40">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950 text-white shadow-elev-1">
          <span className="text-[13px] font-bold tracking-tight">F</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-ink-900">
            Frontdesk
          </span>
          <span className="text-[10.5px] text-ink-500">CRM</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Primary nav */}
        <nav className="px-2 pt-1">
          <NavItem to="/" icon="LayoutDashboard" label="Dashboard" />
          <NavItem to="/search" icon="Search" label="Search" shortcut="⌘K" />
        </nav>

        {/* Objects + their pinned views */}
        <div className="mt-5 flex items-center justify-between px-4 pb-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
            Objects
          </span>
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            title="New object"
          >
            <Icon name="Plus" size={13} strokeWidth={2} />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {schemas.map((s) => {
            const count = countsByObject[s.key] ?? 0
            const active = objectKey === s.key
            const pinned = pinnedViewsByObject[s.key] ?? []
            return (
              <div key={s.key} className="flex flex-col gap-0.5">
                <NavLink
                  to={`/o/${s.key}`}
                  end
                  className={({ isActive }) =>
                    cn(
                      'group flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors',
                      isActive && !activeViewId
                        ? 'bg-white text-ink-900 shadow-elev-1 ring-1 ring-ink-200/60'
                        : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900',
                    )
                  }
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded text-ink-500 group-hover:text-ink-800"
                    style={active ? { color: s.color } : undefined}
                  >
                    <Icon name={s.icon} size={14} />
                  </span>
                  <span className="flex-1 truncate">{s.plural}</span>
                  <span className="text-[11px] tabular-nums text-ink-400">
                    {count}
                  </span>
                </NavLink>

                {/* Pinned views under this object */}
                {pinned.length > 0 && (
                  <div className="mb-1 flex flex-col gap-0.5 pl-4">
                    {pinned.map((v) => {
                      const isActive = objectKey === s.key && activeViewId === v.id
                      return (
                        <NavLink
                          key={v.id}
                          to={`/o/${s.key}?view=${v.id}`}
                          className={cn(
                            'group flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] transition-colors',
                            isActive
                              ? 'bg-white text-ink-900 shadow-elev-1 ring-1 ring-ink-200/60'
                              : 'text-ink-500 hover:bg-ink-100/70 hover:text-ink-900',
                          )}
                        >
                          <Icon
                            name={v.icon ?? (v.layout === 'board' ? 'LayoutGrid' : 'Rows3')}
                            size={12}
                            className="text-ink-400 group-hover:text-ink-700"
                            style={isActive && v.color ? { color: v.color } : undefined}
                          />
                          <span className="flex-1 truncate">{v.name}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-ink-200 p-3">
        <div className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-ink-100/70">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[11px] font-bold text-white">
            A
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[12.5px] font-medium text-ink-900">
              Aadhrik
            </span>
            <span className="truncate text-[10.5px] text-ink-500">
              Workspace owner
            </span>
          </div>
          <Icon
            name="ChevronsUpDown"
            size={12}
            className="ml-auto text-ink-400"
          />
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  to,
  icon,
  label,
  shortcut,
}: {
  to: string
  icon: string
  label: string
  shortcut?: string
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'group flex h-8 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-white text-ink-900 shadow-elev-1 ring-1 ring-ink-200/60'
            : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900',
        )
      }
    >
      <Icon
        name={icon}
        size={14}
        className="text-ink-500 group-hover:text-ink-800"
      />
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="rounded border border-ink-200 bg-white px-1 text-[10px] font-medium text-ink-500">
          {shortcut}
        </kbd>
      )}
    </NavLink>
  )
}
