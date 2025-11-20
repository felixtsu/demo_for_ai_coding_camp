alter table if exists public.user_subscriptions
  add column if not exists billing_period text
    check (
      billing_period is null
      or billing_period in ('monthly', 'yearly')
    )
    default 'monthly';

update public.user_subscriptions
set billing_period = coalesce(billing_period, 'monthly');


