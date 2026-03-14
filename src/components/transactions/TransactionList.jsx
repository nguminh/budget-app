const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function TransactionList({ transactions, emptyLabel = 'No transactions found.' }) {
  if (!transactions.length) {
    return <div className="empty-state">{emptyLabel}</div>
  }

  return (
    <div className="transaction-list" id="transactions">
      {transactions.map((transaction) => (
        <article className="transaction-row" key={transaction.id}>
          <div
            className="transaction-row__icon"
            style={{ backgroundColor: transaction.color }}
            aria-hidden="true"
          >
            {transaction.icon}
          </div>

          <div>
            <h3 className="transaction-row__merchant">{transaction.merchant}</h3>
            <div className="transaction-row__date">
              {transaction.dateLabel} · {transaction.category}
            </div>
          </div>

          <div
            className={`transaction-row__amount ${
              transaction.amount < 0
                ? 'transaction-row__amount--negative'
                : 'transaction-row__amount--positive'
            }`}
          >
            {currency.format(transaction.amount)}
          </div>
        </article>
      ))}
    </div>
  )
}
