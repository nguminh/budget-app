import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return <span className={cn('font-brand text-[2.15rem] font-semibold uppercase leading-none text-foreground', className)}>RWY</span>
}
