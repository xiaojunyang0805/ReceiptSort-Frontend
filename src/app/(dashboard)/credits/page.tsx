import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Check } from 'lucide-react'

export default async function CreditsPage() {
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

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
        <p className="text-muted-foreground mt-2">
          Manage your credits for processing receipts
        </p>
      </div>

      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Balance
          </CardTitle>
          <CardDescription>Your available credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary">
            {profile?.credits ?? 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Credits remaining
          </p>
        </CardContent>
      </Card>

      {/* Purchase Options */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Purchase Credits</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Starter Pack</CardTitle>
              <CardDescription>Perfect for occasional use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-bold">10</div>
                <p className="text-sm text-muted-foreground">Credits</p>
              </div>
              <div className="text-3xl font-bold">$5</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Process 10 receipts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  AI-powered extraction
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Never expires
                </li>
              </ul>
              <Button className="w-full" disabled>
                Purchase
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Popular
              </div>
              <CardTitle>Pro Pack</CardTitle>
              <CardDescription>Best value for regular users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-bold">50</div>
                <p className="text-sm text-muted-foreground">Credits</p>
              </div>
              <div className="text-3xl font-bold">$20</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Process 50 receipts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  AI-powered extraction
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Never expires
                </li>
              </ul>
              <Button className="w-full" disabled>
                Purchase
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Pack</CardTitle>
              <CardDescription>For heavy users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-4xl font-bold">200</div>
                <p className="text-sm text-muted-foreground">Credits</p>
              </div>
              <div className="text-3xl font-bold">$60</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Process 200 receipts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  AI-powered extraction
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Bulk processing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Never expires
                </li>
              </ul>
              <Button className="w-full" disabled>
                Purchase
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted p-4 rounded-lg mt-6">
          <p className="text-sm text-muted-foreground">
            Payment processing coming soon. This feature will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  )
}
