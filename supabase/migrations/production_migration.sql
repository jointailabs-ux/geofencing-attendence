-- ================================================================
-- GEOATTEND PRODUCTION MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run multiple times (uses IF NOT EXISTS guards)
-- ================================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. NEW COLUMNS ON EXISTING TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Organization settings
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN IF NOT EXISTS weekly_off_day integer NOT NULL DEFAULT 0,  -- 0=Sunday, 1=Monday, etc.
ADD COLUMN IF NOT EXISTS working_hours_start time DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS working_hours_end time DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS logo_url text;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. NEW TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 2a. Audit Logs — tracks all admin/manager actions for accountability
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  actor_id uuid NOT NULL,           -- employee who performed the action
  action text NOT NULL,             -- e.g. 'employee.created', 'leave.approved', 'payroll.finalized'
  target_type text,                 -- e.g. 'employee', 'outlet', 'leave_request', 'payroll_run'
  target_id uuid,                   -- ID of the affected record
  details jsonb DEFAULT '{}',       -- Additional context (old values, new values, etc.)
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.employees(id)
);

-- 2b. Notifications — in-app notification system
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,         -- recipient
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'leave', 'payroll', 'attendance'
  is_read boolean NOT NULL DEFAULT false,
  action_url text,                   -- optional link (e.g. '/staff/leave', '/staff/payslips')
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE
);

-- 2c. Shift Schedules — define shift timings per outlet
CREATE TABLE IF NOT EXISTS public.shift_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  outlet_id uuid,                    -- NULL means org-wide default
  name text NOT NULL,                -- e.g. 'Morning Shift', 'Evening Shift'
  start_time time NOT NULL,          -- e.g. '09:00'
  end_time time NOT NULL,            -- e.g. '18:00'
  grace_minutes integer NOT NULL DEFAULT 15,  -- late arrival grace period
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shift_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT shift_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT shift_schedules_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id)
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Attendance logs: most queried table — indexed for employee+timestamp lookups
CREATE INDEX IF NOT EXISTS idx_attendance_logs_emp_timestamp 
ON public.attendance_logs(employee_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_outlet_timestamp 
ON public.attendance_logs(outlet_id, timestamp DESC);

-- Location pings: queried per employee by created_at
CREATE INDEX IF NOT EXISTS idx_location_pings_emp_created 
ON public.location_pings(employee_id, created_at DESC);

-- Leave requests: queried by employee + status
CREATE INDEX IF NOT EXISTS idx_leave_requests_emp_status 
ON public.leave_requests(employee_id, status);

-- Employees: frequently filtered by org + status
CREATE INDEX IF NOT EXISTS idx_employees_org_status 
ON public.employees(org_id, status);

-- Employees: looked up by auth_user_id on every request
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id 
ON public.employees(auth_user_id);

-- Notifications: queried by employee + unread
CREATE INDEX IF NOT EXISTS idx_notifications_emp_unread 
ON public.notifications(employee_id, is_read) WHERE is_read = false;

-- Audit logs: queried by org + time
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created 
ON public.audit_logs(org_id, created_at DESC);

-- Device registrations: looked up by device_token
CREATE INDEX IF NOT EXISTS idx_device_registrations_token 
ON public.device_registrations(device_token) WHERE is_active = true;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. MISSING UNIQUE CONSTRAINTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Prevent duplicate leave balances per employee per type per year
CREATE UNIQUE INDEX IF NOT EXISTS idx_leave_balances_unique 
ON public.leave_balances(employee_id, leave_type_id, year);

-- Prevent duplicate holidays per org per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_org_date 
ON public.holidays(org_id, date);

-- Prevent duplicate payroll runs per org per month
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_runs_org_month 
ON public.payroll_runs(org_id, month, year);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. ROW-LEVEL SECURITY (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT org_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: get current user's employee role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─── Organizations ────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own org" ON public.organizations
  FOR SELECT USING (id = public.get_my_org_id());

-- ─── Outlets ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can view outlets in their org" ON public.outlets
  FOR SELECT USING (org_id = public.get_my_org_id());

CREATE POLICY "Admins can manage outlets" ON public.outlets
  FOR ALL USING (org_id = public.get_my_org_id() AND public.get_my_role() = 'super_admin');

-- ─── Employees ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view employees in their org" ON public.employees
  FOR SELECT USING (org_id = public.get_my_org_id());

CREATE POLICY "Users can update their own record" ON public.employees
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage employees" ON public.employees
  FOR ALL USING (org_id = public.get_my_org_id() AND public.get_my_role() IN ('super_admin', 'manager'));

-- ─── Attendance Logs ──────────────────────────────────────────────────────
CREATE POLICY "Users can view attendance in their org" ON public.attendance_logs
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE org_id = public.get_my_org_id())
  );

