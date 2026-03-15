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
        'inline-flex items-center justify-center gap-2 rounded-xl font-body text-sm font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',
        variant === 'default' && 'bg-foreground text-accentForeground hover:-translate-y-px hover:bg-foreground/92',
        variant === 'secondary' && 'bg-accent text-accentForeground hover:-translate-y-px hover:bg-accent/90',
        variant === 'ghost' && 'bg-transparent text-foreground hover:bg-foreground/5',
        variant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
        variant === 'outline' && 'border border-border bg-card text-foreground hover:bg-muted',
        size === 'default' && 'h-10 px-4',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'lg' && 'h-11 px-5 text-base',
        size === 'icon' && 'size-10',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}