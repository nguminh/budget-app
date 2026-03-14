import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#1f6f5f', '#cb7c2c', '#b74f3b', '#6a8caf', '#92735f', '#8c5f7a']

export function DashboardChartFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading chart...</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[320px] animate-pulse rounded-[28px] bg-muted" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
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
        <div className="mt-4 flex flex-wrap gap-2">
          {data.map((entry, index) => (
            <Badge key={entry.name} style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}>
              {entry.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

