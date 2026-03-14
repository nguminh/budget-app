import { useMemo, useState } from 'react'
import { transactions as allTransactions } from '../../data/mockData.js'
import { TransactionList } from './TransactionList.jsx'

const sorters = {
  newest: (a, b) => b.id - a.id,
  highest: (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
  merchant: (a, b) => a.merchant.localeCompare(b.merchant),
}

export function TransactionsPanel({ transactions = [], limit }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const visibleTransactions = useMemo(() => {
    // 2. We use the prop directly now
    const normalizedQuery = query.trim().toLowerCase()
    
    // 3. Optional: Add a "Guard Clause" just in case the prop is sent as null
    if (!Array.isArray(transactions)) return []

    const filtered = transactions.filter((transaction) => {
      // Use optional chaining (?.) if merchant or category might be missing
      return (
        transaction.merchant?.toLowerCase().includes(normalizedQuery) ||
        transaction.category?.toLowerCase().includes(normalizedQuery)
      )
    })

    const sorted = [...filtered].sort(sorters[sortBy])
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
  }, [limit, query, sortBy, transactions])
  return (
    <section className="page-stack">
      <div className="section-heading">
        <h2>Recent Transactions</h2>
        <a href="#transactions">See All</a>
      </div>

      <div className="transactions-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search merchants or categories"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search transactions"
        />

        <select
          className="sort-select"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort transactions"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest amount</option>
          <option value="merchant">Merchant A-Z</option>
        </select>
      </div>

      <TransactionList
        transactions={visibleTransactions}
        emptyLabel="Try a different search term."
      />
    </section>
  )
}
