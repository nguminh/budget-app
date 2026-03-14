import { useState } from 'react'

const categories = ['Housing', 'Food & Dining', 'Travel', 'Fun', 'Income']

export function AddTransactionForm({ onAddTransaction }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description || !amount || !category) return
    const newTransaction = {
      id: Date.now(), // simple unique id
      merchant: description,
      category,
      amount: parseFloat(amount),
      dateLabel: 'Just now',
      icon: '💳',
      color: '#f0f0f0',
    }
    onAddTransaction(newTransaction)
    setDescription('')
    setAmount('')
    setCategory('')
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <h2>Add New Transaction</h2>
      </div>
      <form className="add-transaction-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button type="submit">Add Transaction</button>
      </form>
    </section>
  )
}