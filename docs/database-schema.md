## Supabase Database Schema

This document captures the current Supabase schema for the rewrite application. The schema is managed via SQL migrations inside `supabase/migrations`, but the consolidated definition is copied here for quick reference and onboarding.

### Usage

1. Ensure you have the Supabase CLI installed (`npm i -g supabase`).
2. Pull credentials for your project via `supabase login` and `supabase link`.
3. Apply the latest migrations (or the DDL below) with:
   ```bash
   supabase db reset
   # or
   supabase db push
   # or
   psql < docs/database-schema.sql  # when running against PostgreSQL directly
   ```
4. Update the `.env.local` file using the instructions in `README.md`, then restart the Next.js dev server.

### Table Overview

| Table | Purpose |
| --- | --- |
| `rewrite_history` | Stores the original and rewritten text plus token usage per rewrite action. |
| `rewrite_usage` | Daily rewrite counters per user (used to enforce quotas). |
| `stripe_orders` | Snapshot of Stripe checkout/payment state for both self-serve and team purchases. |
| `subscription_plans` | Authoritative list of paid plans, quotas, and pricing. |
| `user_profiles` | Additional metadata keyed to Supabase Auth users, including plan info. |
| `user_subscriptions` | Stripe subscription linkage and billing status per user. |

### Full DDL

```sql
CREATE TABLE public.rewrite_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  original_text text NOT NULL,
  rewritten_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  CONSTRAINT rewrite_history_pkey PRIMARY KEY (id)
);

CREATE TABLE public.rewrite_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL,
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rewrite_usage_pkey PRIMARY KEY (user_id, usage_date),
  CONSTRAINT rewrite_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.stripe_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  billing_period text NOT NULL CHECK (billing_period = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'canceled'::text])),
  stripe_payment_link_url text,
  stripe_checkout_session_id text,
  client_reference_id text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  seat_count integer CHECK (seat_count IS NULL OR seat_count >= 1),
  unit_amount_cents integer CHECK (unit_amount_cents IS NULL OR unit_amount_cents >= 0),
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  CONSTRAINT stripe_orders_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT stripe_orders_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

CREATE TABLE public.subscription_plans (
  id text NOT NULL,
  name text NOT NULL,
  description text DEFAULT ''::text,
  daily_quota integer NOT NULL CHECK (daily_quota > 0),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  plan text DEFAULT 'free'::text CHECK (plan = ANY (ARRAY['free'::text, 'paid'::text])),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text])),
  current_period_start timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  current_period_end timestamp with time zone NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  billing_period text DEFAULT 'monthly'::text CHECK (billing_period = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);
```

