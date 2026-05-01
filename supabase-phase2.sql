-- ==========================================================
-- A.M.A.N.A.H — Phase 2 Database Schema
-- Run this in Supabase SQL Editor AFTER Phase 1 tables exist
-- ==========================================================

-- 1. Members table (NGO paying members / donors)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  membership_plan TEXT DEFAULT 'basic' CHECK (membership_plan IN ('basic', 'standard', 'premium')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'exempt')),
  payment_amount DECIMAL(10,2) DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  registered_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Beneficiaries table (aid recipients)
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  fayda_id TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  kebele TEXT,
  woreda TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'orphan', 'elderly', 'disabled', 'widow', 'displaced')),
  household_size INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'flagged', 'duplicate')),
  notes TEXT,
  photo_url TEXT,
  registered_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Simple RLS for both tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- Members: all authenticated can read, only authenticated can insert/update
CREATE POLICY "Authenticated read members"
  ON public.members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update members"
  ON public.members FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete members"
  ON public.members FOR DELETE TO authenticated USING (true);

-- Beneficiaries: same pattern
CREATE POLICY "Authenticated read beneficiaries"
  ON public.beneficiaries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert beneficiaries"
  ON public.beneficiaries FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update beneficiaries"
  ON public.beneficiaries FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete beneficiaries"
  ON public.beneficiaries FOR DELETE TO authenticated USING (true);

-- 4. Create indexes for search
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members (phone);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_name ON public.beneficiaries USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_beneficiaries_fayda ON public.beneficiaries (fayda_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_phone ON public.beneficiaries (phone);
