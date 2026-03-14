import { categoryBreakdown } from '../../data/mockData.js'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function SpendingDistribution() {
  return (
    <section className="page-stack">
      <div className="section-heading">
        <h2>Spending Analysis</h2>
        <a href="#analysis">View Trends</a>
      </div>

      <div className="panel analysis-ring">
        <div className="analysis-ring__chart" aria-hidden="true">
          <div className="analysis-ring__center">
            <span>May</span>
            <strong>{currency.format(3240)}</strong>
          </div>
        </div>

        <div className="analysis-ring__legend">
          {categoryBreakdown.map((category) => (
            <div className="legend-chip" key={category.name}>
              <span
                className="legend-chip__dot"
                style={{ backgroundColor: category.color }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
