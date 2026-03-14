import { categoryBreakdown } from '../../data/mockData.js'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function SpendingHighlights() {
  return (
    <section className="page-stack" id="analysis">
      <div className="section-heading">
        <h2>Spending Analysis</h2>
        <a href="#transactions">View Trends</a>
      </div>

      <div className="tile-grid">
        {categoryBreakdown.map((category, index) => (
          <article
            key={category.name}
            className={`tile-card ${index === 0 ? 'tile-card--large' : ''}`}
            style={{ background: category.color }}
          >
            <span className="tile-card__icon" aria-hidden="true">
              {category.icon}
            </span>
            <div>
              <div className="tile-card__label">{category.name}</div>
              <div className="tile-card__amount">
                {currency.format(category.amount)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
