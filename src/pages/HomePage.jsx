import { BudgetHero } from '../components/home/BudgetHero.jsx'
import { SpendingDistribution } from '../components/home/SpendingDistribution.jsx'
import { SpendingHighlights } from '../components/home/SpendingHighlights.jsx'
import { TransactionsPanel } from '../components/transactions/TransactionsPanel.jsx'

export function HomePage() {
  return (
    <div className="page-stack">
      <BudgetHero />
      <SpendingDistribution />
      <SpendingHighlights />
      <TransactionsPanel limit={3} />
    </div>
  )
}
