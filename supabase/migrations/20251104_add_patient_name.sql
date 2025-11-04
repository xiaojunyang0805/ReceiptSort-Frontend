-- Add patient_name field to receipts table for medical invoices
-- Migration: Add patient name for medical records

ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS patient_name TEXT NULL;

COMMENT ON COLUMN receipts.patient_name IS 'Patient name for medical invoices (Phase 3 medical fields)';
