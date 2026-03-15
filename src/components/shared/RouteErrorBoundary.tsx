import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { useAppTranslation } from '@/hooks/useAppTranslation'

function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return fallback
    }

    return error.statusText || fallback
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('error loading dynamically imported module')) {
      return 'A recent update may have interrupted loading this screen. Refresh the app to load the latest version.'
    }

    return error.message
  }

  return fallback
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useAppTranslation()
  const fallbackDescription = t('routeError.description')
  const description = getFriendlyErrorMessage(error, fallbackDescription)

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
        <ErrorState
          title={t('routeError.title')}
          description={description}
          action={(
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => window.location.reload()}>
                {t('routeError.refresh')}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to="/dashboard">{t('routeError.goHome')}</Link>
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  )
}
