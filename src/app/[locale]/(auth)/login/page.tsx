import { AuthForm } from '@/components/auth/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | ReceiptSort',
  description: 'Login to your ReceiptSort account',
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
