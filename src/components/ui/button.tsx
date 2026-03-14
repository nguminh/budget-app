import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Button({
  asChild,
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: 'default' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: ReactNode
}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-body text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-foreground text-accentForeground hover:bg-foreground/90',
        variant === 'secondary' && 'bg-accent text-accentForeground hover:bg-accent/90',
        variant === 'ghost' && 'bg-transparent text-foreground hover:bg-foreground/5',
        variant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
        variant === 'outline' && 'border border-border bg-card text-foreground hover:bg-muted',
        size === 'default' && 'h-11 px-5',
        size === 'sm' && 'h-9 px-3 text-xs',
        size === 'lg' && 'h-12 px-6 text-base',
        size === 'icon' && 'size-10',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

