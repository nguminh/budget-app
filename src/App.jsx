import { useEffect, useState } from 'react'
import './App.css'
import { BottomNav } from './components/layout/BottomNav.jsx'
import { TopHeader } from './components/layout/TopHeader.jsx'
import { AnalysisPage } from './pages/AnalysisPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { OnboardingPage } from './pages/OnboardingPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { TransactionsPage } from './pages/TransactionsPage.jsx'

const ONBOARDING_STORAGE_KEY = 'budget-app-onboarding-complete'

const pageMeta = {
  home: { title: "Alex's Finances", eyebrow: 'Welcome Back' },
  transactions: { title: 'Transactions', eyebrow: 'Search And Sort' },
  analysis: { title: 'Spending Analysis', eyebrow: 'Budget Intelligence' },
  settings: { title: 'Preferences', eyebrow: 'Control Center' },
}

function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  })
  const [activePage, setActivePage] = useState(() =>
    window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
      ? 'home'
      : 'onboarding',
  )

  useEffect(() => {
    if (hasCompletedOnboarding) {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    }
  }, [hasCompletedOnboarding])

  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true)
    setActivePage('home')
  }

  const handleResetOnboarding = () => {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    setHasCompletedOnboarding(false)
    setActivePage('onboarding')
  }

  const renderPage = () => {
    switch (activePage) {
      case 'transactions':
        return <TransactionsPage />
      case 'analysis':
        return <AnalysisPage />
      case 'settings':
        return <SettingsPage onResetOnboarding={handleResetOnboarding} />
      case 'home':
      default:
        return <HomePage />
    }
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingPage onComplete={handleCompleteOnboarding} />
  }

  return (
    <div className="app-shell">
      <TopHeader
        eyebrow={pageMeta[activePage].eyebrow}
        title={pageMeta[activePage].title}
        profileInitials="AS"
      />
      <main className="page-content">{renderPage()}</main>
      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  )
}

export default App
