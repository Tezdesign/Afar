-- Proves spec 0004 AC-3 and AC-4 with two test users, then rolls everything back.
-- Run: supabase db query --linked -f supabase/tests/isolation.sql
-- Fails with an exception naming the first broken rule. Prints 'isolation ok'.

begin;

-- One row per account table for user_a, then a few for user_b.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"test_user_a","role":"authenticated"}', true);
insert into public.profiles (passport_country) values ('TN');
insert into public.saved_destinations (destination_id) values ('destination-paris');
insert into public.trips (type, snapshot_title, snapshot_price, snapshot_currency) values ('flight', 'Live flight', 100, 'EUR');
insert into public.alerts (origin, destination, max_price) values ('TUN', 'CDG', 200);
insert into public.activity_log (actor, action, summary) values ('assistant', 'create_alert', 'Made an alert');
insert into public.recent_searches (origin) values ('TUN');
insert into public.push_tokens (token, platform) values ('tok-1', 'ios');

do $$ begin
  if (select user_id from public.saved_destinations) <> 'test_user_a' then
    raise exception 'FAIL: user_id should default to the token sub';
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"test_user_b","role":"authenticated"}', true);
insert into public.profiles (passport_country) values ('FR');
insert into public.saved_destinations (destination_id) values ('destination-rome');
insert into public.push_tokens (token, platform) values ('tok-1', 'ios'); -- same token, other account

-- B sees only B's rows, in every account table.
do $$
declare t text; n int;
begin
  foreach t in array array['profiles','saved_destinations','trips','alerts','activity_log','recent_searches','push_tokens'] loop
    execute format('select count(*) from public.%I where user_id <> ''test_user_b''', t) into n;
    if n <> 0 then raise exception 'FAIL: B can read % rows of others in %', n, t; end if;
  end loop;
end $$;

-- B cannot change or delete A's rows: zero rows are touched.
do $$
declare n int;
begin
  with u as (update public.saved_destinations set created_at = now() where user_id = 'test_user_a' returning 1) select count(*) into n from u;
  if n <> 0 then raise exception 'FAIL: B updated A saved row'; end if;
  with d as (delete from public.trips where user_id = 'test_user_a' returning 1) select count(*) into n from d;
  if n <> 0 then raise exception 'FAIL: B deleted A trip'; end if;
  with u as (update public.profiles set passport_country = 'US' where user_id = 'test_user_a' returning 1) select count(*) into n from u;
  if n <> 0 then raise exception 'FAIL: B updated A profile'; end if;
end $$;

-- B cannot hand a row to A, nor insert as A.
do $$ begin
  begin
    update public.saved_destinations set user_id = 'test_user_a' where destination_id = 'destination-rome';
    raise exception 'FAIL: B changed a row user_id';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.saved_destinations (user_id, destination_id) values ('test_user_a', 'destination-london');
    raise exception 'FAIL: B inserted a row as A';
  exception when insufficient_privilege then null; end;
end $$;

-- A still sees exactly A's own rows.
select set_config('request.jwt.claims', '{"sub":"test_user_a","role":"authenticated"}', true);
do $$
declare t text; n int;
begin
  foreach t in array array['profiles','saved_destinations','trips','alerts','activity_log','recent_searches','push_tokens'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 1 then raise exception 'FAIL: A should see 1 row in %, saw %', t, n; end if;
  end loop;
end $$;

-- Constraints.
do $$ begin
  begin
    insert into public.alerts (destination, anywhere) values ('CDG', true);
    raise exception 'FAIL: alert with destination and anywhere';
  exception when check_violation then null; end;
  begin
    insert into public.alerts (origin, is_demo) values ('TUN', false);
    raise exception 'FAIL: alert with is_demo false';
  exception when check_violation then null; end;
  begin
    insert into public.trips (type, flight_id, hotel_id, snapshot_title, snapshot_price, snapshot_currency)
    values ('flight', 'flight-tun-cdg-1', 'hotel-artemide', 'x', 1, 'EUR');
    raise exception 'FAIL: trip with two links';
  exception when check_violation then null; end;
  begin
    insert into public.trips (type, hotel_id, snapshot_title, snapshot_price, snapshot_currency)
    values ('flight', 'hotel-artemide', 'x', 1, 'EUR');
    raise exception 'FAIL: trip link that does not match its type';
  exception when check_violation then null; end;
end $$;

-- activity_log is append only: only undone_at can change, nothing is deleted.
do $$ begin
  begin
    update public.activity_log set summary = 'edited';
    raise exception 'FAIL: activity summary was editable';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.activity_log;
    raise exception 'FAIL: activity log row was deletable';
  exception when insufficient_privilege then null; end;
end $$;
update public.activity_log set undone_at = now();

-- The updated_at trigger runs for the owner, even if the client sends a stale value.
update public.profiles set updated_at = '2000-01-01', language = 'fr';
do $$ begin
  if (select updated_at from public.profiles) < '2001-01-01' then
    raise exception 'FAIL: updated_at was not set by the trigger';
  end if;
end $$;

-- The catalog is read only for signed in people.
do $$ begin
  begin
    insert into public.flights (id, origin_code, destination_code, depart_date, airline, price, duration_minutes, stops)
    values ('x', 'TUN', 'CDG', current_date, 'a', 1, 1, 0);
    raise exception 'FAIL: catalog insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.flights set price = 1;
    raise exception 'FAIL: catalog update allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.flights;
    raise exception 'FAIL: catalog delete allowed';
  exception when insufficient_privilege then null; end;
end $$;

-- delete_user_data is not callable by a signed in person.
do $$ begin
  begin
    perform public.delete_user_data('test_user_b');
    raise exception 'FAIL: authenticated ran delete_user_data';
  exception when insufficient_privilege then null; end;
end $$;

-- anon is refused on every account table, and cannot run the function.
reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$
declare t text;
begin
  foreach t in array array['profiles','saved_destinations','trips','alerts','activity_log','recent_searches','push_tokens'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon could read %', t;
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    perform public.delete_user_data('test_user_a');
    raise exception 'FAIL: anon ran delete_user_data';
  exception when insufficient_privilege then null; end;
end $$;

-- The secret key (service_role) deletes a person's rows, and doing it twice is harmless.
reset role;
set local role service_role;
select public.delete_user_data('test_user_a');
select public.delete_user_data('test_user_a');
do $$
declare t text; n int;
begin
  foreach t in array array['profiles','saved_destinations','trips','alerts','activity_log','recent_searches','push_tokens'] loop
    execute format('select count(*) from public.%I where user_id = ''test_user_a''', t) into n;
    if n <> 0 then raise exception 'FAIL: % rows of A left in %', n, t; end if;
  end loop;
  select count(*) into n from public.profiles where user_id = 'test_user_b';
  if n <> 1 then raise exception 'FAIL: delete_user_data touched B'; end if;
end $$;

-- A trip outlives its catalog flight: the link empties, the snapshot stays.
reset role;
insert into public.trips (id, user_id, type, flight_id, snapshot_title, snapshot_price, snapshot_currency)
values ('00000000-0000-0000-0000-000000000001', 'test_user_b', 'flight', 'flight-tun-cdg-2', 'Tunis to Paris', 97, 'EUR');
delete from public.flights where id = 'flight-tun-cdg-2';
do $$ begin
  if not exists (
    select 1 from public.trips
    where id = '00000000-0000-0000-0000-000000000001' and flight_id is null and snapshot_title = 'Tunis to Paris'
  ) then raise exception 'FAIL: trip did not survive its flight'; end if;
end $$;

rollback;
select 'isolation ok' as result;
