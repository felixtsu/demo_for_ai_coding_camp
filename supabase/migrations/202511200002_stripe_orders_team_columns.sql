alter table if exists public.stripe_orders
  add column if not exists seat_count integer check (seat_count is null or seat_count >= 1),
  add column if not exists unit_amount_cents integer check (unit_amount_cents is null or unit_amount_cents >= 0);


