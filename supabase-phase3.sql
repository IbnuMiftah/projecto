-- ==========================================================
-- A.M.A.N.A.H — Phase 3: Distribution Engine Schema
-- Run AFTER supabase-phase2.1.sql
-- ==========================================================

-- 1. Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  aid_type TEXT NOT NULL DEFAULT 'food' CHECK (aid_type IN ('food', 'clothing', 'medical', 'financial', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read campaigns"
  ON public.campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert campaigns"
  ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update campaigns"
  ON public.campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated delete campaigns"
  ON public.campaigns FOR DELETE TO authenticated USING (true);

-- 2. Distributions table (one record per beneficiary per campaign)
CREATE TABLE IF NOT EXISTS public.distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  beneficiary_name TEXT NOT NULL,
  beneficiary_fayda_id TEXT,
  distributed_by UUID REFERENCES public.profiles(id),
  distributed_by_name TEXT,
  distributed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, beneficiary_id) -- Prevents duplicate distribution
);

ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read distributions"
  ON public.distributions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert distributions"
  ON public.distributions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated delete distributions"
  ON public.distributions FOR DELETE TO authenticated USING (true);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_distributions_campaign ON public.distributions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_distributions_beneficiary ON public.distributions (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns (status);
