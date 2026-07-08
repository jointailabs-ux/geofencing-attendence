-- Migration: Add employee_code column and unique index
-- Run this in your Supabase SQL editor

-- Add human-readable employee code
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code TEXT;

-- Create unique index on employee_code within org (allows null but prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_code_org 
ON employees(org_id, employee_code) 
WHERE employee_code IS NOT NULL;

-- Backfill existing employees with auto-generated codes
UPDATE employees 
SET employee_code = 'EMP' || LPAD(ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at)::TEXT, 3, '0')
WHERE employee_code IS NULL;
