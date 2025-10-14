# Enhanced Receipt Data Schema Proposal

## Executive Summary

This proposal extends ReceiptSort to support comprehensive data extraction for:
- **Medical receipts/invoices** (insurance reimbursement)
- **Business invoices** (accounting/bookkeeping)
- **General receipts** (expense tracking)

## Current Schema (Basic)

```
✅ merchant_name
✅ total_amount
✅ currency
✅ receipt_date
✅ category
✅ tax_amount
✅ payment_method
✅ notes
✅ confidence_score
```

## Proposed Enhanced Schema

### Core Fields (Keep Current)
- merchant_name
- total_amount
- currency
- receipt_date
- category
- tax_amount
- payment_method
- notes
- confidence_score

### NEW: Document Metadata
```sql
document_type           VARCHAR(50)  -- 'receipt', 'invoice', 'medical_invoice', 'bill'
invoice_number          VARCHAR(100) -- Invoice/receipt number
due_date                DATE         -- Payment due date (for invoices)
purchase_order_number   VARCHAR(100) -- PO number (for business invoices)
```

### NEW: Provider/Vendor Details
```sql
vendor_address          TEXT         -- Full address
vendor_phone            VARCHAR(50)  -- Contact phone
vendor_email            VARCHAR(100) -- Contact email
vendor_tax_id           VARCHAR(50)  -- VAT/Tax ID/EIN
vendor_registration_no  VARCHAR(100) -- Business registration (KvK, etc.)
```

### NEW: Customer/Patient Information (Optional, for invoices)
```sql
customer_name           VARCHAR(255) -- Patient name / Bill-to name
customer_reference      VARCHAR(100) -- Customer ID / Patient ID / BSN
customer_address        TEXT         -- Billing address
```

### NEW: Line Items (Separate Table)
```sql
CREATE TABLE receipt_line_items (
  id                  UUID PRIMARY KEY
  receipt_id          UUID REFERENCES receipts(id)
  line_number         INTEGER
  description         TEXT
  quantity            DECIMAL(10,2)
  unit_price          DECIMAL(10,2)
  line_total          DECIMAL(10,2)
  item_code           VARCHAR(100)  -- SKU / Treatment code / CPT code
  tax_rate            DECIMAL(5,2)
  created_at          TIMESTAMP
)
```

### NEW: Medical-Specific Fields
```sql
treatment_date          DATE         -- Actual treatment/service date
patient_dob             DATE         -- Patient date of birth
insurance_claim_number  VARCHAR(100) -- Insurance claim reference
diagnosis_codes         TEXT         -- ICD codes (comma-separated)
procedure_codes         TEXT         -- CPT codes (comma-separated)
provider_id             VARCHAR(100) -- AGB code / NPI / Provider ID
```

### NEW: Payment Details
```sql
subtotal                DECIMAL(10,2) -- Amount before tax
discount_amount         DECIMAL(10,2) -- Discounts applied
tip_amount              DECIMAL(10,2) -- Tips (for restaurant receipts)
payment_reference       VARCHAR(100)  -- Transaction ID / Check number
payment_status          VARCHAR(50)   -- 'paid', 'pending', 'overdue'
```

## Priority Implementation Phases

### Phase 1: ESSENTIAL (Immediate Value) 🔴
**Impact: High | Complexity: Low**

```sql
-- Add to existing receipts table
ALTER TABLE receipts ADD COLUMN:
- invoice_number         VARCHAR(100)
- document_type          VARCHAR(50) DEFAULT 'receipt'
- subtotal              DECIMAL(10,2)
- vendor_address        TEXT
- due_date              DATE
```

**Value:** Covers 80% of use cases (invoices, business receipts, medical bills)

### Phase 2: BUSINESS INVOICES 🟡
**Impact: Medium | Complexity: Medium**

```sql
-- Line items table for detailed invoicing
CREATE TABLE receipt_line_items (...)

-- Additional invoice fields
- purchase_order_number
- payment_reference
- vendor_tax_id
```

**Value:** Full business accounting integration (QuickBooks, Xero)

### Phase 3: MEDICAL RECEIPTS 🟢
**Impact: Medium | Complexity: Medium**

```sql
-- Medical-specific fields
- patient_dob
- treatment_date
- insurance_claim_number
- diagnosis_codes
- procedure_codes
- provider_id
```

**Value:** Insurance reimbursement, healthcare expense tracking

## Recommended Approach

### Option A: SMART EXTRACTION (Recommended) ⭐
**Extract all fields, show only relevant ones based on document_type**

**Advantages:**
- User doesn't need to categorize upfront
- AI detects document type automatically
- Future-proof for new document types
- Flexible UI (show/hide fields based on type)

