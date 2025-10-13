'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ContactFormProps {
  accessKey: string
}

export function ContactForm({ accessKey }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setSubmitStatus('success')
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000)
      } else {
        setSubmitStatus('error')
        setErrorMessage(data.message || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {submitStatus === 'success' && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Message sent successfully! We&apos;ll get back to you within 24 hours.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === 'error' && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Web3Forms Access Key - Hidden */}
        <input type="hidden" name="access_key" value={accessKey} />

        {/* Optional: Redirect after submission (can remove if you want to stay on page) */}
        <input type="hidden" name="redirect" value="false" />

        {/* Bot spam protection */}
        <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Your name"
            className="mt-1.5"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            className="mt-1.5"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            placeholder="How can we help?"
            className="mt-1.5"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell us more about your inquiry..."
            rows={6}
            className="mt-1.5"
            required
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          We typically respond within 24 hours
        </p>
      </form>
    </>
  )
}
