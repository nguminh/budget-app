import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-border bg-card px-3 font-body text-sm text-foreground outline-none placeholder:text-ink/38 focus:border-accent',
        className,
      )}
      {...props}
    />
  )
}