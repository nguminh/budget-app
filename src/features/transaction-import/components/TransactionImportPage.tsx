import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, RefreshCcw, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/hooks/useCategories'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { buildTransactionSchema } from '@/lib/validations/transaction'

import { ImportDropzone } from '@/features/transaction-import/components/ImportDropzone'
import { buildImportDrafts, matchCategory } from '@/features/transaction-import/lib/categoryMatching'
import { prepareImportPayload } from '@/features/transaction-import/lib/fileParsers'
import { extractTransactionsWithGemini } from '@/features/transaction-import/lib/gemini'
import { getImportDraftIssues } from '@/features/transaction-import/lib/importValidation'
import { useImportTransactionsMutation } from '@/features/transaction-import/hooks/useImportTransactionsMutation'
import type { TransactionImportDraft, TransactionImportResult } from '@/features/transaction-import/types'

type DraftIssueMap = Record<string, string[]>

function getConfidenceTone(confidence: TransactionImportDraft['confidence']) {
  if (confidence === 'high') {
    return 'bg-foreground text-accentForeground'
  }

  if (confidence === 'low') {
    return 'bg-danger/10 text-danger'
  }

  return 'bg-muted text-ink'
}

export function TransactionImportPage() {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const { categories, error, isLoading } = useCategories()
  const importTransactions = useImportTransactionsMutation()
  const [importResult, setImportResult] = useState<TransactionImportResult | null>(null)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [processingLabel, setProcessingLabel] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const validationSchema = useMemo(() => buildTransactionSchema(t), [t])

  const draftIssues = useMemo<DraftIssueMap>(() => {
    if (!importResult) {
      return {}
    }

    return importResult.transactions.reduce<DraftIssueMap>((accumulator, draft) => {
      const issues = getImportDraftIssues(draft, validationSchema)
      const selectedCategory = categories.find((category) => category.id === draft.categoryId)

      if (draft.categoryId && selectedCategory && selectedCategory.kind !== draft.type) {
        issues.push(t('transactions.import.categoryTypeMismatch'))
      }

      accumulator[draft.id] = issues
      return accumulator
    }, {})
  }, [categories, importResult, t, validationSchema])

  const invalidCount = Object.values(draftIssues).filter((issues) => issues.length > 0).length
  const warningCount = importResult?.transactions.reduce((total, draft) => total + draft.warnings.length, 0) ?? 0
  const readyCount = importResult ? importResult.transactions.length - invalidCount : 0

  async function handleFileSelect(file: File) {
    setImportResult(null)
    setProcessingError(null)
    setSelectedFileName(file.name)
    setIsProcessing(true)

    try {
      setProcessingLabel(t('transactions.import.reading'))
      const payload = await prepareImportPayload(file)

      const records = payload.parser === 'direct'
        ? payload.records
        : await (async () => {
            setProcessingLabel(t('transactions.import.extracting'))
            return extractTransactionsWithGemini({
              fileName: file.name,
              inlineData: payload.inlineData,
              text: payload.text,
            }, categories)
          })()

      setImportResult({
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE',
        parser: payload.parser,
        transactions: buildImportDrafts(records, categories),
      })
    } catch (importError) {
      setProcessingError(importError instanceof Error ? importError.message : t('transactions.import.genericError'))
    } finally {
      setIsProcessing(false)
      setProcessingLabel(null)
    }
  }

  function updateDraft(draftId: string, updater: (draft: TransactionImportDraft) => TransactionImportDraft) {
    setImportResult((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        transactions: current.transactions.map((draft) => (draft.id === draftId ? updater(draft) : draft)),
      }
    })
  }

  function removeDraft(draftId: string) {
    setImportResult((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        transactions: current.transactions.filter((draft) => draft.id !== draftId),
      }
    })
  }

  async function handleImport() {
    if (!importResult) {
      return
    }

    try {
      const payload = importResult.transactions.map((draft) => {
        const category = categories.find((item) => item.id === draft.categoryId)
        if (!category) {
          throw new Error(t('transactions.import.fixIssues'))
        }

        return {
          amount: draft.amount,
          categoryId: category.id,
          categoryName: category.name,
          merchant: draft.merchant.trim(),
          note: draft.note.trim(),
          transactionDate: draft.transactionDate,
          transactionTime: draft.transactionTime,
          type: draft.type,
        }
      })

      await importTransactions.mutateAsync(payload)
      toast.success(t('transactions.import.success', { count: payload.length }))
      navigate('/transactions')
    } catch (importError) {
      toast.error(importError instanceof Error ? importError.message : t('transactions.import.genericError'))
    }
  }

  if (isLoading && categories.length === 0) {
    return <LoadingState label={t('common.loading')} />
  }

  if (error) {
    return <ErrorState title={t('transactions.import.title')} description={error} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-ink/48">{t('transactions.import.eyebrow')}</p>
          <h2 className="text-3xl font-semibold uppercase tracking-[0.08em] text-foreground md:text-4xl">
            {t('transactions.import.title')}
          </h2>
        </div>
        <Button asChild type="button" variant="ghost">
          <Link to="/transactions">
            <ArrowLeft className="size-4" />
            {t('common.back')}
          </Link>
        </Button>
      </div>

      <ImportDropzone
        description={t('transactions.import.description')}
        isProcessing={isProcessing}
        onFileSelect={(file) => void handleFileSelect(file)}
        processingLabel={processingLabel ?? undefined}
        selectedFileName={selectedFileName ?? undefined}
        title={t('transactions.import.dropTitle')}
      />

      {processingError ? (
        <ErrorState
          action={
            <div className="pt-2">
              <Button
                onClick={() => {
                  setProcessingError(null)
                  setSelectedFileName(null)
                }}
                type="button"
                variant="outline"
              >
                {t('transactions.import.reset')}
              </Button>
            </div>
          }
          description={processingError}
          title={t('transactions.import.errorTitle')}
        />
      ) : null}

      {importResult ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl md:text-2xl">{t('transactions.import.reviewTitle')}</CardTitle>
                  <Badge className="bg-muted/80 text-[11px] uppercase tracking-[0.16em] text-ink/65">
                    {importResult.fileType}
                  </Badge>
                  <Badge className="gap-1 border border-border bg-background/80 text-[11px] uppercase tracking-[0.16em] text-ink/68">
                    {importResult.parser === 'direct' ? <CheckCircle2 className="size-3.5" /> : <Sparkles className="size-3.5" />}
                    {importResult.parser === 'direct' ? t('transactions.import.direct') : t('transactions.import.gemini')}
                  </Badge>
                </div>
                <p className="font-body text-sm text-ink/65">{importResult.fileName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setImportResult(null)
                    setProcessingError(null)
                  }}
                  type="button"
                  variant="outline"
                >
                  <RefreshCcw className="size-4" />
                  {t('transactions.import.reset')}
                </Button>
                <Button
                  disabled={invalidCount > 0 || importResult.transactions.length === 0 || importTransactions.isPending}
                  onClick={() => void handleImport()}
                  type="button"
                >
                  {importTransactions.isPending ? t('transactions.import.saving') : t('transactions.import.importCta', { count: readyCount })}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {importResult.transactions.length === 0 ? (
                <ErrorState
                  description={t('transactions.import.emptyDetected')}
                  title={t('transactions.import.errorTitle')}
                />
              ) : (
                importResult.transactions.map((draft, index) => {
                  const filteredCategories = categories.filter((category) => category.kind === draft.type)
                  const issues = draftIssues[draft.id] ?? []

                  return (
                    <div
                      key={draft.id}
                      className="rounded-[24px] border border-border bg-background/70 p-4 shadow-[0_10px_24px_rgba(15,15,15,0.04)] transition duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-foreground text-accentForeground">#{index + 1}</Badge>
                            <Badge className={getConfidenceTone(draft.confidence)}>
                              {t(`transactions.import.confidence.${draft.confidence}`)}
                            </Badge>
                            {draft.warnings.length > 0 ? (
                              <Badge className="bg-foreground/10 text-foreground">
                                <AlertTriangle className="mr-1 size-3.5" />
                                {t('transactions.import.warningCount', { count: draft.warnings.length })}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">
                            {draft.suggestedCategoryName || t('transactions.import.noSuggestedCategory')}
                          </p>
                        </div>
                        <Button onClick={() => removeDraft(draft.id)} size="icon" type="button" variant="ghost">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2">
                          <Label>{t('transactions.type')}</Label>
                          <Select
                            onValueChange={(value) => {
                              updateDraft(draft.id, (current) => {
                                const type = value as 'expense' | 'income'
                                const currentCategory = categories.find((category) => category.id === current.categoryId)
                                const matchedCategory = currentCategory?.kind === type
                                  ? currentCategory
                                  : matchCategory(categories, {
                                      categoryName: current.suggestedCategoryName,
                                      type,
                                    })

                                return {
                                  ...current,
                                  categoryId: matchedCategory?.id ?? '',
                                  type,
                                }
                              })
                            }}
                            value={draft.type}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">{t('common.expense')}</SelectItem>
                              <SelectItem value="income">{t('common.income')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`merchant-${draft.id}`}>{t('transactions.merchant')}</Label>
                          <Input
                            id={`merchant-${draft.id}`}
                            onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, merchant: event.target.value }))}
                            value={draft.merchant}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`amount-${draft.id}`}>{t('transactions.amount')}</Label>
                          <Input
                            id={`amount-${draft.id}`}
                            min="0"
                            onChange={(event) => {
                              const nextValue = Number.parseFloat(event.target.value)
                              updateDraft(draft.id, (current) => ({ ...current, amount: Number.isFinite(nextValue) ? nextValue : 0 }))
                            }}
                            step="0.01"
                            type="number"
                            value={Number.isFinite(draft.amount) ? draft.amount : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('transactions.category')}</Label>
                          <Select
                            onValueChange={(value) => {
                              const category = categories.find((item) => item.id === value)
                              updateDraft(draft.id, (current) => ({
                                ...current,
                                categoryId: value,
                                suggestedCategoryName: category?.name ?? current.suggestedCategoryName,
                              }))
                            }}
                            value={draft.categoryId || undefined}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('transactions.import.chooseCategory')} />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredCategories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`date-${draft.id}`}>{t('transactions.date')}</Label>
                          <Input
                            id={`date-${draft.id}`}
                            onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, transactionDate: event.target.value }))}
                            type="date"
                            value={draft.transactionDate}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`time-${draft.id}`}>{t('transactions.time')}</Label>
                          <Input
                            id={`time-${draft.id}`}
                            onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, transactionTime: event.target.value }))}
                            type="time"
                            value={draft.transactionTime}
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor={`note-${draft.id}`}>{t('transactions.note')}</Label>
                        <Textarea
                          id={`note-${draft.id}`}
                          onChange={(event) => updateDraft(draft.id, (current) => ({ ...current, note: event.target.value }))}
                          value={draft.note}
                        />
                      </div>

                      {draft.warnings.length > 0 ? (
                        <div className="mt-4 rounded-2xl border border-border/70 bg-card px-3.5 py-3">
                          <p className="font-body text-xs uppercase tracking-[0.16em] text-ink/45">{t('transactions.import.modelNotes')}</p>
                          <ul className="mt-2 space-y-1 font-body text-sm text-ink/70">
                            {draft.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
                          </ul>
                        </div>
                      ) : null}

                      {issues.length > 0 ? (
                        <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/5 px-3.5 py-3">
                          <p className="font-body text-xs uppercase tracking-[0.16em] text-danger">{t('transactions.import.fixLabel')}</p>
                          <ul className="mt-2 space-y-1 font-body text-sm text-danger">
                            {issues.map((issue) => <li key={issue}>- {issue}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">{t('transactions.import.summaryTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">{t('transactions.import.rowsDetected')}</p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{importResult.transactions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">{t('transactions.import.readyToSave')}</p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{readyCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">{t('transactions.import.issues')}</p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{invalidCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">{t('transactions.import.flowTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-body text-sm text-ink/70">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-semibold uppercase tracking-[0.14em] text-foreground">{t('transactions.import.stepOne')}</p>
                  <p className="mt-2">{t('transactions.import.stepOneBody')}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-semibold uppercase tracking-[0.14em] text-foreground">{t('transactions.import.stepTwo')}</p>
                  <p className="mt-2">{t('transactions.import.stepTwoBody')}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-semibold uppercase tracking-[0.14em] text-foreground">{t('transactions.import.stepThree')}</p>
                  <p className="mt-2">{t('transactions.import.stepThreeBody', { count: warningCount })}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-foreground text-accentForeground">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-white/10 p-2.5">
                    <FileText className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-body text-xs uppercase tracking-[0.18em] text-accentForeground/70">
                      {t('transactions.import.importTipLabel')}
                    </p>
                    <p className="font-body text-sm text-accentForeground/85">{t('transactions.import.importTip')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
