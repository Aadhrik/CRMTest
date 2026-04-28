import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'

interface TopbarProps {
  title: string
  subtitle?: React.ReactNode
  icon?: string
  iconColor?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, icon, iconColor, actions }: TopbarProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-ink-200 bg-white/80 px-6 backdrop-blur-sm">
      {icon && (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-50 ring-1 ring-inset ring-ink-200"
          style={iconColor ? { color: iconColor } : undefined}
        >
          <Icon name={icon} size={15} />
        </div>
      )}
      <div className="flex min-w-0 flex-col leading-tight">
        <h1 className="truncate text-[15px] font-semibold text-ink-900">
          {title}
        </h1>
        {subtitle && (
          <span className="truncate text-[11.5px] text-ink-500">{subtitle}</span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon" title="Notifications">
          <Icon name="Bell" size={15} />
        </Button>
      </div>
    </header>
  )
}
