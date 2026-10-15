-- Migration 1 (spec 0004): the sample catalog, two views, the daily date job.
-- Catalog tables are readable by anyone and writable by nobody from the app.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.airports (
  code text primary key,
  city text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$')
);

create table public.flights (
  id text primary key,
  origin_code text not null references public.airports (code),
  destination_code text not null references public.airports (code),
  depart_date date not null,
  return_date date,
  nights integer generated always as (return_date - depart_date) stored,
  airline text not null,
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  duration_minutes integer not null check (duration_minutes > 0),
  stops integer not null check (stops >= 0),
  source text not null default 'sample',
  external_id text,
  sample_depart_offset integer check (sample_depart_offset >= 0),
  sample_return_offset integer,
  check (sample_return_offset is null or sample_return_offset > sample_depart_offset)
);

create index flights_destination_depart_idx on public.flights (destination_code, depart_date);
create index flights_origin_idx on public.flights (origin_code);
create index flights_price_idx on public.flights (price);

create table public.hotels (
  id text primary key,
  name text not null,
  city text not null,
  country text not null,
  neighborhood text not null,
  star_rating smallint not null check (star_rating between 1 and 5),
  review_score numeric(2,1) not null check (review_score between 0 and 5),
  review_count integer not null check (review_count >= 0),
  price_per_night numeric(10,2) not null check (price_per_night >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  source text not null default 'sample',
  external_id text
);

create table public.car_rentals (
  id text primary key,
  company text not null,
  car_type text not null,
  pickup_city text not null,
  price_per_day numeric(10,2) not null check (price_per_day >= 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  source text not null default 'sample',
  external_id text
);

create table public.destinations (
  id text primary key,
  city text not null,
  country text not null,
  blurb text not null,
  rating numeric(2,1) not null check (rating between 0 and 5),
  image_url text not null,
  airport_code text references public.airports (code)
);

create index destinations_airport_idx on public.destinations (airport_code);

create table public.deals (
  id text primary key,
  type text not null check (type in ('flight', 'hotel', 'car')),
  title text not null,
  subtitle text not null,
  image_url text not null,
  featured boolean not null default false,
  flight_id text references public.flights (id) on delete cascade,
  hotel_id text references public.hotels (id) on delete cascade,
  car_id text references public.car_rentals (id) on delete cascade,
  check (
    (type = 'flight' and flight_id is not null and hotel_id is null and car_id is null) or
    (type = 'hotel' and hotel_id is not null and flight_id is null and car_id is null) or
    (type = 'car' and car_id is not null and flight_id is null and hotel_id is null)
  )
);

create index deals_flight_idx on public.deals (flight_id);
create index deals_hotel_idx on public.deals (hotel_id);
create index deals_car_idx on public.deals (car_id);

-- ---------------------------------------------------------------------------
-- Views (security_invoker: they follow the caller's rules, not the owner's)
-- ---------------------------------------------------------------------------

-- price_from is the cheapest flight to the destination's airport from any
-- origin, and null when there is none.
create view public.destinations_with_price
with (security_invoker = true) as
select d.*, f.price as price_from, f.currency
from public.destinations d
left join lateral (
  select price, currency
  from public.flights
  where destination_code = d.airport_code
  order by price
  limit 1
) f on true;

-- price_unit keeps a nightly or daily price from being shown as a trip total.
create view public.deals_with_price
with (security_invoker = true) as
select
  d.*,
  coalesce(f.price, h.price_per_night, c.price_per_day) as price,
  coalesce(f.currency, h.currency, c.currency) as currency,
  case d.type when 'flight' then 'trip' when 'hotel' then 'night' else 'day' end as price_unit,
  f.destination_code
from public.deals d
left join public.flights f on f.id = d.flight_id
left join public.hotels h on h.id = d.hotel_id
left join public.car_rentals c on c.id = d.car_id;

-- ---------------------------------------------------------------------------
-- Row level security and grants: start from nothing, then read only
-- ---------------------------------------------------------------------------

alter table public.airports enable row level security;
alter table public.flights enable row level security;
alter table public.hotels enable row level security;
alter table public.car_rentals enable row level security;
alter table public.destinations enable row level security;
alter table public.deals enable row level security;

create policy "catalog is public" on public.airports for select to anon, authenticated using (true);
create policy "catalog is public" on public.flights for select to anon, authenticated using (true);
create policy "catalog is public" on public.hotels for select to anon, authenticated using (true);
create policy "catalog is public" on public.car_rentals for select to anon, authenticated using (true);
create policy "catalog is public" on public.destinations for select to anon, authenticated using (true);
create policy "catalog is public" on public.deals for select to anon, authenticated using (true);

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.airports,
  public.flights,
  public.hotels,
  public.car_rentals,
  public.destinations,
  public.deals,
  public.destinations_with_price,
  public.deals_with_price
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Daily date job: sample flights always depart today plus their offsets
-- ---------------------------------------------------------------------------

-- A schema the Data API cannot reach, and nobody but the database owner can run.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.roll_sample_dates(base date default current_date)
returns void
language sql
set search_path = ''
as $$
  update public.flights
  set depart_date = base + sample_depart_offset,
      return_date = case
        when sample_return_offset is not null then base + sample_return_offset
      end
  where sample_depart_offset is not null;
$$;

revoke execute on function private.roll_sample_dates(date) from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

-- Just after midnight UTC. The app's day is local, so near midnight the two can differ by one day.
select cron.schedule('roll-sample-dates', '5 0 * * *', $$select private.roll_sample_dates()$$);
