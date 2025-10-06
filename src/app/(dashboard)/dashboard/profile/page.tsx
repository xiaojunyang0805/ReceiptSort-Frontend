import { Metadata } from 'next'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export const metadata: Metadata = {
  title: 'Profile | ReceiptSort',
  description: 'Manage your profile settings',
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <ProfileForm />
    </div>
  )
}
