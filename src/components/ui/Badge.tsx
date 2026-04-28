import * as React from 'react'
import { cn } from '@/lib/utils'

// Color tokens → tailwind classes. Soft bg + saturated text for legibility.
const COLOR_MAP: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  zinc: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  pink: 'bg-pink-50 text-pink-700 ring-pink-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
}

const DOT_MAP: Record<string, string> = {
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

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string
  dot?: boolean
  size?: 'xs' | 'sm'
}

export function Badge({
  className,
  color = 'zinc',
  dot = false,
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium ring-1 ring-inset',
        size === 'xs' ? 'h-5 px-1.5 text-2xs' : 'h-6 px-2 text-xs',
        COLOR_MAP[color] ?? COLOR_MAP.zinc,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            DOT_MAP[color] ?? DOT_MAP.zinc,
          )}
        />
      )}
      {children}
    </span>
  )
}
