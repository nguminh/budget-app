import { useState } from 'react'
import { transactions as allTransactions } from '../data/mockData.js'
import { AddTransactionForm } from '../components/transactions/AddTransactionForm.jsx'
import { TransactionsPanel } from '../components/transactions/TransactionsPanel.jsx'

export function TransactionsPage() {
  const [transactions, setTransactions] = useState(allTransactions)

  const handleAddTransaction = (newTransaction) => {
    setTransactions([newTransaction, ...transactions])
  }

  return (
    <div className="page-stack">
      <div className="panel">
        <h3>Transaction Workspace</h3>
        <p className="setting-row__description">
          This module is intentionally isolated so search, filters, pagination, and data
          integrations can be built independently.
        </p>
      </div>
      <AddTransactionForm onAddTransaction={handleAddTransaction} />
      <TransactionsPanel transactions={transactions}/>
    </div>
  )
}
