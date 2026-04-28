import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

// Dummy "outer app" sidebar — simulates the CRM living inside a larger
// product. The CRM has its own internal navigation via ObjectTabs, so this
// is just visual chrome to show the screen-real-estate constraint.
//
// In a real app, these icons would link to other surfaces (Inbox, Calendar,
// Files, etc). Here only "CRM" is interactive.

interface AppItem {
  icon: string
  label: string
  badge?: number
  active?: boolean
  disabled?: boolean
}

const TOP_ITEMS: AppItem[] = [
  { icon: 'Inbox', label: 'Inbox', badge: 4, disabled: true },
  { icon: 'Calendar', label: 'Calendar', disabled: true },
  { icon: 'Users', label: 'CRM', active: true },
  { icon: 'CheckSquare', label: 'Tasks', disabled: true },
  { icon: 'BarChart3', label: 'Reports', disabled: true },
  { icon: 'FolderClosed', label: 'Files', disabled: true },
]

const BOTTOM_ITEMS: AppItem[] = [
  { icon: 'Bell', label: 'Notifications', badge: 2, disabled: true },
  { icon: 'Settings', label: 'Settings', disabled: true },
]

export function AppShellSidebar() {
  return (
    <aside className="flex h-full w-[56px] shrink-0 flex-col items-center border-r border-ink-200 bg-ink-950 py-3">
      {/* Mini brand */}
      <div
        className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white"
        title="Frontdesk"
      >
        <span className="text-[12px] font-bold tracking-tight">F</span>
      </div>

      <div className="h-px w-7 bg-white/10" />

      {/* Top nav */}
      <nav className="mt-3 flex flex-col items-center gap-1">
        {TOP_ITEMS.map((item) => (
          <ShellIcon key={item.label} item={item} />
        ))}
      </nav>

      {/* Bottom nav + avatar */}
      <div className="mt-auto flex flex-col items-center gap-1">
        {BOTTOM_ITEMS.map((item) => (
          <ShellIcon key={item.label} item={item} />
        ))}
        <div
          title="Aadhrik · Workspace owner"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-[11px] font-bold text-white ring-2 ring-white/10"
        >
          A
        </div>
      </div>
    </aside>
  )
}

function ShellIcon({ item }: { item: AppItem }) {
  return (
    <button
      title={`${item.label}${item.disabled ? ' (other app surface)' : ''}`}
      disabled={item.disabled}
      className={cn(
        'group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        item.active
          ? 'bg-white/15 text-white shadow-elev-1 ring-1 ring-white/20'
          : 'text-white/55 hover:bg-white/10 hover:text-white',
        item.disabled && 'cursor-default opacity-70 hover:bg-transparent hover:text-white/55',
      )}
    >
      <Icon name={item.icon} size={16} strokeWidth={2} />
      {item.badge !== undefined && item.badge > 0 && (
        <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-ink-950">
          {item.badge}
        </span>
      )}
      {/* Active indicator bar */}
      {item.active && (
        <span className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white" />
      )}
    </button>
  )
}
