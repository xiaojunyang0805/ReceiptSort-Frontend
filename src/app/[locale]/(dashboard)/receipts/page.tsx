import ReceiptList from '@/components/dashboard/ReceiptList'

export default function ReceiptsPage() {
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Receipts</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your uploaded receipts
        </p>
      </div>

      {/* Receipt List */}
      <ReceiptList />
    </div>
  )
}
