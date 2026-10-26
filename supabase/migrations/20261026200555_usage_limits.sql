-- Daily usage limits for the decode-label function.
-- These tables and functions are reachable ONLY from the server (service role).

create table public.usage_daily (
  user_id uuid not null,
  day date not null,
  decodes integer not null default 0 check (decodes >= 0),
  primary key (user_id, day)
);

-- Free-user decodes per day. Subscribers are not counted here.
create table public.usage_global (
  day date primary key,
  free_decodes integer not null default 0 check (free_decodes >= 0)
);

-- Written only by the server (a payment webhook, later). Never by the app.
create table public.user_plans (
  user_id uuid primary key,
  plan text not null default 'free' check (plan in ('free', 'subscriber')),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.usage_daily enable row level security;
alter table public.usage_global enable row level security;
alter table public.user_plans enable row level security;
-- No policies on purpose: the app can never read or write these tables.

revoke all on table public.usage_daily from anon, authenticated;
revoke all on table public.usage_global from anon, authenticated;
revoke all on table public.user_plans from anon, authenticated;

-- Counts one decode atomically. Returns {"status": "ok" | "user_limit" | "global_limit", ...}.
create or replace function public.consume_decode(
  p_user uuid,
  p_day date,
  p_user_limit integer,
  p_subscriber_limit integer,
  p_global_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber boolean;
  v_limit integer;
  v_used integer;
  v_global integer;
begin
  select exists (
    select 1 from public.user_plans
    where user_id = p_user
      and plan = 'subscriber'
      and (expires_at is null or expires_at > now())
  ) into v_subscriber;

  v_limit := case when v_subscriber then p_subscriber_limit else p_user_limit end;

  insert into public.usage_daily (user_id, day, decodes)
  values (p_user, p_day, 0)
  on conflict (user_id, day) do nothing;

  -- The limit check and the increment are ONE statement, so concurrent calls cannot both pass.
  update public.usage_daily
     set decodes = decodes + 1
   where user_id = p_user and day = p_day and decodes < v_limit
  returning decodes into v_used;

  if v_used is null then
    return jsonb_build_object('status', 'user_limit', 'limit', v_limit, 'subscriber', v_subscriber);
  end if;

  if not v_subscriber then
    insert into public.usage_global (day, free_decodes)
    values (p_day, 0)
    on conflict (day) do nothing;

    update public.usage_global
       set free_decodes = free_decodes + 1
     where day = p_day and free_decodes < p_global_limit
    returning free_decodes into v_global;

    if v_global is null then
      -- The global cap is reached: give the user's count back.
      update public.usage_daily
         set decodes = decodes - 1
       where user_id = p_user and day = p_day and decodes > 0;
      return jsonb_build_object('status', 'global_limit', 'limit', v_limit, 'subscriber', false);
    end if;
  end if;

  return jsonb_build_object('status', 'ok', 'used', v_used, 'limit', v_limit, 'subscriber', v_subscriber);
end;
$$;

-- Gives one decode back, used when our own system failed. Never goes below zero.
create or replace function public.refund_decode(
  p_user uuid,
  p_day date
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber boolean;
begin
  update public.usage_daily
     set decodes = decodes - 1
   where user_id = p_user and day = p_day and decodes > 0;

  if not found then
    return; -- nothing had been charged
  end if;

  select exists (
    select 1 from public.user_plans
    where user_id = p_user
      and plan = 'subscriber'
      and (expires_at is null or expires_at > now())
  ) into v_subscriber;

  if not v_subscriber then
    update public.usage_global
       set free_decodes = free_decodes - 1
     where day = p_day and free_decodes > 0;
  end if;
end;
$$;

-- Postgres lets everyone run a new function by default. Only the server may run these.
revoke all on function public.consume_decode(uuid, date, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_decode(uuid, date, integer, integer, integer)
  to service_role;

revoke all on function public.refund_decode(uuid, date)
  from public, anon, authenticated;
grant execute on function public.refund_decode(uuid, date)
  to service_role;