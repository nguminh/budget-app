const preferenceGroups = [
  {
    title: 'Notifications',
    items: [
      {
        label: 'Budget alerts',
        description: 'Get nudges when a category is nearing its cap.',
        enabled: true,
      },
      {
        label: 'Weekly digest',
        description: 'Receive a summary every Monday morning.',
        enabled: false,
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        label: 'Currency',
        description: 'USD',
        enabled: null,
      },
      {
        label: 'Theme',
        description: 'System',
        enabled: null,
      },
    ],
  },
]

export function SettingsPage({ onResetOnboarding }) {
  return (
    <div className="page-stack">
      {preferenceGroups.map((group) => (
        <section className="settings-card" key={group.title}>
          <h3>{group.title}</h3>
          <div className="settings-list">
            {group.items.map((item) => (
              <article className="setting-row" key={item.label}>
                <div className="setting-row__copy">
                  <span className="setting-row__label">{item.label}</span>
                  <span className="setting-row__description">{item.description}</span>
                </div>

                {typeof item.enabled === 'boolean' ? (
                  <button
                    className={`settings-switch ${
                      item.enabled ? 'settings-switch--on' : ''
                    }`}
                    aria-label={item.label}
                  >
                    <span />
                  </button>
                ) : (
                  <select
                    className="setting-select"
                    aria-label={item.label}
                    defaultValue={item.description}
                  >
                    <option>{item.description}</option>
                  </select>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="settings-card">
        <h3>Onboarding</h3>
        <p className="setting-row__description">
          Keep the one-time flow easy to revisit while the experience is still evolving.
        </p>
        <div className="settings-list">
          <button className="secondary-button" onClick={onResetOnboarding}>
            Replay onboarding
          </button>
        </div>
      </section>
    </div>
  )
}
