alter table if exists public.stripe_orders
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text;

alter table if exists public.user_subscriptions
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_customer_id text;


