import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps {
  name: string
  className?: string
  size?: number
  strokeWidth?: number
}

export function Icon({ name, className, size, strokeWidth = 1.75 }: IconProps) {
  // @ts-expect-error — dynamic lookup is fine; fallback for missing icons
  const Cmp = LucideIcons[name] ?? LucideIcons.Circle
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
    />
  )
}
