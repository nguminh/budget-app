import { Mic, PauseCircle, Receipt, Sparkles, Trash2, Upload, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { LoadingState } from '@/components/shared/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createTransactionFromCandidate } from '@/features/transactions/lib/transactionWriteClient'
import { getLocalDateIso, getPreferredAudioMimeType, ingestAudioBlob, ingestImageFile } from '@/features/transactions/lib/transactionIngestionClient'
import type { TransactionCandidate } from '@/features/transactions/lib/transactionTypes'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { formatCurrency } from '@/lib/utils'

type QueueItem = TransactionCandidate & {
  id: string
  saving: boolean
}

function toQueueItems(items: TransactionCandidate[]): QueueItem[] {
  return items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    saving: false,
  }))
}

export function AiTransactionPage() {
  const { user, profile } = useAuth()
  const { categories, loading, error } = useCategories()
  const { t, i18n } = useAppTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [mode, setMode] = useState<'image' | 'audio'>('image')
  const [items, setItems] = useState<QueueItem[]>([])
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)

  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const currency = profile?.default_currency ?? 'CAD'
  const ingestionCategories = useMemo(
    () => categories.map((category) => ({ id: category.id, name: category.name, kind: category.kind })),
    [categories],
  )
  const voiceSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const appendCandidates = (candidates: TransactionCandidate[]) => {
    setItems((current) => [...current, ...toQueueItems(candidates)])
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!user || !files?.length) {
      return
    }

    setBusyLabel(t('transactions.ai.processingReceipt'))

    try {
      for (const file of Array.from(files)) {
        const nextItems = await ingestImageFile({
          userId: user.id,
          file,
          locale,
          timezone,
          todayIso: getLocalDateIso(),
          currency,
          categories: ingestionCategories,
        })
        appendCandidates(nextItems)
      }

      toast.success(t('transactions.ai.addedToQueue'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.errorGeneric'))
    } finally {
      setBusyLabel(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRecordedBlob = async (blob: Blob) => {
    if (!user) {
      return
    }

    setBusyLabel(t('transactions.ai.processingVoice'))

    try {
      const nextItems = await ingestAudioBlob({
        userId: user.id,
        blob,
        locale,
        timezone,
        todayIso: getLocalDateIso(),
        currency,
        categories: ingestionCategories,
      })
      appendCandidates(nextItems)
      toast.success(t('transactions.ai.addedToQueue'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.errorGeneric'))
    } finally {
      setBusyLabel(null)
    }
  }

  const startRecording = async () => {
    if (!voiceSupported || recording) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getPreferredAudioMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      chunksRef.current = []
      streamRef.current = stream
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
        void handleRecordedBlob(blob)
      }

      recorder.start()
      setRecording(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('transactions.ai.voicePermissionError'))
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

  const handleApprove = async (itemId: string) => {
    if (!user) {
      return
    }

    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, saving: true } : item)))

    const item = items.find((entry) => entry.id === itemId)
    if (!item) {
      return
    }

    try {
      await createTransactionFromCandidate(user.id, item, currency)
      setItems((current) => current.filter((entry) => entry.id !== itemId))
      toast.success(t('transactions.successCreate'))
    } catch (error) {
      setItems((current) => current.map((entry) => (entry.id === itemId ? { ...entry, saving: false } : entry)))
      toast.error(error instanceof Error ? error.message : t('auth.errorGeneric'))
    }
  }

  if (loading) {
    return <LoadingState label={t('common.loading')} />
  }

  if (!user || error) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6 lg:px-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>{t('transactions.ai.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-body text-sm text-danger">{error || t('auth.errorGeneric')}</p>
            <div className="mt-4">
              <Button asChild variant="outline"><Link to="/transactions">{t('common.back')}</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="rounded-[34px] border border-border bg-card/95 px-6 py-5 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-body text-xs uppercase tracking-[0.28em] text-ink/50">{t('transactions.ai.kicker')}</p>
              <h1 className="mt-2 text-3xl font-semibold">{t('transactions.ai.title')}</h1>
              <p className="mt-2 max-w-2xl font-body text-sm text-ink/70">{t('transactions.ai.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline"><Link to="/transactions">{t('common.back')}</Link></Button>
              <Button asChild><Link to="/transactions/new">{t('transactions.ai.manualFallback')}</Link></Button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 bg-muted/35">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{t('transactions.ai.captureTitle')}</CardTitle>
                  <p className="font-body text-sm text-ink/65">{t('transactions.ai.captureSubtitle')}</p>
                </div>
                <Badge className="bg-accent/10 text-accent">{busyLabel ?? t('transactions.ai.ready')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={[
                    'rounded-[28px] border p-5 text-left transition',
                    mode === 'image' ? 'border-foreground bg-foreground text-accentForeground' : 'border-border bg-card hover:bg-muted',
                  ].join(' ')}
                  onClick={() => setMode('image')}
                >
                  <Receipt className="size-5" />
                  <p className="mt-4 text-lg font-semibold">{t('transactions.ai.photoMode')}</p>
                  <p className="mt-2 font-body text-sm opacity-80">{t('transactions.ai.photoHint')}</p>
                </button>
                <button
                  type="button"
                  className={[
                    'rounded-[28px] border p-5 text-left transition',
                    mode === 'audio' ? 'border-foreground bg-foreground text-accentForeground' : 'border-border bg-card hover:bg-muted',
                  ].join(' ')}
                  onClick={() => setMode('audio')}
                >
                  <Mic className="size-5" />
                  <p className="mt-4 text-lg font-semibold">{t('transactions.ai.voiceMode')}</p>
                  <p className="mt-2 font-body text-sm opacity-80">{t('transactions.ai.voiceHint')}</p>
                </button>
              </div>

              {mode === 'image' ? (
                <div className="rounded-[30px] border border-dashed border-border bg-muted/35 p-6">
                  <input
                    ref={fileInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => void handleImageUpload(event.target.files)}
                  />
                  <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{t('transactions.ai.photoTitle')}</p>
                      <p className="mt-2 max-w-xl font-body text-sm text-ink/65">{t('transactions.ai.photoDescription')}</p>
                    </div>
                    <Button type="button" disabled={Boolean(busyLabel)} onClick={() => fileInputRef.current?.click()}>
                      <Upload className="size-4" />
                      {t('transactions.ai.uploadReceipt')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[30px] border border-dashed border-border bg-muted/35 p-6">
                  <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{t('transactions.ai.voiceTitle')}</p>
                      <p className="mt-2 max-w-xl font-body text-sm text-ink/65">{t('transactions.ai.voiceDescription')}</p>
                    </div>
                    {voiceSupported ? (
                      recording ? (
                        <Button type="button" variant="danger" disabled={Boolean(busyLabel)} onClick={stopRecording}>
                          <PauseCircle className="size-4" />
                          {t('transactions.ai.stopRecording')}
                        </Button>
                      ) : (
                        <Button type="button" disabled={Boolean(busyLabel)} onClick={() => void startRecording()}>
                          <Mic className="size-4" />
                          {t('transactions.ai.startRecording')}
                        </Button>
                      )
                    ) : (
                      <Badge className="bg-danger/10 text-danger">{t('transactions.ai.voiceUnsupported')}</Badge>
                    )}
                  </div>
                  {recording ? <p className="mt-4 font-body text-sm uppercase tracking-[0.2em] text-danger">{t('transactions.ai.recording')}</p> : null}
                </div>
              )}

              <div className="rounded-[30px] bg-foreground px-6 py-5 text-accentForeground">
                <div className="flex items-center gap-3">
                  <WandSparkles className="size-5" />
                  <p className="text-lg font-semibold">{t('transactions.ai.pipelineTitle')}</p>
                </div>
                <p className="mt-3 font-body text-sm text-accentForeground/80">{t('transactions.ai.pipelineDescription')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{t('transactions.ai.queueTitle')}</CardTitle>
                  <p className="font-body text-sm text-ink/65">{t('transactions.ai.queueSubtitle')}</p>
                </div>
                <Badge>{items.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border bg-muted/35 p-8 text-center">
                  <Sparkles className="mx-auto size-8 text-accent" />
                  <p className="mt-4 text-lg font-semibold">{t('transactions.ai.emptyTitle')}</p>
                  <p className="mt-2 font-body text-sm text-ink/65">{t('transactions.ai.emptyDescription')}</p>
                </div>
              ) : null}

              {items.map((item) => (
                <article key={item.id} className="rounded-[28px] border border-border bg-card p-5 shadow-soft">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{item.merchant}</p>
                        <Badge className={item.source === 'voice' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}>
                          {t(item.source === 'voice' ? 'transactions.ai.sourceVoice' : 'transactions.ai.sourceReceipt')}
                        </Badge>
                        <Badge className="bg-muted text-ink">{Math.round(item.confidence * 100)}%</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-ink/70">
                        <span>{formatCurrency(item.amount, currency, locale)}</span>
                        <span>{item.categoryName}</span>
                        <span>{item.type === 'expense' ? t('common.expense') : t('common.income')}</span>
                        <span>{format(new Date(item.transactionDate), 'PPP')}</span>
                      </div>
                      {item.note ? <p className="mt-3 font-body text-sm text-ink/70">{item.note}</p> : null}
                      {item.transcript ? <p className="mt-3 rounded-2xl bg-muted/50 px-4 py-3 font-body text-sm text-ink/75">{item.transcript}</p> : null}
                      {item.warnings?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.warnings.map((warning) => (
                            <Badge key={warning} className="bg-danger/10 text-danger">{warning}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                      <Button type="button" disabled={item.saving} onClick={() => void handleApprove(item.id)}>
                        {item.saving ? t('common.loading') : t('transactions.ai.approve')}
                      </Button>
                      <Button type="button" variant="ghost" disabled={item.saving} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
                        <Trash2 className="size-4" />
                        {t('transactions.ai.remove')}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
