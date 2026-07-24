-- Curo — allow the canonical 'care_plus' patient plan value.
-- Additive/safe: widens the existing check to accept 'care_plus' while keeping
-- the older values so no existing row can violate the constraint.
-- Run after 0006_subscription_foundation.sql.

alter table public.profiles
  drop constraint if exists profiles_membership_plan_check;

alter table public.profiles
  add constraint profiles_membership_plan_check
  check (membership_plan in ('free', 'plus', 'plus_family', 'care_plus'));
