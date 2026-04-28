import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm',
      'placeholder:text-ink-400 text-ink-900',
      'transition-colors',
      'focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
      'disabled:opacity-50 disabled:bg-ink-50',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