CREATE POLICY "Users can insert their own attendance" ON public.attendance_logs
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
  );

-- ─── Leave Types ──────────────────────────────────────────────────────────
CREATE POLICY "Users can view leave types in their org" ON public.leave_types
  FOR SELECT USING (org_id = public.get_my_org_id());

-- ─── Leave Balances ───────────────────────────────────────────────────────
CREATE POLICY "Users can view leave balances in their org" ON public.leave_balances
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE org_id = public.get_my_org_id())
  );

CREATE POLICY "Users can manage their own leave balances" ON public.leave_balances
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
  );

-- ─── Leave Requests ──────────────────────────────────────────────────────
CREATE POLICY "Users can view leave requests in their org" ON public.leave_requests
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE org_id = public.get_my_org_id())
  );

CREATE POLICY "Users can insert their own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins/managers can update leave requests" ON public.leave_requests
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE org_id = public.get_my_org_id())
    AND public.get_my_role() IN ('super_admin', 'manager')
  );

-- ─── Holidays ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view holidays in their org" ON public.holidays
  FOR SELECT USING (org_id = public.get_my_org_id());

-- ─── Payroll Runs ─────────────────────────────────────────────────────────
CREATE POLICY "Users can view payroll runs in their org" ON public.payroll_runs
  FOR SELECT USING (org_id = public.get_my_org_id());

CREATE POLICY "Admins can manage payroll" ON public.payroll_runs
  FOR ALL USING (org_id = public.get_my_org_id() AND public.get_my_role() = 'super_admin');

-- ─── Payroll Line Items ───────────────────────────────────────────────────
CREATE POLICY "Users can view their own payslips" ON public.payroll_line_items
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
    OR public.get_my_role() = 'super_admin'
  );

-- ─── Location Pings ──────────────────────────────────────────────────────
CREATE POLICY "Admins can view location pings" ON public.location_pings
  FOR SELECT USING (
    public.get_my_role() IN ('super_admin', 'manager')
    AND employee_id IN (SELECT id FROM public.employees WHERE org_id = public.get_my_org_id())
  );

-- ─── Device Registrations ─────────────────────────────────────────────────
CREATE POLICY "Users can view devices in their org" ON public.device_registrations
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE org_id = public.get_my_org_id())
  );

-- ─── Notifications ────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
  );

-- ─── Audit Logs ───────────────────────────────────────────────────────────
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (org_id = public.get_my_org_id() AND public.get_my_role() = 'super_admin');

-- ─── Shift Schedules ──────────────────────────────────────────────────────
CREATE POLICY "Users can view shifts in their org" ON public.shift_schedules
  FOR SELECT USING (org_id = public.get_my_org_id());

CREATE POLICY "Admins can manage shifts" ON public.shift_schedules
  FOR ALL USING (org_id = public.get_my_org_id() AND public.get_my_role() = 'super_admin');


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. JWT ROLE SYNC (fixes the cookie security issue)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- This function writes the employee role into Supabase JWT claims
-- so the middleware can read it securely without relying on a cookie.
CREATE OR REPLACE FUNCTION public.handle_employee_role_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When an employee's role changes, update the auth user's app_metadata
  IF NEW.auth_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', NEW.role::text,
        'org_id', NEW.org_id::text,
        'employee_id', NEW.id::text
      )
    WHERE id = NEW.auth_user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on INSERT and UPDATE of employees
DROP TRIGGER IF EXISTS on_employee_role_change ON public.employees;
CREATE TRIGGER on_employee_role_change
  AFTER INSERT OR UPDATE OF role, org_id ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_role_sync();

-- Backfill: Sync existing employees' roles into JWT claims
DO $$
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN SELECT id, auth_user_id, role, org_id FROM public.employees WHERE auth_user_id IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', emp.role::text,
        'org_id', emp.org_id::text,
        'employee_id', emp.id::text
      )
    WHERE id = emp.auth_user_id;
  END LOOP;
END;
$$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. NOTIFICATION HELPER FUNCTION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.create_notification(
  p_employee_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.notifications (employee_id, title, message, type, action_url)
  VALUES (p_employee_id, p_title, p_message, p_type, p_action_url)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Summary of what was created:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ 5 new columns on organizations
-- ✅ 3 new tables: audit_logs, notifications, shift_schedules
-- ✅ 10 performance indexes
-- ✅ 3 unique constraints
-- ✅ RLS enabled on all 15 tables with proper policies
-- ✅ JWT role sync trigger (security fix)
-- ✅ Notification helper function
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
