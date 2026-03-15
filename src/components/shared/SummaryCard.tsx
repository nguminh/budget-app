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
    <div className="rounded-[18px] border border-border bg-card px-3.5 py-3.5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[11px] uppercase tracking-[0.18em] text-ink/55">{title}</p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground md:text-2xl">{value}</p>
          <p className="mt-1 hidden font-body text-[11px] text-ink/55 md:block">{description}</p>
        </div>
        <div
          className={[
            'shrink-0 rounded-xl p-2.5',
            tone === 'success' ? 'bg-accent/10 text-accent' : '',
            tone === 'warning' ? 'bg-warning/10 text-warning' : '',
            tone === 'default' ? 'bg-foreground/5 text-foreground' : '',
          ].join(' ')}
        >
          <Icon className="size-[18px] md:size-5" />
        </div>
      </div>
    </div>
  )
}
