'use client'

import { LogOut, User } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

interface NavbarClientProps {
  userInitials: string
  fullName: string | null
  email: string | undefined
  credits: number
}

export function NavbarClient({ userInitials, fullName, email, credits }: NavbarClientProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold">ReceiptSort</h1>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          <Link href="/credits" className="hidden sm:block">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors cursor-pointer">
              <span className="text-sm font-medium">Credits:</span>
              <span
                className={`text-sm font-bold ${
                  credits === 0
                    ? 'text-red-600'
                    : credits < 3
                    ? 'text-red-600'
                    : credits <= 10
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}
              >
                {credits}
              </span>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {fullName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="sm:hidden">
                <span className="text-sm">
                  Credits: {credits}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex w-full items-center cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
