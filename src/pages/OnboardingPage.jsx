const onboardingSteps = [
  {
    step: 'Step 1',
    title: 'Connect the big picture',
    description:
      'Introduce balances, monthly targets, and category budgets in one guided flow.',
  },
  {
    step: 'Step 2',
    title: 'Make modules independent',
    description:
      'Transactions, analysis, settings, and navigation each live in their own area for parallel work.',
  },
  {
    step: 'Step 3',
    title: 'Stay ready for PWA polish',
    description:
      'This scaffold already includes manifest and service worker hooks for installation and offline follow-up work.',
  },
]

export function OnboardingPage({ onComplete }) {
  return (
    <main className="onboarding-screen">
      <section className="onboarding-hero">
        <span className="onboarding-badge">Budget App</span>
        <div className="onboarding-copy">
          <h1>Plan spending with a calm, mobile-first home base.</h1>
          <p>
            This first iteration is structured for multiple contributors to build features in
            parallel without stepping on each other.
          </p>
        </div>
      </section>

      <section className="onboarding-steps">
        {onboardingSteps.map((item) => (
          <article className="onboarding-card" key={item.title}>
            <div className="onboarding-card__step">{item.step}</div>
            <h3>{item.title}</h3>
            <p className="setting-row__description">{item.description}</p>
          </article>
        ))}
      </section>

      <button className="primary-button" onClick={onComplete}>
        Finish setup
      </button>
    </main>
  )
}
