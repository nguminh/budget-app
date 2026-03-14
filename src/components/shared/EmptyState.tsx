import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-card/70 p-8 text-center shadow-soft">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="rounded-full bg-muted p-4 text-accent">
          <Inbox className="size-6" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="font-body text-sm text-ink/70">{description}</p>
        {action}
      </div>
    </div>
  )
}

