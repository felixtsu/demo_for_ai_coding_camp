create extension if not exists "pgcrypto";

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  description text default ''::text,
  daily_quota integer not null check (daily_quota > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.subscription_plans (id),
  status text not null check (
    status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')
  ),
  current_period_start timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_subscriptions_user_status_idx on public.user_subscriptions (user_id, status);
create index if not exists user_subscriptions_plan_idx on public.user_subscriptions (plan_id);

create table if not exists public.rewrite_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, usage_date)
);

create or replace function public.handle_timestamp_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_subscription_plans_updated_at on public.subscription_plans;
create trigger set_subscription_plans_updated_at
before update on public.subscription_plans
for each row
execute function public.handle_timestamp_update();

drop trigger if exists set_user_subscriptions_updated_at on public.user_subscriptions;
create trigger set_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row
execute function public.handle_timestamp_update();

drop trigger if exists set_rewrite_usage_updated_at on public.rewrite_usage;
create trigger set_rewrite_usage_updated_at
before update on public.rewrite_usage
for each row
execute function public.handle_timestamp_update();

alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.rewrite_usage enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_plans'
      and policyname = 'Allow read access to plans'
  ) then
    create policy "Allow read access to plans"
      on public.subscription_plans
      for select
      using (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_subscriptions'
      and policyname = 'Users can read own subscriptions'
  ) then
    create policy "Users can read own subscriptions"
      on public.user_subscriptions
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
      and tablename = 'rewrite_usage'
      and policyname = 'Users can read own usage'
  ) then
    create policy "Users can read own usage"
      on public.rewrite_usage
      for select
      using (auth.uid() = user_id);
  end if;
end;
$$;

create or replace function public.consume_rewrite_credit()
returns table (
  remaining integer,
  quota integer,
  plan_id text,
  plan_name text,
  renews_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := timezone('utc', now())::date;
  v_subscription record;
  v_new_usage integer;
begin
  if v_user_id is null then
    raise exception 'SUBSCRIPTION_MISSING';
  end if;

  select
    us.id,
    us.plan_id,
    us.current_period_end,
    sp.name,
    sp.daily_quota
  into v_subscription
  from public.user_subscriptions us
  join public.subscription_plans sp on sp.id = us.plan_id
  where us.user_id = v_user_id
    and us.status in ('active', 'trialing')
    and us.current_period_end > timezone('utc', now())
  order by us.current_period_end desc
  limit 1;

  if not found then
    raise exception 'SUBSCRIPTION_MISSING';
  end if;

  insert into public.rewrite_usage as ru (user_id, usage_date, usage_count)
  values (v_user_id, v_today, 1)
  on conflict (user_id, usage_date) do update
    set usage_count = ru.usage_count + 1,
        updated_at = timezone('utc', now())
    returning usage_count
    into v_new_usage;

  if v_new_usage > v_subscription.daily_quota then
    update public.rewrite_usage
      set usage_count = v_new_usage - 1,
          updated_at = timezone('utc', now())
      where user_id = v_user_id
        and usage_date = v_today;

    raise exception 'QUOTA_EXCEEDED';
  end if;

  remaining := v_subscription.daily_quota - v_new_usage;
  quota := v_subscription.daily_quota;
  plan_id := v_subscription.plan_id;
  plan_name := v_subscription.name;
  renews_at := v_subscription.current_period_end;
  return next;
end;
$$;

grant execute on function public.consume_rewrite_credit() to authenticated;

insert into public.subscription_plans (id, name, description, daily_quota, price_cents)
values
  ('starter', 'Starter', '適合偶爾使用的個人創作者，每日 5 次改寫配額。', 5, 9900),
  ('professional', 'Professional', '專業寫作者方案，每日 20 次改寫。', 20, 24900),
  ('team', 'Team', '團隊合用方案，每日 60 次配額。', 60, 59900)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  daily_quota = excluded.daily_quota,
  price_cents = excluded.price_cents,
  updated_at = timezone('utc', now());


