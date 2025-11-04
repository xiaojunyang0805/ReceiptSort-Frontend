-- Add insurance coverage fields for medical receipts
-- Migration: 20251104_add_insurance_coverage_fields.sql
--
-- This migration adds support for healthcare insurance coverage amounts
-- commonly found on medical invoices in Netherlands and USA.
--
-- Example use case:
-- Total: €91.04
-- Paid by insurance: €68.28
-- Patient responsibility: €22.76

ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS insurance_covered_amount DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS patient_responsibility_amount DECIMAL(10,2) NULL;

COMMENT ON COLUMN receipts.insurance_covered_amount IS
  'Amount paid/covered by health insurance (for medical receipts). Dutch: "Betaald door uw zorgverzekeraar"';

COMMENT ON COLUMN receipts.patient_responsibility_amount IS
  'Amount patient must pay after insurance deduction (for medical receipts). Dutch: "Nog door u te betalen"';

-- Add check constraints to ensure amounts are non-negative if present
ALTER TABLE receipts
ADD CONSTRAINT insurance_covered_amount_positive
  CHECK (insurance_covered_amount IS NULL OR insurance_covered_amount >= 0);

ALTER TABLE receipts
ADD CONSTRAINT patient_responsibility_amount_positive
  CHECK (patient_responsibility_amount IS NULL OR patient_responsibility_amount >= 0);
