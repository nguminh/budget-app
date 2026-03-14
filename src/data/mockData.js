export const budgetSnapshot = {
  totalBalance: 12450,
  monthlySpend: 3240,
  budgetLeft: 1760,
  budgetCap: 5000,
}

export const categoryBreakdown = [
  { name: 'Housing', amount: 1458, share: 38, color: '#3d7eff', icon: '🏠' },
  { name: 'Food & Dining', amount: 810, share: 27, color: '#26c28f', icon: '🍔' },
  { name: 'Travel', amount: 486, share: 19, color: '#ffc83c', icon: '🚗' },
  { name: 'Fun', amount: 486, share: 16, color: '#7e84f6', icon: '🎬' },
]

export const transactions = [
  {
    id: 1,
    merchant: 'Whole Foods Market',
    category: 'Food & Dining',
    amount: -64.2,
    dateLabel: 'Today, 12:45 PM',
    icon: '🍔',
    color: '#eafaf3',
  },
  {
    id: 2,
    merchant: 'Uber Trip',
    category: 'Travel',
    amount: -12,
    dateLabel: 'Yesterday, 8:30 PM',
    icon: '🚗',
    color: '#eef5ff',
  },
  {
    id: 3,
    merchant: 'Netflix Subscription',
    category: 'Fun',
    amount: -15.99,
    dateLabel: 'May 12, 10:00 AM',
    icon: '🎬',
    color: '#f0eeff',
  },
  {
    id: 4,
    merchant: 'Landlord Transfer',
    category: 'Housing',
    amount: -1458,
    dateLabel: 'May 1, 9:00 AM',
    icon: '🏠',
    color: '#eef4ff',
  },
  {
    id: 5,
    merchant: 'Payroll Deposit',
    category: 'Income',
    amount: 2480,
    dateLabel: 'Apr 30, 6:00 AM',
    icon: '💼',
    color: '#effcf7',
  },
]

export const insights = [
  {
    title: 'Housing is your biggest category',
    subtitle: '29% of this month’s total budget',
    value: 78,
    color: '#3d7eff',
  },
  {
    title: 'Food spend is trending up',
    subtitle: '12% higher than last month',
    value: 62,
    color: '#26c28f',
  },
  {
    title: 'Fun still has room',
    subtitle: '$214 left in the entertainment envelope',
    value: 44,
    color: '#7e84f6',
  },
]
