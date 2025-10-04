import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, FileText, Upload, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch receipts stats
  const { count: totalReceipts } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  // Fetch receipts this month
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const { count: receiptsThisMonth } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .gte('created_at', firstDayOfMonth.toISOString())

  // Fetch last export date
  const { data: lastExport } = await supabase
    .from('exports')
    .select('created_at')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch pending receipts
  const { count: pendingReceipts } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('processing_status', 'pending')

  const hasReceipts = (totalReceipts ?? 0) > 0
  const hasPendingReceipts = (pendingReceipts ?? 0) > 0

  const lastExportDate = lastExport?.created_at
    ? new Date(lastExport.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Never'

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s an overview of your receipt management
        </p>
      </div>

      {/* Credit Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Balance
          </CardTitle>
          <CardDescription>Available credits for processing receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {profile?.credits_remaining ?? 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Credits remaining
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/credits">Purchase More Credits</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts ?? 0}</div>
            <p className="text-xs text-muted-foreground">All time processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receiptsThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">Receipts uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Export</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastExportDate}</div>
            <p className="text-xs text-muted-foreground">Most recent export</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State or Actions */}
      {!hasReceipts ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Upload your first receipt to start organizing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Receipt
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : hasPendingReceipts ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending Receipts</CardTitle>
            <CardDescription>
              You have {pendingReceipts} receipt(s) waiting to be processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg">
              Process All Pending ({pendingReceipts})
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
