-- Usage limit tests. Safe to run repeatedly: it uses fixed test ids and far-future days,
-- and cleans up after itself.

delete from public.usage_daily where day >= date '2030-01-01';
delete from public.usage_global where day >= date '2030-01-01';
delete from public.user_plans where user_id = '00000000-0000-4000-8000-000000000005';

do $$
declare
  u1 uuid := '00000000-0000-4000-8000-000000000001';
  u2 uuid := '00000000-0000-4000-8000-000000000002';
  u3 uuid := '00000000-0000-4000-8000-000000000003';
  u4 uuid := '00000000-0000-4000-8000-000000000004';
  u5 uuid := '00000000-0000-4000-8000-000000000005';
  d1 date := date '2030-01-01';
  d2 date := date '2030-01-02';
  d3 date := date '2030-01-03';
  r jsonb;
  n integer;
begin
  -- 1. The per-user limit (3 for this test)
  for i in 1..3 loop
    r := public.consume_decode(u1, d1, 3, 50, 1000);
    if r->>'status' <> 'ok' then
      raise exception 'test 1: call % should be ok, got %', i, r;
    end if;
  end loop;
  r := public.consume_decode(u1, d1, 3, 50, 1000);
  if r->>'status' <> 'user_limit' or (r->>'limit')::int <> 3 then
    raise exception 'test 1: the 4th call should hit the limit, got %', r;
  end if;

  -- 2. Another user is not affected
  r := public.consume_decode(u2, d1, 3, 50, 1000);
  if r->>'status' <> 'ok' then
    raise exception 'test 2: a different user should be ok, got %', r;
  end if;

  -- 3. A new day starts from zero
  r := public.consume_decode(u1, d2, 3, 50, 1000);
  if r->>'status' <> 'ok' then
    raise exception 'test 3: a new day should reset the count, got %', r;
  end if;

  -- 4. The global cap (2 for this test), and its rollback of the user's count
  r := public.consume_decode(u2, d3, 3, 50, 2);
  if r->>'status' <> 'ok' then raise exception 'test 4a: got %', r; end if;
  r := public.consume_decode(u3, d3, 3, 50, 2);
  if r->>'status' <> 'ok' then raise exception 'test 4b: got %', r; end if;
  r := public.consume_decode(u4, d3, 3, 50, 2);
  if r->>'status' <> 'global_limit' then
    raise exception 'test 4c: the cap should apply, got %', r;
  end if;
  select decodes into n from public.usage_daily where user_id = u4 and day = d3;
  if n <> 0 then
    raise exception 'test 4d: a refused call must not count against the user, got %', n;
  end if;

  -- 5. A subscriber skips the global cap but keeps a personal limit (2 for this test)
  insert into public.user_plans (user_id, plan) values (u5, 'subscriber');
  r := public.consume_decode(u5, d3, 3, 2, 2);
  if r->>'status' <> 'ok' then raise exception 'test 5a: got %', r; end if;
  r := public.consume_decode(u5, d3, 3, 2, 2);
  if r->>'status' <> 'ok' then raise exception 'test 5b: got %', r; end if;
  r := public.consume_decode(u5, d3, 3, 2, 2);
  if r->>'status' <> 'user_limit' then
    raise exception 'test 5c: the subscriber limit should apply, got %', r;
  end if;
  select free_decodes into n from public.usage_global where day = d3;
  if n <> 2 then
    raise exception 'test 5d: subscribers must not count in the global total, got %', n;
  end if;

  -- 6. An expired subscription is treated as free
  update public.user_plans set expires_at = now() - interval '1 day' where user_id = u5;
  r := public.consume_decode(u5, d2, 3, 50, 1000);
  if r->>'status' <> 'ok' or (r->>'subscriber')::boolean then
    raise exception 'test 6: an expired plan should count as free, got %', r;
  end if;

  -- 7. Refunds give one back, and never go below zero
  perform public.refund_decode(u1, d1);
  select decodes into n from public.usage_daily where user_id = u1 and day = d1;
  if n <> 2 then raise exception 'test 7a: expected 2 after refund, got %', n; end if;
  select free_decodes into n from public.usage_global where day = d1;
  if n <> 3 then raise exception 'test 7b: the global total should drop to 3, got %', n; end if;

  perform public.refund_decode(u4, d3);
  select decodes into n from public.usage_daily where user_id = u4 and day = d3;
  if n <> 0 then raise exception 'test 7c: must not go below zero, got %', n; end if;
  select free_decodes into n from public.usage_global where day = d3;
  if n <> 2 then raise exception 'test 7d: a refund with nothing charged must not change the total, got %', n; end if;
end $$;

delete from public.usage_daily where day >= date '2030-01-01';
delete from public.usage_global where day >= date '2030-01-01';
delete from public.user_plans where user_id = '00000000-0000-4000-8000-000000000005';

select 'ALL USAGE TESTS PASSED' as result;