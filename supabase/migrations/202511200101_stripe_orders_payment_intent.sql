alter table if exists public.stripe_orders
  add column if not exists stripe_payment_intent_id text;



