import { TransactionsPanel } from '../components/transactions/TransactionsPanel.jsx'

export function TransactionsPage() {
  return (
    <div className="page-stack">
      <div className="panel">
        <h3>Transaction Workspace</h3>
        <p className="setting-row__description">
          This module is intentionally isolated so search, filters, pagination, and data
          integrations can be built independently.
        </p>
      </div>
      <TransactionsPanel />
    </div>
  )
}
