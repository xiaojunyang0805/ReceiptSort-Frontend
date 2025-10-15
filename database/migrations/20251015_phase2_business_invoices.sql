-- Phase 2: Business Invoices Migration
-- Add line items support and additional invoice fields
-- Date: 2025-10-15
-- Description: Extends receipt schema to support detailed line items for invoices,
--              purchase orders, payment references, and vendor tax IDs

-- ========================================
-- Step 1: Add Phase 2 fields to receipts table
-- ========================================

-- Add business invoice specific fields (all nullable for backward compatibility)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vendor_tax_id VARCHAR(50);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_receipts_purchase_order_number ON receipts(purchase_order_number);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_reference ON receipts(payment_reference);

-- Add comments for documentation
COMMENT ON COLUMN receipts.purchase_order_number IS 'Purchase order number for business invoices';
COMMENT ON COLUMN receipts.payment_reference IS 'Transaction ID, check number, or payment reference';
COMMENT ON COLUMN receipts.vendor_tax_id IS 'Vendor VAT/Tax ID/EIN/BTW number';

-- ========================================
-- Step 2: Create receipt_line_items table
-- ========================================

CREATE TABLE IF NOT EXISTS receipt_line_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to receipts table
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,

  -- Line item details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,

  -- Optional fields
  item_code VARCHAR(100), -- SKU, product code, treatment code, CPT code
  tax_rate DECIMAL(5,2), -- Tax rate as percentage (e.g., 21.00 for 21%)

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_line_items_receipt_id ON receipt_line_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_line_items_line_number ON receipt_line_items(receipt_id, line_number);

-- Add comments for documentation
COMMENT ON TABLE receipt_line_items IS 'Line-by-line breakdown of receipt/invoice items';
COMMENT ON COLUMN receipt_line_items.line_number IS 'Sequential line number within the receipt (1, 2, 3...)';
COMMENT ON COLUMN receipt_line_items.description IS 'Item description or service description';
COMMENT ON COLUMN receipt_line_items.quantity IS 'Quantity purchased (default 1.00)';
COMMENT ON COLUMN receipt_line_items.unit_price IS 'Price per unit (excluding tax)';
COMMENT ON COLUMN receipt_line_items.line_total IS 'Total for this line (quantity × unit_price, may include tax)';
COMMENT ON COLUMN receipt_line_items.item_code IS 'Product SKU, treatment code, CPT code, or item identifier';
COMMENT ON COLUMN receipt_line_items.tax_rate IS 'Tax rate percentage applied to this line item';

-- ========================================
-- Step 3: Enable Row Level Security (RLS)
-- ========================================

-- Enable RLS on line items table
ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access line items from their own receipts
CREATE POLICY "Users can view their own receipt line items"
  ON receipt_line_items
  FOR SELECT
  USING (
    receipt_id IN (
      SELECT id FROM receipts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert line items for their own receipts"
  ON receipt_line_items
  FOR INSERT
  WITH CHECK (
    receipt_id IN (
      SELECT id FROM receipts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own receipt line items"
  ON receipt_line_items
  FOR UPDATE
  USING (
    receipt_id IN (
      SELECT id FROM receipts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own receipt line items"
  ON receipt_line_items
  FOR DELETE
  USING (
    receipt_id IN (
      SELECT id FROM receipts WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- Step 4: Create helper function for updated_at
-- ========================================

-- Create or replace function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for receipt_line_items
DROP TRIGGER IF EXISTS update_receipt_line_items_updated_at ON receipt_line_items;
CREATE TRIGGER update_receipt_line_items_updated_at
  BEFORE UPDATE ON receipt_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Verification Queries
-- ========================================

-- Verify new columns in receipts table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'receipts'
-- AND column_name IN ('purchase_order_number', 'payment_reference', 'vendor_tax_id')
-- ORDER BY column_name;

-- Verify receipt_line_items table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'receipt_line_items'
-- ORDER BY ordinal_position;

-- Verify RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'receipt_line_items';

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('receipts', 'receipt_line_items')
-- AND indexname LIKE '%phase2%' OR indexname LIKE '%line_items%';
