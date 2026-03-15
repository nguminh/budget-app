import { FileUp, LoaderCircle, Sparkles } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { cn } from '@/lib/utils'

type ImportDropzoneProps = {
  description: string
  disabled?: boolean
  isProcessing?: boolean
  onFileSelect: (file: File) => void
  processingLabel?: string
  selectedFileName?: string
  title: string
}

const ACCEPTED_FILE_TYPES = '.csv,.json,.xlsx,.pdf,image/*'

export function ImportDropzone({
  description,
  disabled = false,
  isProcessing = false,
  onFileSelect,
  processingLabel,
  selectedFileName,
  title,
}: ImportDropzoneProps) {
  const { t } = useAppTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file || disabled) {
      return
    }

    onFileSelect(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/80 bg-card/95 transition duration-300',
        !disabled && 'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,15,15,0.08)]',
        isDragging && 'border-accent shadow-[0_0_0_1px_rgba(17,17,17,0.12)]',
      )}
    >
      <CardContent
        className="relative overflow-hidden p-0"
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) {
            setIsDragging(true)
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return
          }
          setIsDragging(false)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        <div className="absolute -right-14 top-5 size-28 rounded-full bg-foreground/[0.04] blur-2xl" />
        <div className="absolute -left-10 bottom-4 size-24 rounded-full bg-foreground/[0.05] blur-2xl" />
        <div className="relative flex flex-col gap-6 px-5 py-6 md:px-6 md:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-border bg-background/80 text-foreground shadow-sm">
                {isProcessing ? <LoaderCircle className="size-5 animate-spin" /> : <FileUp className="size-5" />}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold uppercase tracking-[0.08em] text-foreground">{title}</h2>
                  <Badge className="gap-1 border border-border bg-background/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-ink/70">
                    <Sparkles className="size-3.5" />
                    {t('transactions.import.assistantBadge')}
                  </Badge>
                </div>
                <p className="max-w-2xl font-body text-sm text-ink/68">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['CSV', 'JSON', 'XLSX', 'PDF', 'PHOTO'].map((label) => (
                <Badge key={label} className="bg-muted/80 text-[11px] uppercase tracking-[0.18em] text-ink/65">
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-border/80 bg-background/65 px-5 py-7 text-center transition-colors duration-300 md:px-8">
            <p className="font-body text-sm text-ink/72">
              {selectedFileName ? t('transactions.import.currentFile', { fileName: selectedFileName }) : t('transactions.import.emptyState')}
            </p>
            <p className="mt-2 font-body text-xs uppercase tracking-[0.18em] text-ink/45">
              {isProcessing ? processingLabel ?? t('transactions.import.reading') : t('transactions.import.directHint')}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <input
                ref={inputRef}
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                disabled={disabled}
                onChange={(event) => handleFiles(event.target.files)}
                type="file"
              />
              <Button disabled={disabled} onClick={() => inputRef.current?.click()} type="button">
                {isProcessing ? t('transactions.import.processingFile') : t('transactions.import.chooseFile')}
              </Button>
              {selectedFileName ? (
                <Button disabled={disabled} onClick={() => inputRef.current?.click()} type="button" variant="outline">
                  {t('transactions.import.replaceFile')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
