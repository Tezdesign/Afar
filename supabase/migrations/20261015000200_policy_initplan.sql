-- Same rule as migration 2, written the way Supabase's advisor recognizes:
-- the select wraps only the function call, so it runs once per query, not per row.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'saved_destinations', 'trips', 'alerts', 'recent_searches', 'push_tokens', 'activity_log'
  ] loop
    execute format('alter policy "owner select" on public.%I using ((select auth.jwt()) ->> ''sub'' = user_id)', t);
    execute format('alter policy "owner insert" on public.%I with check ((select auth.jwt()) ->> ''sub'' = user_id)', t);
    execute format('alter policy "owner update" on public.%I using ((select auth.jwt()) ->> ''sub'' = user_id) with check ((select auth.jwt()) ->> ''sub'' = user_id)', t);
    -- activity_log has no delete policy (append only)
    if t <> 'activity_log' then
      execute format('alter policy "owner delete" on public.%I using ((select auth.jwt()) ->> ''sub'' = user_id)', t);
    end if;
  end loop;
end $$;
