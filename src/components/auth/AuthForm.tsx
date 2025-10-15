'use client'

import { useState } from 'react'
import { useRouter } from '@/lib/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'

// Create schemas with a function to support translations
const createLoginSchema = (t: any) => z.object({
  email: z.string().email(t('errors.invalidEmail')),
  password: z.string().min(6, t('errors.passwordMin')),
})

const createSignupSchema = (t: any) => z.object({
  fullName: z.string().min(2, t('errors.fullNameMin')),
  email: z.string().email(t('errors.invalidEmail')),
  password: z.string().min(6, t('errors.passwordMin')),
  confirmPassword: z.string().min(6, t('errors.passwordMin')),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('errors.passwordMismatch'),
  path: ['confirmPassword'],
})

type LoginFormValues = {
  email: string
  password: string
}
type SignupFormValues = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(mode === 'login' ? createLoginSchema(t) : createSignupSchema(t)),
    defaultValues: mode === 'login'
      ? { email: '', password: '' }
      : { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: LoginFormValues | SignupFormValues) => {
    setIsLoading(true)

    try {
      if (mode === 'login') {
        const { email, password } = values as LoginFormValues
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error(t('errors.invalidCredentials'))
          } else if (error.message.includes('Email not confirmed')) {
            toast.error(t('errors.emailNotConfirmed'))
          } else {
            toast.error(error.message)
          }
          return
        }

        if (data.user) {
          toast.success(t('success.welcomeBack'))
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const { fullName, email, password } = values as SignupFormValues
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error(t('errors.emailAlreadyRegistered'))
          } else {
            toast.error(error.message)
          }
          return
        }

        if (data.user) {
          // Check if email confirmation is required
          if (data.session) {
            // User is automatically logged in (email confirmation disabled)
            toast.success(t('success.accountCreated'))
            router.push('/dashboard')
            router.refresh()
          } else {
            // Email confirmation required
            toast.success(t('success.checkEmail'))
            router.push('/')
          }
        }
      }
    } catch (error) {
      toast.error(t('errors.unexpectedError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      // Use window.location.origin to ensure we get the current domain
      // This is more reliable than environment variables for OAuth redirects
      const origin = window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(t('errors.googleSignInFailed'))
        console.error(error)
      }
    } catch (error) {
      toast.error(t('errors.unexpectedError'))
      console.error(error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'login' ? t('loginTitle') : t('signupTitle')}</CardTitle>
        <CardDescription>
          {mode === 'login' ? t('loginSubtitle') : t('signupSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? t('loading') : t('continueWithGoogle')}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('orContinueWithEmail')}</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fullName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('fullNamePlaceholder')} {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('passwordPlaceholder')}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? t('loading') : mode === 'login' ? t('signIn') : t('signUp')}
            </Button>
          </form>
        </Form>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? (
            <>
              {t('noAccount')}{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                {t('signUp')}
              </Link>
            </>
          ) : (
            <>
              {t('hasAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('logIn')}
              </Link>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  )
}
