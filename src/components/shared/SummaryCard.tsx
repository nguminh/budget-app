import type { LucideIcon } from 'lucide-react'

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'default',
}: {
  title: string
  value: string
  description: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning'
}) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-sm text-ink/70">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 font-body text-xs text-ink/60">{description}</p>
        </div>
        <div
          className={[
            'rounded-2xl p-3',
            tone === 'success' ? 'bg-accent/10 text-accent' : '',
            tone === 'warning' ? 'bg-warning/10 text-warning' : '',
            tone === 'default' ? 'bg-foreground/5 text-foreground' : '',
          ].join(' ')}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

