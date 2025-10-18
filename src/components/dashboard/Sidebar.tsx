'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/navigation'
import { usePathname } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { Home, Upload, Receipt, Download, CreditCard, Shield, UserCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { checkIsAdmin } from '@/lib/admin'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations('common')
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  const baseNavigation = [
    { name: t('dashboard'), href: '/dashboard', icon: Home },
    { name: t('uploadReceipts'), href: '/upload', icon: Upload },
    { name: t('receipts'), href: '/receipts', icon: Receipt },
    { name: t('exports'), href: '/exports', icon: Download },
    { name: t('credits'), href: '/credits', icon: CreditCard },
    { name: t('account'), href: '/account', icon: UserCircle },
  ]

  // Only add Admin link if user is admin
  const navigation = isAdmin
    ? [...baseNavigation, { name: 'Admin', href: '/admin', icon: Shield }]
    : baseNavigation

  return (
    <aside className={cn('pb-12 w-full', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
