import { categoryBreakdown, insights } from '../data/mockData.js'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function AnalysisPage() {
  return (
    <div className="page-stack">
      <section className="panel">
        <h3>Category Comparison</h3>
        <p className="setting-row__description">
          A dedicated visualization area for company and category-level spending signals.
        </p>
      </section>

      <section className="insight-list">
        {categoryBreakdown.map((category) => (
          <article className="insight-card" key={category.name}>
            <div className="insight-card__row">
              <strong>{category.name}</strong>
              <strong>{currency.format(category.amount)}</strong>
            </div>
            <div className="insight-bar" aria-hidden="true">
              <span
                style={{
                  width: `${category.share}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
            <div className="setting-row__description">
              {category.share}% of this month&apos;s spend
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <h3>Signals For The Team</h3>
        <div className="settings-list">
          {insights.map((insight) => (
            <article className="setting-row" key={insight.title}>
              <div className="setting-row__copy">
                <span className="setting-row__label">Insight</span>
                <strong>{insight.title}</strong>
                <span className="setting-row__description">{insight.subtitle}</span>
              </div>
              <strong style={{ color: insight.color }}>{insight.value}%</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
