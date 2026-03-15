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
    <div className="rounded-[18px] border border-border bg-card px-3 py-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-body text-[11px] uppercase tracking-[0.18em] text-ink/55">{title}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground md:text-2xl">{value}</p>
          <p className="mt-1 hidden font-body text-[11px] text-ink/55 md:block">{description}</p>
        </div>
        <div
          className={[
            'rounded-xl p-2',
            tone === 'success' ? 'bg-accent/10 text-accent' : '',
            tone === 'warning' ? 'bg-warning/10 text-warning' : '',
            tone === 'default' ? 'bg-foreground/5 text-foreground' : '',
          ].join(' ')}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  )
}