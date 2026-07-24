-- Curo — subscription lifecycle records
-- Additive only. Holds the DATE metadata a real subscription needs, so future
-- Razorpay integration only has to write dates here — the app derives every
-- lifecycle state from them (see lib/lifecycle.ts). Enforces nothing.
--
-- One row per user (patient or provider). Empty until billing exists; the app
-- falls back to sensible defaults (doctor trial from doctors.trial_ends_at,
-- patient Free) when no row is present.
--
-- Run after 0007_patient_plan_care_plus.sql.

create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references auth.users(id) on delete cascade,
  audience             text not null check (audience in ('patient', 'provider')),
  plan                 text not null,
  billing_cycle        text check (billing_cycle in ('monthly', 'yearly')),
  -- lifecycle dates (all nullable — the derivation handles any combination)
  trial_start          timestamptz,
  trial_end            timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,   -- the renewal date
  grace_period_end     timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_read_own  on public.subscriptions;
drop policy if exists subscriptions_admin_all on public.subscriptions;

create policy subscriptions_read_own on public.subscriptions
  for select using (auth.uid() = user_id);

create policy subscriptions_admin_all on public.subscriptions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
