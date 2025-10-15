-- =====================================================================
-- Phase 3: Medical Receipts - Database Migration
-- =====================================================================
-- Date: 2025-10-15
-- Purpose: Add 6 medical-specific fields to support insurance reimbursement
--          and healthcare expense tracking
-- =====================================================================

-- Add Phase 3 medical fields to receipts table
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS patient_dob DATE,
  ADD COLUMN IF NOT EXISTS treatment_date DATE,
  ADD COLUMN IF NOT EXISTS insurance_claim_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS diagnosis_codes TEXT,
  ADD COLUMN IF NOT EXISTS procedure_codes TEXT,
  ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN receipts.patient_dob IS 'Phase 3: Patient date of birth (for medical invoices)';
COMMENT ON COLUMN receipts.treatment_date IS 'Phase 3: Actual treatment/service date (for medical invoices)';
COMMENT ON COLUMN receipts.insurance_claim_number IS 'Phase 3: Insurance claim reference number';
COMMENT ON COLUMN receipts.diagnosis_codes IS 'Phase 3: ICD diagnosis codes (comma-separated)';
COMMENT ON COLUMN receipts.procedure_codes IS 'Phase 3: CPT/treatment procedure codes (comma-separated)';
COMMENT ON COLUMN receipts.provider_id IS 'Phase 3: Healthcare provider ID (AGB code in Netherlands, NPI in USA)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_receipts_treatment_date ON receipts(treatment_date);
CREATE INDEX IF NOT EXISTS idx_receipts_provider_id ON receipts(provider_id);
CREATE INDEX IF NOT EXISTS idx_receipts_insurance_claim ON receipts(insurance_claim_number);

-- =====================================================================
-- Phase 3 Fields Summary
-- =====================================================================
-- 1. patient_dob               DATE         - Patient date of birth
-- 2. treatment_date            DATE         - Treatment/service date
-- 3. insurance_claim_number    VARCHAR(100) - Insurance claim reference
-- 4. diagnosis_codes           TEXT         - ICD codes (comma-separated)
-- 5. procedure_codes           TEXT         - CPT codes (comma-separated)
-- 6. provider_id               VARCHAR(100) - AGB/NPI/Provider ID
-- =====================================================================

-- Verify migration
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'receipts'
  AND column_name IN (
    'patient_dob',
    'treatment_date',
    'insurance_claim_number',
    'diagnosis_codes',
    'procedure_codes',
    'provider_id'
  )
ORDER BY column_name;
