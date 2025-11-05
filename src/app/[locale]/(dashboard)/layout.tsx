import { createClient } from '@/lib/supabase/server'
import { redirect } from '@/lib/navigation'
import { Navbar } from '@/components/dashboard/Navbar'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: '/login', locale })
  }

  return (
    <div className="flex min-h-screen flex-col max-w-full overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 max-w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r overflow-y-auto">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden md:pl-64 px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden pb-safe">
        <MobileBottomNav />
      </div>
    </div>
  )
}
