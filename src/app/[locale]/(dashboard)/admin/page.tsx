'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkIsAdmin } from '@/lib/admin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Plus, Minus, RefreshCw, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  credits: number
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [creditAction, setCreditAction] = useState<'add' | 'subtract' | 'set'>('add')
  const [creditAmount, setCreditAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Check admin access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.log('[Admin] No user found, redirecting to login')
          router.push('/login')
          return
        }

        const adminStatus = await checkIsAdmin()

        if (!adminStatus) {
          console.log('[Admin] User is not admin, redirecting to dashboard')
          toast.error('Access denied: Admin privileges required')
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('[Admin] Error checking access:', error)
        router.push('/dashboard')
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [router, supabase])

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error('Please enter an email to search')
      return
    }

    setIsSearching(true)
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Session expired. Please login again.')
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: searchEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search users')
      }

      if (data.users.length === 0) {
        toast.error('No users found')
        setUsers([])
        return
      }

      setUsers(data.users)
      toast.success(`Found ${data.users.length} user(s)`)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAdjustCredits = async () => {
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }

    const amount = parseInt(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsProcessing(true)
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Session expired. Please login again.')
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: creditAction,
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust credits')
      }

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id ? { ...u, credits: data.newCredits } : u
        )
      )
      setSelectedUser(prev => prev ? { ...prev, credits: data.newCredits } : null)

      toast.success(
        `Credits ${creditAction === 'set' ? 'set to' : creditAction === 'add' ? 'added:' : 'subtracted:'} ${amount}`
      )
      setCreditAmount('')
    } catch (error) {
      console.error('Credit adjustment error:', error)
      toast.error('Failed to adjust credits')
    } finally {
      setIsProcessing(false)
    }
  }

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Only render admin panel if user is admin
  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto py-8 space-y-6 pb-32 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts and credits
        </p>
      </div>

      {/* Search Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Search Users</h2>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter email address..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* User Results */}
          {users.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className={selectedUser?.id === user.id ? 'bg-muted' : ''}
                    >
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.credits} credits</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={selectedUser?.id === user.id ? 'default' : 'outline'}
                          onClick={() => setSelectedUser(user)}
                        >
                          {selectedUser?.id === user.id ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Credit Management Section */}
      {selectedUser && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Adjust Credits</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Managing credits for: <span className="font-medium">{selectedUser.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Current balance: <span className="font-medium">{selectedUser.credits} credits</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={creditAction}
                  onValueChange={(value: 'add' | 'subtract' | 'set') => setCreditAction(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Credits
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4" />
                        Subtract Credits
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Set Credits
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleAdjustCredits}
                  disabled={isProcessing || !creditAmount}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Apply Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {creditAmount && !isNaN(parseInt(creditAmount)) && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Preview:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {creditAction === 'add' && (
                    <>
                      {selectedUser.credits} + {creditAmount} = <span className="font-medium">{selectedUser.credits + parseInt(creditAmount)} credits</span>
                    </>
                  )}
                  {creditAction === 'subtract' && (
                    <>
                      {selectedUser.credits} - {creditAmount} = <span className="font-medium">{Math.max(0, selectedUser.credits - parseInt(creditAmount))} credits</span>
                    </>
                  )}
                  {creditAction === 'set' && (
                    <>
                      New balance: <span className="font-medium">{creditAmount} credits</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
