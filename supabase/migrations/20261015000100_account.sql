-- Migration 2 (spec 0004): the seven account tables. Owner only, by the Clerk
-- user id in the session token's `sub` claim. `auth.uid()` is not used because
-- Clerk ids such as user_2abc are not UUIDs.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id text primary key default (auth.jwt() ->> 'sub'),
  passport_country text check (passport_country ~ '^[A-Z]{2}$'),
  language text not null default 'en',
  currency text not null default 'USD' check (currency in ('EUR', 'USD', 'GBP')),
  updated_at timestamptz not null default now()
);

create table public.saved_destinations (
  user_id text not null default (auth.jwt() ->> 'sub'),
  destination_id text not null references public.destinations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, destination_id)
);

create index saved_destinations_user_created_idx on public.saved_destinations (user_id, created_at);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  type text not null check (type in ('flight', 'hotel', 'car')),
  flight_id text references public.flights (id) on delete set null,
  hotel_id text references public.hotels (id) on delete set null,
  car_id text references public.car_rentals (id) on delete set null,
  snapshot_title text not null,
  snapshot_price numeric(10,2) not null check (snapshot_price >= 0),
  snapshot_currency text not null check (snapshot_currency in ('EUR', 'USD', 'GBP')),
  snapshot_details jsonb not null default '{}',
  booked_at timestamptz not null default now(),
  -- At most one link, and a set link matches the type. A live flight sets none.
  check (
    num_nonnulls(flight_id, hotel_id, car_id) <= 1
    and (flight_id is null or type = 'flight')
    and (hotel_id is null or type = 'hotel')
    and (car_id is null or type = 'car')
  )
);

create index trips_user_booked_idx on public.trips (user_id, booked_at);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  origin text references public.airports (code),
  destination text references public.airports (code),
  anywhere boolean not null default false,
  month text check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  nights integer check (nights between 1 and 30),
  max_price numeric(10,2) check (max_price >= 0),
  direct_only boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'undone')),
  -- Alerts stay simulated until a live price source is decided.
  is_demo boolean not null default true check (is_demo),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  check (not (destination is not null and anywhere))
);

create index alerts_user_idx on public.alerts (user_id);

-- Append only: a row is created once and later only gets undone_at.
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  -- Claimed by the client, so a label, not proof.
  actor text not null check (actor in ('assistant', 'user')),
  action text not null,
  summary text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  undone_at timestamptz
);

create index activity_log_user_idx on public.activity_log (user_id, created_at);

-- Parsed fields only, never the typed text. The app keeps the newest 10.
create table public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  origin text,
  destination text,
  anywhere boolean not null default false,
  month text,
  nights integer,
  depart_date date,
  return_date date,
  max_price numeric(10,2),
  direct_only boolean not null default false,
  created_at timestamptz not null default now()
);

create index recent_searches_user_idx on public.recent_searches (user_id, created_at);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  last_seen_at timestamptz not null default now(),
  -- Per account, so two accounts on one phone never collide.
  unique (user_id, token)
);

create index push_tokens_user_idx on public.push_tokens (user_id);

-- ---------------------------------------------------------------------------
-- updated_at on profiles
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: every policy checks the owner on the token's `sub`
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.saved_destinations enable row level security;
alter table public.trips enable row level security;
alter table public.alerts enable row level security;
alter table public.activity_log enable row level security;
alter table public.recent_searches enable row level security;
alter table public.push_tokens enable row level security;

-- Tables with select, insert, update and delete for the owner.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'saved_destinations', 'trips', 'alerts', 'recent_searches', 'push_tokens'
  ] loop
    execute format('create policy "owner select" on public.%I for select to authenticated using ((select auth.jwt() ->> ''sub'') = user_id)', t);
    execute format('create policy "owner insert" on public.%I for insert to authenticated with check ((select auth.jwt() ->> ''sub'') = user_id)', t);
    execute format('create policy "owner update" on public.%I for update to authenticated using ((select auth.jwt() ->> ''sub'') = user_id) with check ((select auth.jwt() ->> ''sub'') = user_id)', t);
    execute format('create policy "owner delete" on public.%I for delete to authenticated using ((select auth.jwt() ->> ''sub'') = user_id)', t);
  end loop;
end $$;

-- activity_log has no delete policy: append only.
create policy "owner select" on public.activity_log for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
create policy "owner insert" on public.activity_log for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);
create policy "owner update" on public.activity_log for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

-- ---------------------------------------------------------------------------
-- Grants: start from nothing (Supabase's defaults are wider), then owner access
-- ---------------------------------------------------------------------------

revoke all on
  public.profiles, public.saved_destinations, public.trips, public.alerts,
  public.activity_log, public.recent_searches, public.push_tokens
from anon, authenticated;

grant select, insert, update, delete on
  public.profiles, public.saved_destinations, public.trips, public.alerts,
  public.recent_searches, public.push_tokens
to authenticated;

grant select, insert on public.activity_log to authenticated;
grant update (undone_at) on public.activity_log to authenticated;

-- ---------------------------------------------------------------------------
-- Account deletion, called by the Clerk webhook with the secret key
-- ---------------------------------------------------------------------------

-- Security invoker: it runs as service_role, which needs its own grants.
grant select, delete on
  public.profiles, public.saved_destinations, public.trips, public.alerts,
  public.activity_log, public.recent_searches, public.push_tokens
to service_role;

-- One statement list in one function call, so it is one transaction.
-- Deleting twice is harmless.
create function public.delete_user_data(p_user_id text)
returns void
language sql
set search_path = ''
as $$
  delete from public.saved_destinations where user_id = p_user_id;
  delete from public.trips where user_id = p_user_id;
  delete from public.alerts where user_id = p_user_id;
  delete from public.activity_log where user_id = p_user_id;
  delete from public.recent_searches where user_id = p_user_id;
  delete from public.push_tokens where user_id = p_user_id;
  delete from public.profiles where user_id = p_user_id;
$$;

revoke execute on function public.delete_user_data(text) from public, anon, authenticated;
grant execute on function public.delete_user_data(text) to service_role;
