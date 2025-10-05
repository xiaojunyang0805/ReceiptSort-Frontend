import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function ExportPage() {
  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Receipts</h1>
        <p className="text-muted-foreground mt-2">
          Export your processed receipts to various formats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Choose your preferred format to export your receipt data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">CSV Export</h3>
              <p className="text-sm text-muted-foreground">
                Download all receipts as a CSV file
              </p>
            </div>
            <Button disabled>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Excel Export</h3>
              <p className="text-sm text-muted-foreground">
                Download all receipts as an Excel file
              </p>
            </div>
            <Button disabled>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">PDF Report</h3>
              <p className="text-sm text-muted-foreground">
                Generate a PDF report of all receipts
              </p>
            </div>
            <Button disabled>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Export functionality coming soon. This feature will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
