create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locale text not null default 'en' check (locale in ('en', 'fr')),
  default_currency text not null default 'CAD' check (char_length(default_currency) = 3),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_default_consistency check (
    (is_default = true and user_id is null) or
    (is_default = false)
  )
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'CAD' check (char_length(currency) = 3),
  merchant text not null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null,
  note text,
  transaction_date date not null,
  source text not null default 'manual' check (source in ('manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_month date not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'CAD' check (char_length(currency) = 3),
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_period_month_first_day check (
    period_month = date_trunc('month', period_month)::date
  )
);

create unique index categories_default_unique_name_kind
  on public.categories (lower(name), kind)
  where user_id is null;

create unique index categories_user_unique_name_kind
  on public.categories (user_id, lower(name), kind)
  where user_id is not null;

create index transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

create index transactions_user_type_date_idx
  on public.transactions (user_id, type, transaction_date desc);

create index transactions_user_category_date_idx
  on public.transactions (user_id, category_name, transaction_date desc);

create unique index budgets_user_month_overall_unique
  on public.budgets (user_id, period_month)
  where category_id is null;

create unique index budgets_user_month_category_unique
  on public.budgets (user_id, period_month, category_id)
  where category_id is not null;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

create trigger set_transactions_updated_at
before update on public.transactions
for each row execute procedure public.set_updated_at();

create trigger set_budgets_updated_at
before update on public.budgets
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.validate_transaction_category()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null then
    if not exists (
      select 1
      from public.categories c
      where c.id = new.category_id
        and (c.user_id is null or c.user_id = new.user_id)
    ) then
      raise exception 'Invalid category_id for user';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_transaction_category_trigger
before insert or update on public.transactions
for each row execute procedure public.validate_transaction_category();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (id = auth.uid());

create policy "categories_select_default_or_own"
on public.categories
for select
to authenticated
using (user_id is null or user_id = auth.uid());

create policy "categories_insert_own_only"
on public.categories
for insert
to authenticated
with check (
  user_id = auth.uid()
  and is_default = false
);

create policy "categories_update_own_only"
on public.categories
for update
to authenticated
using (
  user_id = auth.uid()
  and is_default = false
)
with check (
  user_id = auth.uid()
  and is_default = false
);

create policy "categories_delete_own_only"
on public.categories
for delete
to authenticated
using (
  user_id = auth.uid()
  and is_default = false
);

create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (user_id = auth.uid());

create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using (user_id = auth.uid());

create policy "budgets_select_own"
on public.budgets
for select
to authenticated
using (user_id = auth.uid());

create policy "budgets_insert_own"
on public.budgets
for insert
to authenticated
with check (user_id = auth.uid());

create policy "budgets_update_own"
on public.budgets
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "budgets_delete_own"
on public.budgets
for delete
to authenticated
using (user_id = auth.uid());

insert into public.categories (name, kind, color, is_default)
values
  ('Groceries', 'expense', '#22c55e', true),
  ('Transport', 'expense', '#3b82f6', true),
  ('Dining', 'expense', '#f97316', true),
  ('Shopping', 'expense', '#a855f7', true),
  ('Bills', 'expense', '#ef4444', true),
  ('Entertainment', 'expense', '#eab308', true),
  ('Health', 'expense', '#14b8a6', true),
  ('Other', 'expense', '#6b7280', true),
  ('Salary', 'income', '#16a34a', true),
  ('Freelance', 'income', '#0ea5e9', true),
  ('Gift', 'income', '#ec4899', true),
  ('Other', 'income', '#6b7280', true)
on conflict do nothing;