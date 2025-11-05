import { AuthForm } from '@/components/auth/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | ReceiptSort',
  description: 'Create your ReceiptSort account',
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
