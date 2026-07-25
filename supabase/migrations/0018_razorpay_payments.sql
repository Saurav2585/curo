-- Curo — Razorpay payment integration (implementation)
-- Reuses the existing billing domain (0010), subscriptions (0008), audit (0016)
-- and notifications (0015). Adds only: gateway reference columns for idempotency
-- and three security-definer functions that perform payment side effects
-- atomically. These functions are granted to service_role ONLY — they are called
-- exclusively from trusted server code AFTER the payment signature is verified,
-- so an authenticated user can never self-activate a plan. Run after
-- 0017_appointment_lifecycle.sql.

-- Gateway references on transactions (transactions already exists in 0010).
alter table public.transactions add column if not exists gateway_order_id   text;
alter table public.transactions add column if not exists gateway_payment_id text;

-- Idempotency: a captured payment is recorded at most once.
create unique index if not exists transactions_gateway_payment_uniq
  on public.transactions (gateway_payment_id)
  where gateway_payment_id is not null;

-- ---------------------------------------------------------------- success
-- Atomic activation for a verified payment. Creates a paid invoice + line item,
-- a succeeded transaction, upserts the subscription with fresh monthly lifecycle
-- dates, updates the plan the user holds, and reuses the existing audit +
-- notification foundations. Idempotent on the gateway payment id.
create or replace function public.apply_successful_payment(
  p_user             uuid,
  p_audience         text,      -- 'patient' | 'provider'
  p_plan             text,      -- 'care_plus' | 'pro' | 'clinic'
  p_plan_label       text,
  p_subtotal         numeric,
  p_tax              numeric,
  p_total            numeric,
  p_gateway_order_id text,
  p_gateway_payment_id text,
  p_method           text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_invoice uuid; v_account uuid; v_existing uuid; v_label text; v_action text;
begin
  -- Idempotency: if this payment was already applied, return its invoice.
  select t.invoice_id into v_existing
  from public.transactions t
  where t.gateway_payment_id = p_gateway_payment_id and t.status = 'succeeded'
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select id into v_account from public.billing_accounts where user_id = p_user;
  if v_account is null then
    insert into public.billing_accounts (user_id, account_type)
      values (p_user, case when p_audience = 'provider' then 'provider' else 'patient' end)
      returning id into v_account;
  end if;

  select full_name into v_label from public.profiles where id = p_user;

  insert into public.invoices (
    user_id, billing_account_id, customer_name, customer_type, plan_purchased,
    currency, subtotal, discount_amount, tax_amount, total_amount,
    status, issue_date, due_date, paid_date
  ) values (
    p_user, v_account, v_label,
    case when p_audience = 'provider' then 'provider' else 'patient' end, p_plan_label,
    'INR', p_subtotal, 0, p_tax, p_total,
    'paid', current_date, current_date, current_date
  ) returning id into v_invoice;

  insert into public.invoice_line_items (invoice_id, description, quantity, unit_amount, amount)
    values (v_invoice, p_plan_label || ' — monthly subscription', 1, p_subtotal, p_subtotal);

  insert into public.transactions (
    invoice_id, user_id, amount, currency, method, status,
    gateway_ref, gateway_order_id, gateway_payment_id
  ) values (
    v_invoice, p_user, p_total, 'INR', p_method, 'succeeded',
    p_gateway_payment_id, p_gateway_order_id, p_gateway_payment_id
  );

  -- Subscription: one row per user; refresh monthly lifecycle dates.
  insert into public.subscriptions (
    user_id, audience, plan, billing_cycle,
    current_period_start, current_period_end,
    cancel_at_period_end, cancelled_at, trial_start, trial_end, grace_period_end, updated_at
  ) values (
    p_user, p_audience, p_plan, 'monthly',
    now(), now() + interval '1 month',
    false, null, null, null, null, now()
  )
  on conflict (user_id) do update set
    audience = excluded.audience,
    plan = excluded.plan,
    billing_cycle = 'monthly',
    current_period_start = now(),
    current_period_end = now() + interval '1 month',
    cancel_at_period_end = false,
    cancelled_at = null,
    trial_start = null,
    trial_end = null,
    grace_period_end = null,
    updated_at = now();

  -- The plan the user holds (identity columns the app already reads).
  if p_audience = 'provider' then
    update public.doctors set plan = p_plan where profile_id = p_user;
  else
    update public.profiles set membership_plan = p_plan where id = p_user;
  end if;

  -- Reuse existing foundations: audit trail + in-app notification.
  perform public.record_audit(
    p_event := 'subscription_updated', p_actor := p_user, p_actor_label := v_label,
    p_target_type := 'subscription', p_target_id := null, p_target_label := p_plan_label,
    p_metadata := jsonb_build_object('plan', p_plan, 'total', p_total, 'invoice', v_invoice),
    p_success := true
  );

  v_action := case when p_audience = 'provider' then '/dashboard/billing' else '/account/billing' end;
  perform public.emit_notification(
    p_recipient := p_user, p_event := 'subscription_activated',
    p_title := 'Subscription activated', p_message := p_plan_label || ' is now active.',
    p_action_url := v_action
  );

  return v_invoice;
end;
$$;

-- ---------------------------------------------------------------- failure
-- Stores a failed transaction. The subscription is deliberately left unchanged.
create or replace function public.record_failed_payment(
  p_user uuid, p_amount numeric,
  p_gateway_order_id text, p_gateway_payment_id text, p_reason text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if p_gateway_payment_id is not null then
    select id into v_id from public.transactions where gateway_payment_id = p_gateway_payment_id limit 1;
    if v_id is not null then return v_id; end if;
  end if;

  insert into public.transactions (user_id, amount, currency, status, gateway_ref, gateway_order_id, gateway_payment_id)
    values (p_user, coalesce(p_amount, 0), 'INR', 'failed', p_gateway_payment_id, p_gateway_order_id, p_gateway_payment_id)
    returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------- cancellation
-- Stores a cancelled (dismissed) payment. No subscription change.
create or replace function public.record_cancelled_payment(
  p_user uuid, p_amount numeric, p_gateway_order_id text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.transactions (user_id, amount, currency, status, gateway_order_id)
    values (p_user, coalesce(p_amount, 0), 'INR', 'cancelled', p_gateway_order_id)
    returning id into v_id;
  return v_id;
end;
$$;

-- Only trusted server code (service_role) may invoke these. Authenticated users
-- and anon are explicitly denied, so a plan can never be self-activated.
revoke all on function public.apply_successful_payment(uuid, text, text, text, numeric, numeric, numeric, text, text, text) from public;
revoke all on function public.record_failed_payment(uuid, numeric, text, text, text) from public;
revoke all on function public.record_cancelled_payment(uuid, numeric, text) from public;

grant execute on function public.apply_successful_payment(uuid, text, text, text, numeric, numeric, numeric, text, text, text) to service_role;
grant execute on function public.record_failed_payment(uuid, numeric, text, text, text) to service_role;
grant execute on function public.record_cancelled_payment(uuid, numeric, text) to service_role;
