-- Curo — promotion & coupon engine
-- Additive only. A record-driven promotions catalogue: future campaigns are a
-- new row, not new code. Display + eligibility only — no redemption, no payment.
--
-- Run after 0008_subscriptions.sql.

create table if not exists public.promotions (
  id             uuid primary key default gen_random_uuid(),
  code           text,                       -- optional coupon code to display
  title          text not null,
  description    text not null,

  -- extensible types (stored as text so new kinds need no enum change)
  promo_type     text not null,              -- welcome | referral | festival | limited_time | membership_upgrade | provider_subscription | ...
  coupon_type    text not null,              -- percentage | fixed | trial_extension | extra_appointments | lab_discount | provider_discount
  value          numeric not null default 0, -- percent, amount, days or count depending on coupon_type

  -- who / where it shows
  audience       text not null default 'patient' check (audience in ('patient', 'provider', 'both')),
  placements     text[] not null default '{}', -- e.g. {landing, membership, billing, trial}

  -- validation rules
  valid_from     timestamptz,
  valid_until    timestamptz,
  max_uses       int,                         -- future redemption cap
  per_user_limit int,                         -- future per-user cap
  uses_count     int not null default 0,
  eligible_plans text[] not null default '{}', -- empty = any plan
  eligible_roles text[] not null default '{}', -- empty = any role
  eligible_products text[] not null default '{}', -- empty = any product

  active         boolean not null default true,
  priority       int not null default 0,      -- higher wins; only the top promo shows

  created_at     timestamptz not null default now()
);

create index if not exists promotions_active_idx on public.promotions (active, priority desc);

-- Read policy: anyone (including anonymous visitors on the landing page) may
-- read ACTIVE promotions. Provider pricing is kept out of public view by the
-- server queries (which never request provider promos on public pages), not by
-- exposing raw rows.
alter table public.promotions enable row level security;

drop policy if exists promotions_read_active on public.promotions;
drop policy if exists promotions_admin_all   on public.promotions;

create policy promotions_read_active on public.promotions
  for select using (active = true);

create policy promotions_admin_all on public.promotions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------- sample records
-- Two live examples so the engine is visibly working. Delete or edit freely.
insert into public.promotions
  (code, title, description, promo_type, coupon_type, value, audience, placements,
   eligible_plans, eligible_roles, priority)
values
  ('WELCOME20', 'Welcome to Curo',
   'New here? Enjoy 20% off your first month of Care+.',
   'welcome', 'percentage', 20, 'patient',
   array['landing', 'membership'], array['free'], array[]::text[], 10),

  ('FOUNDER50', 'Founding provider offer',
   'Founding clinics get 50% off Professional for the first year.',
   'provider_subscription', 'provider_discount', 50, 'provider',
   array['billing', 'trial'], array[]::text[], array['doctor'], 10)
on conflict do nothing;
