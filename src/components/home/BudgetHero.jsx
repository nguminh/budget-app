import { budgetSnapshot } from '../../data/mockData.js'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function BudgetHero() {
  const spentPercentage = (budgetSnapshot.monthlySpend / budgetSnapshot.budgetCap) * 100

  return (
    <section className="hero-card">
      <div className="hero-card__label">Total Balance</div>
      <div className="hero-card__amount">
        {currency.format(budgetSnapshot.totalBalance)}
      </div>

      <div className="hero-card__metrics">
        <div>
          <div className="hero-card__metric-label">Monthly Spend</div>
          <div className="hero-card__metric-value">
            {currency.format(budgetSnapshot.monthlySpend)}
          </div>
        </div>
        <div>
          <div className="hero-card__metric-label">Budget Left</div>
          <div className="hero-card__metric-value hero-card__metric-value--accent">
            {currency.format(budgetSnapshot.budgetLeft)}
          </div>
        </div>
      </div>

      <div className="budget-progress">
        <div className="budget-progress__labels">
          <strong>Spent vs Remaining</strong>
          <span>{Math.round(spentPercentage)}% used</span>
        </div>
        <div className="budget-progress__track" aria-hidden="true">
          <div
            className="budget-progress__fill"
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
        <div className="budget-progress__meta">
          <span>{currency.format(budgetSnapshot.monthlySpend)} spent</span>
          <span>{currency.format(budgetSnapshot.budgetCap)} monthly cap</span>
        </div>
      </div>
    </section>
  )
}
