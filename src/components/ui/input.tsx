import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-2xl border border-border bg-card px-4 font-body text-sm text-foreground outline-none placeholder:text-ink/45 focus:border-accent',
        className,
      )}
      {...props}
    />
  )
}

