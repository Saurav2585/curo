-- Curo — subscription foundation (no billing integration yet)
-- Additive only. Adds plan state to patients and providers. Enforces nothing:
-- booking remains free and unlimited; these columns are for display and future
-- billing. Touches no existing relationship or policy.
--
-- Run in Supabase Studio → SQL Editor after 0005_provider_application_full.sql.

-- Patient membership tier.
alter table public.profiles
  add column if not exists membership_plan text not null default 'free'
    check (membership_plan in ('free', 'plus', 'plus_family'));

-- Provider plan + trial. Existing doctors receive a 30-day trial from now, so
-- the demo shows an active trial immediately.
alter table public.doctors
  add column if not exists plan text not null default 'trial'
    check (plan in ('trial', 'free', 'pro', 'clinic', 'enterprise')),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '30 days');
