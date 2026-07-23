-- ================================================================
-- SUPABASE SQL MIGRATION FOR PAYROLL & MEDICLAIM DEDUCTIONS
-- Execute this query in your Supabase SQL Editor:
-- ================================================================

-- 1. Add mediclaim_pct to organizations table (default 10%)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS mediclaim_pct numeric NOT NULL DEFAULT 10;

-- 2. Add mediclaim_pct and mediclaim_deduction to payroll_line_items table
ALTER TABLE public.payroll_line_items 
ADD COLUMN IF NOT EXISTS mediclaim_pct numeric NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS mediclaim_deduction numeric NOT NULL DEFAULT 0;

-- 3. Add custom per-employee mediclaim_pct override if applicable
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS mediclaim_pct numeric DEFAULT NULL;
