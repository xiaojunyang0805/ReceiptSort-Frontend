import { createClient } from '@/lib/supabase/server'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, full_name')
    .eq('id', user?.id)
    .single()

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U'

  return (
    <NavbarClient
      userInitials={userInitials}
      fullName={profile?.full_name || null}
      email={user?.email}
      credits={profile?.credits ?? 0}
    />
  )
}
