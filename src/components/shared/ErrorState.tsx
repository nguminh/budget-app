import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

export function ErrorState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-danger/20 bg-danger/5 p-8 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-danger/10 p-3 text-danger">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="font-body text-sm text-ink/70">{description}</p>
          {action}
        </div>
      </div>
    </div>
  )
}

