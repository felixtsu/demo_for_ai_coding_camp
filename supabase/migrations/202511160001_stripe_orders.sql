create extension if not exists "pgcrypto";

create table if not exists public.stripe_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.subscription_plans (id),
  billing_period text not null check (billing_period in ('monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'canceled')),
  stripe_payment_link_url text,
  stripe_checkout_session_id text,
  client_reference_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists stripe_orders_user_idx on public.stripe_orders(user_id);
create index if not exists stripe_orders_status_idx on public.stripe_orders(status);
create index if not exists stripe_orders_created_idx on public.stripe_orders(created_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_stripe_orders_updated_at on public.stripe_orders;
create trigger set_stripe_orders_updated_at
before update on public.stripe_orders
for each row
execute function public.set_updated_at_timestamp();

alter table public.stripe_orders enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stripe_orders'
      and policyname = 'Users can read own orders'
  ) then
    create policy "Users can read own orders"
      on public.stripe_orders
      for select
      using (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stripe_orders'
      and policyname = 'Users can insert own orders'
  ) then
    create policy "Users can insert own orders"
      on public.stripe_orders
      for insert
      with check (auth.uid() = user_id);
  end if;
end;
$$;


