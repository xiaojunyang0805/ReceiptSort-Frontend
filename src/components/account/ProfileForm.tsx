'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'
import { useRouter } from '@/lib/navigation'

interface ProfileFormProps {
  initialName: string | null
}

export function ProfileForm({ initialName }: ProfileFormProps) {
  const t = useTranslations('account')
  const router = useRouter()
  const [name, setName] = useState(initialName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateProfile(name.trim())

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Refresh the page to show updated data
        router.refresh()
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      setError(t('updateError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t('fullName')}</Label>
        <Input
          id="fullName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('enterName')}
          disabled={isLoading}
          maxLength={100}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 dark:text-green-400">
          {t('updateSuccess')}
        </div>
      )}

      <Button type="submit" disabled={isLoading || name.trim() === initialName}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('saveChanges')}
      </Button>
    </form>
  )
}
