import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export function LoadingState({ fullScreen = false, label }: { fullScreen?: boolean; label?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[28px] border border-border bg-card/80 p-10 shadow-soft',
        fullScreen && 'min-h-screen rounded-none border-0 bg-background shadow-none',
      )}
    >
      <div className="flex flex-col items-center gap-3 text-ink/70">
        <LoaderCircle className="size-8 animate-spin text-accent" />
        <p className="font-body text-sm">{label ?? 'Loading...'}</p>
      </div>
    </div>
  )
}

