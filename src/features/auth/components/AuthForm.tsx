import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { BrandMark } from '@/components/shared/BrandMark'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { supabase, supabaseConfigError } from '@/lib/supabase'
import { buildAuthSchema } from '@/lib/validations/auth'

function getAuthErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return 'Unable to reach Supabase. Verify VITE_SUPABASE_URL, then restart the Vite dev server.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Authentication failed. Please try again.'
}

export function AuthForm() {
  const [isSignup, setIsSignup] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const schema = buildAuthSchema(t, isSignup)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)

    if (supabaseConfigError) {
      toast.error(supabaseConfigError)
      setSubmitting(false)
      return
    }

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { full_name: values.fullName },
          },
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success(t('auth.successSignup'))
          setIsSignup(false)
          form.reset({ fullName: '', email: values.email, password: '' })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success(t('auth.successSignin'))
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <BrandMark className="text-[1.85rem]" />
        <CardTitle>{isSignup ? t('auth.signUp') : t('auth.signIn')}</CardTitle>
        <p className="font-body text-sm text-ink/70">{t('auth.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {isSignup ? (
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input id="fullName" {...form.register('fullName')} />
              <p className="font-body text-xs text-danger">{form.formState.errors.fullName?.message}</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" {...form.register('email')} />
            <p className="font-body text-xs text-danger">{form.formState.errors.email?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" {...form.register('password')} />
            <p className="font-body text-xs text-danger">{form.formState.errors.password?.message}</p>
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? t('common.loading') : isSignup ? t('auth.submitSignUp') : t('auth.submitSignIn')}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setIsSignup((current) => !current)}>
            {isSignup ? t('auth.toggleToSignIn') : t('auth.toggleToSignUp')}
          </Button>
          <p className="text-center font-body text-xs text-ink/55">{t('auth.helper')}</p>
        </form>
      </CardContent>
    </Card>
  )
}
