-- ==========================================================
-- A.M.A.N.A.H — Phase 2.1 Schema Updates
-- Run AFTER supabase-phase2.sql
-- ==========================================================

-- 1. Add FAYDA ID to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS fayda_id TEXT UNIQUE;

-- 2. Drop OLD constraint first (so we can update values freely)
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_membership_plan_check;

-- 3. Update existing membership_plan values to new options
UPDATE public.members SET membership_plan = 'weekly' WHERE membership_plan = 'basic';
UPDATE public.members SET membership_plan = 'monthly' WHERE membership_plan = 'standard';
UPDATE public.members SET membership_plan = 'yearly' WHERE membership_plan = 'premium';
-- Catch-all: set anything else to 'monthly'
UPDATE public.members SET membership_plan = 'monthly' WHERE membership_plan NOT IN ('weekly', 'monthly', 'yearly');

-- 4. Add new constraint
ALTER TABLE public.members ADD CONSTRAINT members_membership_plan_check
  CHECK (membership_plan IN ('weekly', 'monthly', 'yearly'));

-- 4. Remove status column (payment_status is sufficient)
ALTER TABLE public.members DROP COLUMN IF EXISTS status;

-- 5. Add payment_method and last_payment_date columns for quick payment tracking
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'mobile'));

-- 6. Create payment_logs table for recent collection activity
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'mobile')),
  collected_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read payment_logs"
  ON public.payment_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert payment_logs"
  ON public.payment_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- 7. Index for FAYDA ID on members
CREATE INDEX IF NOT EXISTS idx_members_fayda ON public.members (fayda_id);