**Implementation:**
```typescript
// AI extracts ALL possible fields
// UI displays based on document_type:

if (document_type === 'medical_invoice') {
  show: [patient_dob, treatment_date, provider_id, insurance_claim_number]
  hide: [purchase_order_number, tip_amount]
}

if (document_type === 'business_invoice') {
  show: [invoice_number, line_items, due_date, PO_number]
  hide: [patient_dob, diagnosis_codes]
}

if (document_type === 'receipt') {
  show: [merchant, amount, date, category]
  hide: [line_items, patient_info]
}
```

### Option B: MINIMAL EXTENSION
**Add only 5-6 most valuable fields**

- invoice_number
- subtotal (amount before tax)
- vendor_address
- due_date
- line_items (JSON field, not separate table)

**Advantages:**
- Simple migration
- Faster to implement
- Less storage

## Data Privacy Considerations

### GDPR/HIPAA Compliance
For medical receipts containing patient information:
- ✅ Encrypt patient_dob, customer_name, customer_reference
- ✅ Add auto-deletion after 90 days (already implemented)
- ✅ Allow users to redact sensitive fields
- ✅ Add export/delete personal data functionality

## UI/UX Design

### Smart Form Layout
```
┌─ Receipt Details ─────────────────────────┐
│ Document Type: [Medical Invoice ▼]        │
│                                            │
│ === Basic Info ===                         │
│ Merchant: Infomedics                       │
│ Invoice #: 5227 4217 0820 71              │
│ Date: 2025-09-24                           │
│ Due Date: 2025-10-24                       │
│                                            │
│ === Financial ===                          │
│ Subtotal: €52.14                           │
│ Tax: €0.00                                 │
│ Total: €52.14                              │
│                                            │
│ === Medical Details === (shown only for medical)
│ Patient: C Lyu                             │
│ DOB: 1962-05-06                           │
│ Treatment Date: 2025-09-18                │
│ Provider ID: 12065201                      │
│ Insurance Claim: [blank]                   │
│                                            │
│ === Line Items === (expandable)           │
│ ┌─────────────────────────────────────┐  │
│ │ F517A - Beugconsult per kalender... │  │
│ │ Qty: 1 × €52.14 = €52.14           │  │
│ └─────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Export Enhancements

### Enhanced Excel/CSV Export
```
Current columns:
Merchant | Amount | Date | Category

Enhanced columns:
Invoice# | Type | Merchant | Vendor Address | Date | Due Date |
Subtotal | Tax | Total | Patient | Treatment | Line Items | Notes
```

### Export Formats by Use Case
1. **Tax/Accounting Export** - For bookkeeping software
2. **Insurance Reimbursement Export** - For medical claims
3. **Expense Report Export** - For corporate reimbursement

## Migration Strategy

### Database Migration
```sql
-- Step 1: Add new columns (nullable)
ALTER TABLE receipts ADD COLUMN invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN document_type VARCHAR(50) DEFAULT 'receipt';
ALTER TABLE receipts ADD COLUMN subtotal DECIMAL(10,2);
-- ... etc

-- Step 2: Backfill existing data (optional)
UPDATE receipts SET document_type = 'receipt' WHERE document_type IS NULL;

-- Step 3: Create line items table
CREATE TABLE receipt_line_items (...);
```

### Backward Compatibility
- ✅ Existing receipts continue to work
- ✅ New fields are optional (nullable)
- ✅ Old export format still available
- ✅ UI gracefully handles missing data

## Cost-Benefit Analysis

### Development Effort
- Phase 1 (Essential): **2-3 days**
  - Database migration
  - Update OpenAI extraction prompt
  - Update UI forms
  - Update export logic

- Phase 2 (Line Items): **3-4 days**
  - Create line items table
  - Update extraction logic
  - Create line items UI component
  - Update export to include line items

- Phase 3 (Medical): **2 days**
  - Add medical fields
  - Update extraction prompt for medical terms
  - Update UI for medical view

### User Value
- **Medical users**: Insurance reimbursement (HIGH value)
- **Business users**: Accounting integration (HIGH value)
- **Personal users**: Better organization (MEDIUM value)

## Recommendation

**START WITH PHASE 1** - Essential fields that provide immediate value:

1. Add 5 key fields:
   - `invoice_number`
   - `document_type`
   - `subtotal`
   - `vendor_address`
   - `due_date`

2. Update extraction prompt to capture these fields

3. Update UI to display them conditionally

4. Update exports to include them

**Then evaluate user feedback** before implementing Phase 2 & 3.

---

**Decision needed:** Which approach do you prefer?
- Option A: Smart extraction (all fields, conditional display)
- Option B: Minimal extension (5-6 essential fields only)
