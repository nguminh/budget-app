const navItems = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'transactions', label: 'Activity', icon: '↕' },
  { id: 'analysis', label: 'Insights', icon: '◔' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="footer-nav" aria-label="Primary">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`footer-nav__button ${
            activePage === item.id ? 'footer-nav__button--active' : ''
          }`}
          onClick={() => onNavigate(item.id)}
        >
          <span aria-hidden="true">{item.icon}</span>
          <strong>{item.label}</strong>
        </button>
      ))}
    </nav>
  )
}
