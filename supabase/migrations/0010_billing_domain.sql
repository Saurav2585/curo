-- Curo — billing domain (architecture only, no payment processing)
-- Additive. Reusable entities Razorpay will later consume. Nothing here charges,
-- tokenises, or contacts a gateway; payment methods and transactions are
-- placeholders. Run after 0009_promotions.sql.

-- ---------------------------------------------------------------- billing account (+ tax)
create table if not exists public.billing_accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  account_type text not null default 'patient' check (account_type in ('patient', 'provider', 'enterprise')),
  legal_name   text,
  email        text,
  phone        text,
  -- tax information
  gst_number   text,
  pan          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- billing address
create table if not exists public.billing_addresses (
  id                 uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts(id) on delete cascade,
  line1   text,
  line2   text,
  city    text,
  state   text,
  pin_code text,
  country text not null default 'India',
  is_default boolean not null default true
);

-- ---------------------------------------------------------------- invoices
create sequence if not exists curo_invoice_seq;

create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  invoice_number   text not null unique default ('CURO-INV-' || lpad(nextval('curo_invoice_seq')::text, 6, '0')),
  user_id          uuid not null references auth.users(id) on delete cascade,
  billing_account_id uuid references public.billing_accounts(id) on delete set null,

  customer_name    text,
  customer_type    text check (customer_type in ('patient', 'provider', 'enterprise')),
  gst_number       text,
  billing_address  text,               -- snapshot at issue time

  plan_purchased   text,
  promotion_id     uuid references public.promotions(id) on delete set null,
  coupon_code      text,

  currency         text not null default 'INR',
  subtotal         numeric(12,2) not null default 0,
  discount_amount  numeric(12,2) not null default 0,
  tax_amount       numeric(12,2) not null default 0,
  total_amount     numeric(12,2) not null default 0,

  status           text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'void', 'overdue')),
  issue_date       date,
  due_date         date,
  paid_date        date,
  created_at       timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices (user_id, created_at desc);

-- ---------------------------------------------------------------- invoice line items
create table if not exists public.invoice_line_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity    int not null default 1,
  unit_amount numeric(12,2) not null default 0,
  amount      numeric(12,2) not null default 0
);

-- ---------------------------------------------------------------- credit notes (future)
create table if not exists public.credit_notes (
  id             uuid primary key default gen_random_uuid(),
  credit_number  text not null unique default ('CURO-CN-' || lpad(nextval('curo_invoice_seq')::text, 6, '0')),
  invoice_id     uuid references public.invoices(id) on delete set null,
  user_id        uuid not null references auth.users(id) on delete cascade,
  amount         numeric(12,2) not null default 0,
  reason         text,
  status         text not null default 'issued' check (status in ('issued', 'applied', 'cancelled')),
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------- payment methods (placeholder)
create table if not exists public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('upi', 'credit_card', 'debit_card', 'net_banking')),
  label      text,             -- masked display label; NEVER real card data
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- transactions (placeholder)
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid references public.invoices(id) on delete set null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(12,2) not null default 0,
  currency    text not null default 'INR',
  method      text check (method in ('upi', 'credit_card', 'debit_card', 'net_banking')),
  status      text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  gateway_ref text,            -- filled by Razorpay later
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS: owner reads own, admin all
alter table public.billing_accounts   enable row level security;
alter table public.billing_addresses  enable row level security;
alter table public.invoices           enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.credit_notes       enable row level security;
alter table public.payment_methods    enable row level security;
alter table public.transactions       enable row level security;

do $$ begin
  -- direct-owner tables
  create policy billing_accounts_own on public.billing_accounts for select using (auth.uid() = user_id);
  create policy invoices_own         on public.invoices         for select using (auth.uid() = user_id);
  create policy credit_notes_own     on public.credit_notes     for select using (auth.uid() = user_id);
  create policy payment_methods_own  on public.payment_methods  for select using (auth.uid() = user_id);
  create policy transactions_own     on public.transactions     for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  -- child tables via their parent's owner
  create policy billing_addresses_own on public.billing_addresses for select using (
    exists (select 1 from public.billing_accounts a where a.id = billing_addresses.billing_account_id and a.user_id = auth.uid()));
  create policy invoice_items_own on public.invoice_line_items for select using (
    exists (select 1 from public.invoices i where i.id = invoice_line_items.invoice_id and i.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  -- admin full access
  create policy billing_accounts_admin   on public.billing_accounts   for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  create policy invoices_admin           on public.invoices           for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  create policy invoice_items_admin      on public.invoice_line_items for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  create policy credit_notes_admin       on public.credit_notes       for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  create policy payment_methods_admin    on public.payment_methods    for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  create policy transactions_admin       on public.transactions       for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  create policy billing_addresses_admin  on public.billing_addresses  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
exception when duplicate_object then null; end $$;
