# Export Functionality Guide

## CSV Export

### Features
- ✅ Export receipts to CSV format
- ✅ Only exports completed (processed) receipts
- ✅ Sorted by date (oldest first)
- ✅ Includes all receipt fields
- ✅ Unlimited exports (no credit cost)
- ✅ Automatic filename with date

### CSV Format

**Columns:**
1. **Merchant** - Business name
2. **Amount** - Total amount (2 decimal places)
3. **Currency** - Currency code (USD, EUR, GBP, etc.)
4. **Date** - Receipt date (MM/DD/YYYY format)
5. **Category** - Expense category
6. **Tax Amount** - Tax amount if available
7. **Payment Method** - How it was paid
8. **Notes** - User notes

**Example:**
```csv
Merchant,Amount,Currency,Date,Category,Tax Amount,Payment Method,Notes
BY 2 COFFEE,129.28,USD,08/09/2025,Food & Dining,8.08,Credit Card,
East Repair Inc.,154.06,USD,02/11/2019,Transportation,9.06,Bank Transfer,
O'Reilly Auto Parts,19.48,USD,02/12/2025,Transportation,,Debit Card,
```

### API Endpoint

**POST** `/api/export/csv`

**Request Body:**
```json
{
  "receipt_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
- Success: CSV file download (200)
- Error: JSON error message (400, 401, 404, 500)

**Error Codes:**
- `401` - Not authenticated
- `400` - No receipt IDs provided or no completed receipts
- `404` - No receipts found (user doesn't own them)
- `500` - Server error

### Usage Example

**Via API:**
```javascript
const response = await fetch('/api/export/csv', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receipt_ids: ['receipt-uuid-1', 'receipt-uuid-2']
  })
})

if (response.ok) {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'receipts-2025-10-05.csv'
  a.click()
}
```

### Features Details

#### 1. Only Completed Receipts
- Pending receipts are excluded
- Processing receipts are excluded
- Failed receipts are excluded
- Only receipts with extracted data are exported

#### 2. Date Sorting
- Receipts sorted by `receipt_date` (oldest first)
- Receipts without dates appear first (timestamp = 0)
- Useful for chronological expense tracking

#### 3. Filename Format
- Pattern: `receipts-YYYY-MM-DD.csv`
- Example: `receipts-2025-10-05.csv`
- Uses today's date (export date)

#### 4. Export Tracking
- All exports logged in `exports` table
- Tracks: user, type (csv/excel), count, filename, timestamp
- Useful for analytics and audit trails

### Security

- ✅ **Authentication Required** - Must be logged in
- ✅ **Ownership Verification** - Only export your own receipts
- ✅ **RLS Enforced** - Database-level security
- ✅ **No Credit Cost** - Unlimited exports

### Database Schema

**exports table:**
```sql
CREATE TABLE exports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL,  -- 'csv' or 'excel'
  receipt_count INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### Migration

Apply this migration to your Supabase database:

```sql
-- From migrations/003_create_exports_table.sql
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'excel')),
  receipt_count INTEGER NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports"
  ON exports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Testing

**Test Cases:**
1. ✅ Export with valid completed receipts
2. ✅ Export with no receipt IDs (should fail)
3. ✅ Export with non-existent IDs (should fail)
4. ✅ Export receipts owned by another user (should fail)
5. ✅ Export with only pending receipts (should fail)
6. ✅ Export with mixed pending/completed (should export only completed)

**Manual Test:**
```bash
# Process a receipt first
curl -X POST https://receiptsort.vercel.app/api/receipts/{id}/process

# Then export
curl -X POST https://receiptsort.vercel.app/api/export/csv \
  -H "Content-Type: application/json" \
  -d '{"receipt_ids": ["receipt-uuid"]}' \
  --output receipts.csv
```

---

## Excel Export

### Features
- ✅ Export receipts to Excel (.xlsx) format
- ✅ Professional formatting with colors
- ✅ Automatic calculations (totals, sums)
- ✅ Summary sheet with statistics
- ✅ Category and month breakdowns
- ✅ Frozen headers and auto-filter
- ✅ Conditional formatting

### Excel Format

**Main Worksheet: "Receipts"**

**Header Row:**
- Blue background (#2563EB)
- White, bold text
- Frozen (stays visible when scrolling)
- Auto-filter enabled

**Data Rows:**
- Alternating light gray background
- Amount/Tax: Currency format ($#,##0.00)
- Date: MM/DD/YYYY format
- Amounts > $100: Bold font
- Auto-width columns

**Total Row:**
- "TOTAL" label in bold
- SUM formulas for Amount and Tax columns
- Double-line border above
- Bold formatting

**Summary Worksheet: "Summary"**

Statistics included:
- Total receipts count
- Total amount spent
- Total tax paid
- Average amount per receipt

Breakdowns:
- **By Category**: Count and total for each category
- **By Month**: Count and total for each month
- Sorted by amount (descending)

### API Endpoint

**POST** `/api/export/excel`

**Request Body:**
```json
{
  "receipt_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
- Success: Excel file download (200)
- Headers:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="receipts-YYYY-MM-DD.xlsx"`

**Error Codes:** (Same as CSV)
- `401` - Not authenticated
- `400` - No receipt IDs or no completed receipts
- `404` - No receipts found
- `500` - Server error

### Usage Example

**Via API:**
```javascript
const response = await fetch('/api/export/excel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receipt_ids: ['receipt-uuid-1', 'receipt-uuid-2']
  })
})

