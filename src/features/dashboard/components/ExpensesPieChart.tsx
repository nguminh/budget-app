import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#1f6f5f', '#cb7c2c', '#b74f3b', '#6a8caf', '#92735f', '#8c5f7a']

export function DashboardChartFallback() {
  return (
    <Card className="border-transparent bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>Loading chart...</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[320px] animate-pulse rounded-[20px] bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-6 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpensesPieChart({
  data,
  locale,
  title,
}: {
  data: Array<{ name: string; value: number }>
  locale: string
  title: string
}) {
  const tooltipFormatter = useMemo(
    () => (value: number) => formatCurrency(value, 'CAD', locale),
    [locale],
  )

  return (
    <Card className="border-transparent bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-2 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="h-[280px] md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between gap-3 rounded-[14px] border border-border/35 bg-transparent px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-body text-sm text-foreground">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(entry.value, 'CAD', locale)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpensesPieChart
