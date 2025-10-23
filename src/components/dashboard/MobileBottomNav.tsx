'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/navigation'
import { usePathname } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { Home, Upload, Receipt, CreditCard, MoreHorizontal, UserCircle, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { checkIsAdmin } from '@/lib/admin'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MobileBottomNavProps {
  className?: string
}

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
  href?: string
  asChild?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, isActive, href, asChild = false, onClick }: NavItemProps) {
  const content = (
    <div
      className="flex flex-col items-center justify-center min-w-[64px] h-14 relative cursor-pointer"
      onClick={onClick}
    >
      {/* Active indicator - top border */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-b-full" />
      )}

      {/* Icon */}
      <Icon className={cn(
        'h-6 w-6 mb-1',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )} />

      {/* Label */}
      <span className={cn(
        'text-xs',
        isActive
          ? 'text-primary font-semibold'
          : 'text-muted-foreground font-normal'
      )}>
        {label}
      </span>
    </div>
  )

  if (asChild || !href) {
    return content
  }

  return (
    <Link href={href} className="tap-highlight-transparent">
      {content}
    </Link>
  )
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const t = useTranslations('common')
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  // Main navigation items (always visible)
  const mainNavigation = [
    { name: t('dashboard'), href: '/dashboard', icon: Home, label: 'Home' },
    { name: t('uploadReceipts'), href: '/upload', icon: Upload, label: 'Upload' },
    { name: t('receipts'), href: '/receipts', icon: Receipt, label: 'List' },
    { name: t('credits'), href: '/credits', icon: CreditCard, label: 'Credits' },
  ]

  // More menu items (in dropdown)
  const moreMenuItems = [
    { name: t('account'), href: '/account', icon: UserCircle },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
  ]

  // Check if current page is in "More" menu
  const isMoreActive = moreMenuItems.some(item => pathname === item.href)

  return (
    <nav className={cn('w-full', className)}>
      <div className="flex items-center justify-around h-16 px-2">
        {/* Main navigation items */}
        {mainNavigation.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={pathname === item.href}
          />
        ))}

        {/* More dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="tap-highlight-transparent focus:outline-none">
              <NavItem
                icon={MoreHorizontal}
                label="More"
                isActive={isMoreActive}
                asChild
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="mb-2">
            {moreMenuItems.map((item) => {
              const ItemIcon = item.icon
              const isActive = pathname === item.href

              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 cursor-pointer',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <ItemIcon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