if (response.ok) {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'receipts-2025-10-05.xlsx'
  a.click()
}
```

### Excel Features Details

#### 1. Professional Formatting
- **Header**: Blue background, white bold text
- **Alternating Rows**: Light gray every other row
- **Total Row**: Bold with double-line border
- **Conditional**: Amounts > $100 in bold

#### 2. Automatic Calculations
- **Amount Total**: `=SUM(B2:Bn)`
- **Tax Total**: `=SUM(F2:Fn)`
- **Formulas update** when data changes

#### 3. User Features
- **Frozen Header**: Header stays visible when scrolling
- **Auto-Filter**: Click to filter by any column
- **Auto-Width**: Columns sized to fit content

#### 4. Summary Analytics
- Total receipts, amount, tax, average
- Category breakdown (sorted by total)
- Month breakdown (chronological)

### File Size

**Typical sizes:**
- 10 receipts: ~15 KB
- 100 receipts: ~25 KB
- 1000 receipts: ~150 KB

Well under 1MB for reasonable use cases.

### Testing Checklist

- [x] Excel file downloads successfully
- [x] Opens in Microsoft Excel
- [x] Opens in Google Sheets
- [x] Header formatting correct (blue background, white text)
- [x] Alternating row colors visible
- [x] Amount/Tax formatted as currency
- [x] Date formatted correctly
- [x] Total row calculates correctly
- [x] SUM formulas working
- [x] Auto-filter enabled
- [x] Header frozen when scrolling
- [x] Summary sheet present
- [x] Statistics accurate
- [x] Category breakdown correct
- [x] Month breakdown correct
- [x] File size reasonable

### Comparison: CSV vs Excel

| Feature | CSV | Excel |
|---------|-----|-------|
| File Size | Smaller | Slightly larger |
| Formatting | None | Professional |
| Calculations | No | Yes (formulas) |
| Charts | No | Yes (summary) |
| Filtering | External | Built-in |
| Compatibility | Universal | Excel/Sheets |
| Best For | Data import | Reporting |

---

## Advanced Features (Tasks 4.3 & 4.4)

### Export UI

**Checkbox Selection:**
- Select individual receipts with checkboxes
- "Select All" for completed receipts
- Shows "Export Selected (X)" button
- Only completed receipts are selectable

**Export Dialog:**
- Choose format: Excel or CSV
- Visual format cards with descriptions
- Preview: receipt count, format details
- Loading state during export
- Success/error notifications

**Export History:**
- View at `/exports`
- Shows past exports (type, filename, count, date)
- Logs all exports in database

### Filtering & Bulk Export

**Advanced Filters:**
- **Date Range**: From/To date picker
- **Categories**: Multi-select (Food & Dining, Transportation, etc.)
- **Status**: Multi-select (Pending, Processing, Completed, Failed)
- **Search**: Merchant name or filename
- **Amount Range**: Min/Max amount
- **Filter Badge**: Shows active filter count
- **Collapsible**: Show/Hide filter panel

**Quick Export Presets:**
- **This Month**: Current month receipts
- **Last Month**: Previous month receipts
- **This Year**: Current year receipts
- **Q1/Q2/Q3/Q4**: Quarter exports
- **All Time**: All receipts

**How Presets Work:**
1. Click preset button (e.g., "This Month")
2. System queries receipts in date range
3. Auto-selects matching completed receipts
4. Opens export dialog with selections
5. Choose format and download

**Filter Implementation:**
```typescript
// Applied to Supabase query
if (filters.dateFrom) {
  query = query.gte('receipt_date', filters.dateFrom.toISOString())
}
if (filters.categories.length > 0) {
  query = query.in('category', filters.categories)
}
if (filters.searchQuery) {
  query = query.or(`merchant_name.ilike.%${filters.searchQuery}%,file_name.ilike.%${filters.searchQuery}%`)
}
```

**Security:**
- Always filters by `user_id` (no data leaks)
- RLS policies enforced
- Query performance <2 seconds

### Troubleshooting

**No receipts in export:**
- Ensure receipts are processed (status = 'completed')
- Check receipt ownership (user_id matches)
- Verify receipt_ids are correct UUIDs

**Download not working:**
- Check Content-Type header
- Verify Content-Disposition header
- Ensure browser allows downloads

**Empty CSV:**
- Confirm receipts have extracted data
- Check merchant_name, amount are not null
- Verify date formatting is correct
