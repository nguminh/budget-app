import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { BrandMark } from '@/components/shared/BrandMark'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BudgetAllocationEditor } from '@/features/budgets/components/BudgetAllocationEditor'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSaveBudget } from '@/features/budgets/hooks/useBudgetMutations'
import {
  allocationsToSave,
  createBudgetAllocationMap,
  getAutoBalanceCategoryId,
  rebalanceAllocationsForTotal,
  setCategoryAllocationAmount,
  type AllocationMap,
  type BudgetCategory,
} from '@/features/budgets/lib/allocations'
import { getBudgetBuckets } from '@/features/budgets/lib/budgetBuckets'
import { useBudget } from '@/hooks/useBudget'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import {
  DEFAULT_MONTHLY_BUDGET,
  getBudgetAllocationsFromPreferences,
  getDefaultProfileName,
  getPreferencesFromBudgetAllocations,
  normalizeProfileBudgetPreferences,
} from '@/lib/profileDefaults'
import { supabase } from '@/lib/supabase'
import { formatMonthInput } from '@/lib/utils'

type StepId = 0 | 1 | 2

function parseAmountInput(value: string) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const { needsOnboarding, profile, profileLoading, refreshProfile, user } = useAuth()
  const month = useMemo(() => formatMonthInput(), [])
  const { budget, categoryBudgets, isLoading: budgetLoading } = useBudget(month)
  const { categories, isLoading: categoriesLoading } = useCategories()
  const saveBudget = useSaveBudget()
  const [step, setStep] = useState<StepId>(0)
  const [fullName, setFullName] = useState('')
  const [totalBudget, setTotalBudget] = useState(DEFAULT_MONTHLY_BUDGET)
  const [allocations, setAllocations] = useState<AllocationMap>({})
  const [saving, setSaving] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const initializedRef = useRef(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const budgetInputRef = useRef<HTMLInputElement | null>(null)
  const finishButtonRef = useRef<HTMLButtonElement | null>(null)

  const budgetCategories = useMemo(
    () =>
      getBudgetBuckets(categories)
        .filter((bucket) => Boolean(bucket.categoryId))
        .map(
          (bucket) =>
            ({
              color: bucket.color,
              id: bucket.categoryId,
              name: bucket.label,
            }) satisfies BudgetCategory,
        ),
    [categories],
  )
  const autoBalanceCategoryId = useMemo(() => getAutoBalanceCategoryId(budgetCategories), [budgetCategories])
  const defaultName = useMemo(() => getDefaultProfileName(user, profile?.full_name), [profile?.full_name, user])
  const defaultBudget = profile?.monthly_budget ?? DEFAULT_MONTHLY_BUDGET
  const defaultPreferences = useMemo(() => normalizeProfileBudgetPreferences(profile?.budget_preferences), [profile?.budget_preferences])
  const initialAllocations = useMemo(
    () =>
      getBudgetAllocationsFromPreferences({
        categories,
        preferences: defaultPreferences,
        totalAmount: defaultBudget,
      }),
    [categories, defaultBudget, defaultPreferences],
  )

  useEffect(() => {
    if (profileLoading || categoriesLoading || initializedRef.current) {
      return
    }

    setFullName(defaultName)
    setTotalBudget(defaultBudget)
    setAllocations(
      createBudgetAllocationMap({
        allocations: initialAllocations,
        autoBalanceCategoryId,
        categories: budgetCategories,
        totalAmount: defaultBudget,
      }),
    )
    initializedRef.current = true
  }, [autoBalanceCategoryId, budgetCategories, categoriesLoading, defaultBudget, defaultName, initialAllocations, profileLoading])

  useEffect(() => {
    if (profileLoading) {
      return
    }

    if (!needsOnboarding && !showWelcome && !saving) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, needsOnboarding, profileLoading, saving, showWelcome])

  useEffect(() => {
    if (step === 0) {
      nameInputRef.current?.focus()
      return
    }

    if (step === 1) {
      budgetInputRef.current?.focus()
      budgetInputRef.current?.select()
      return
    }

    finishButtonRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (!showWelcome) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 1350)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, showWelcome])

  const showLoadingState = profileLoading || categoriesLoading || budgetLoading || !initializedRef.current

  const handleBudgetAmountChange = (value: string) => {
    const nextTotal = parseAmountInput(value)
    setTotalBudget(nextTotal)
    setAllocations((currentAllocations) =>
      rebalanceAllocationsForTotal({
        allocations: currentAllocations,
        autoBalanceCategoryId,
        categories: budgetCategories,
        totalAmount: nextTotal,
      }),
    )
  }

  const handleAllocationChange = (categoryId: string, value: string) => {
    setAllocations((currentAllocations) =>
      setCategoryAllocationAmount({
        allocations: currentAllocations,
        autoBalanceCategoryId,
        amount: parseAmountInput(value),
        categoryId,
        categories: budgetCategories,
        totalAmount: totalBudget,
      }),
    )
  }

  const resetBudgetToDefaults = () => {
    setTotalBudget(defaultBudget)
    setAllocations(
      createBudgetAllocationMap({
        allocations: initialAllocations,
        autoBalanceCategoryId,
        categories: budgetCategories,
        totalAmount: defaultBudget,
      }),
    )
  }

  const resetSplitToDefaults = () => {
    return createBudgetAllocationMap({
      allocations: getBudgetAllocationsFromPreferences({
        categories,
        preferences: defaultPreferences,
        totalAmount: totalBudget,
      }),
      autoBalanceCategoryId,
      categories: budgetCategories,
      totalAmount: totalBudget,
    })
  }

  const completeOnboarding = async (overrides?: {
    allocations?: AllocationMap
    fullName?: string
    totalBudget?: number
  }) => {
    if (!user) {
      return
    }

    const finalFullName = overrides?.fullName ?? fullName
    const finalTotalBudget = overrides?.totalBudget ?? totalBudget
    const finalAllocations = overrides?.allocations ?? allocations
    const savedAllocations = allocationsToSave(finalAllocations)
    const budgetPreferences = getPreferencesFromBudgetAllocations({
      allocations: savedAllocations,
      categories,
      existingPreferences: defaultPreferences,
    })

    setSaving(true)

    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: finalFullName.trim() || defaultName,
        monthly_budget: finalTotalBudget,
        budget_preferences: budgetPreferences,
        onboarding_completed_at: new Date().toISOString(),
      })

      if (profileError) {
        throw profileError
      }

      if (budgetCategories.length > 0) {
        await saveBudget.mutateAsync({
          amount: finalTotalBudget,
          budgetId: budget?.id,
          categoryAllocations: savedAllocations,
          existingCategoryBudgets: categoryBudgets,
          month,
        })
      }

      await refreshProfile()
      setShowWelcome(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('onboarding.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = async () => {
    if (step < 2) {
      setStep((currentStep) => (currentStep + 1) as StepId)
      return
    }

    await completeOnboarding()
  }

  const handleBack = () => {
    setStep((currentStep) => Math.max(0, currentStep - 1) as StepId)
  }

  const handleSkip = async () => {
    if (step === 0) {
      setFullName(defaultName)
      setStep(1)
      return
    }

    if (step === 1) {
      resetBudgetToDefaults()
      setStep(2)
      return
    }

    const defaultAllocations = resetSplitToDefaults()
    setAllocations(defaultAllocations)
    await completeOnboarding({ allocations: defaultAllocations })
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.18),_transparent_42%),linear-gradient(180deg,#f8f2e8_0%,#f4efe6_100%)] px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
          <div className="welcome-fade-out rounded-[36px] border border-border/80 bg-card/90 px-8 py-12 text-center shadow-soft">
            <p className="font-body text-sm uppercase tracking-[0.35em] text-ink/55">{t('onboarding.welcomeEyebrow')}</p>
            <BrandMark className="mt-4 text-[3rem] md:text-[4rem]" />
            <p className="mt-4 text-xl font-semibold text-foreground">{t('onboarding.welcomeMessage')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (showLoadingState) {
    return <LoadingState fullScreen label={t('common.loading')} />
  }

  const stepLabel = t('onboarding.stepCounter', { current: step + 1, total: 3 })

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(31,111,95,0.18),_transparent_42%),linear-gradient(180deg,#f8f2e8_0%,#f4efe6_100%)] px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col justify-between">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <BrandMark className="text-[2.3rem] md:text-[2.8rem]" />
          <div className="flex items-center gap-3">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-ink/55">{stepLabel}</p>
            <Button type="button" variant="ghost" className="rounded-full px-4" onClick={() => void handleSkip()}>
              {t('onboarding.skip')}
            </Button>
          </div>
        </header>

        <main className="flex-1">
          <Card className="relative overflow-hidden rounded-[36px] border-border/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(255,248,236,0.78))]">
            <CardContent className="p-5 md:p-8 lg:p-10">
              {step === 0 ? (
                <div className="grid min-h-[70vh] gap-8 lg:grid-cols-[25%_75%] lg:items-center">
                  <div className="order-2 flex items-end justify-center lg:order-1 lg:justify-start">
                    <img
                      alt=""
                      aria-hidden="true"
                      className="max-h-[260px] w-full max-w-[240px] object-contain opacity-95 lg:max-h-[420px] lg:max-w-none"
                      src="/doodle1.png"
                    />
                  </div>
                  <div className="order-1 lg:order-2 lg:ml-auto lg:max-w-2xl lg:pl-8">
                    <p className="font-body text-sm uppercase tracking-[0.28em] text-ink/55">{t('onboarding.eyebrow')}</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-6xl">{t('onboarding.profileTitle')}</h1>
                    <p className="mt-4 max-w-xl font-body text-lg text-ink/70">{t('onboarding.profileDescription')}</p>

                    <form
                      className="mt-8 space-y-5"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void handleContinue()
                      }}
                    >
                      <div className="space-y-2">
                        <label className="font-body text-sm font-medium text-foreground" htmlFor="onboarding-name">
                          {t('auth.fullName')}
                        </label>
                        <Input
                          ref={nameInputRef}
                          autoComplete="name"
                          className="h-14 rounded-2xl bg-card/90 px-4 text-lg"
                          id="onboarding-name"
                          onChange={(event) => setFullName(event.target.value)}
                          placeholder={defaultName}
                          value={fullName}
                        />
                        <p className="font-body text-sm text-ink/60">{t('onboarding.profileHint')}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="h-12 rounded-2xl px-6 text-base" type="submit">
                          {t('onboarding.next')}
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="mb-6 max-h-[180px] w-full max-w-[240px] object-contain md:mb-8 md:max-h-[240px] md:max-w-[300px]"
                    src="/doodle2.png"
                  />
                  <p className="font-body text-sm uppercase tracking-[0.28em] text-ink/55">{t('onboarding.eyebrow')}</p>
                  <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-6xl">{t('onboarding.budgetTitle')}</h1>
                  <p className="mt-4 max-w-2xl font-body text-lg text-ink/70">{t('onboarding.budgetDescription')}</p>

                  <form
                    className="mt-8 w-full max-w-2xl"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void handleContinue()
                    }}
                  >
                    <label className="sr-only" htmlFor="onboarding-budget">
                      {t('onboarding.totalBudget')}
                    </label>
                    <div className="rounded-[32px] border border-border/80 bg-card/85 px-6 py-8 shadow-soft md:px-10 md:py-10">
                      <div className="flex items-start justify-center gap-2 text-foreground">
                        <span className="pt-3 text-2xl font-semibold md:text-4xl">$</span>
                        <Input
                          ref={budgetInputRef}
                          className="budget-hero-input h-auto border-0 bg-transparent px-0 text-center font-display text-5xl font-semibold tracking-[-0.05em] focus-visible:ring-0 md:text-7xl"
                          id="onboarding-budget"
                          inputMode="decimal"
                          min={0}
                          onChange={(event) => handleBudgetAmountChange(event.target.value)}
                          step="0.01"
                          type="number"
                          value={totalBudget}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Button className="h-12 rounded-2xl px-6 text-base" type="button" variant="outline" onClick={handleBack}>
                        <ArrowLeft className="size-4" />
                        {t('common.back')}
                      </Button>
                      <Button className="h-12 rounded-2xl px-6 text-base" type="submit">
                        {t('onboarding.next')}
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid min-h-[70vh] gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div className="max-w-2xl">
                      <p className="font-body text-sm uppercase tracking-[0.28em] text-ink/55">{t('onboarding.eyebrow')}</p>
                      <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-6xl">{t('onboarding.splitTitle')}</h1>
                      <p className="mt-4 font-body text-lg text-ink/70">{t('onboarding.splitDescription')}</p>
                    </div>
                    <div className="rounded-[28px] border border-border/70 bg-card/70 p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-body text-xs uppercase tracking-[0.22em] text-ink/55">{t('onboarding.totalBudget')}</p>
                          <p className="mt-2 text-3xl font-semibold text-foreground">${totalBudget.toFixed(2)}</p>
                        </div>
                        <Button className="rounded-full" type="button" variant="ghost" onClick={() => setStep(1)}>
                          {t('onboarding.editBudget')}
                        </Button>
                      </div>
                      <BudgetAllocationEditor
                        allocations={allocations}
                        autoBalanceCategoryId={autoBalanceCategoryId}
                        categories={budgetCategories}
                        onAllocationChange={handleAllocationChange}
                        totalAmount={totalBudget}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button className="h-12 rounded-2xl px-6 text-base" type="button" variant="outline" onClick={handleBack}>
                        <ArrowLeft className="size-4" />
                        {t('common.back')}
                      </Button>
                      <Button ref={finishButtonRef} className="h-12 rounded-2xl px-6 text-base" type="button" onClick={() => void handleContinue()} disabled={saving}>
                        <Sparkles className="size-4" />
                        {saving ? t('common.loading') : t('onboarding.finish')}
                      </Button>
                    </div>
                  </div>

                  <aside className="flex flex-col justify-between gap-6 rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(244,239,230,0.94),rgba(255,255,255,0.72))] p-5">
                    <img alt="" aria-hidden="true" className="mx-auto w-full max-w-[230px] object-contain" src="/doodle3.png" />
                    <div className="space-y-3">
                      <p className="font-body text-xs uppercase tracking-[0.28em] text-ink/55">{t('onboarding.readyEyebrow')}</p>
                      <p className="text-2xl font-semibold leading-tight text-foreground">{t('onboarding.readyTitle')}</p>
                      <p className="font-body text-sm text-ink/68">{t('onboarding.readyDescription')}</p>
                    </div>
                  </aside>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default OnboardingPage
