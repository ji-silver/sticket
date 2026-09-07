create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.dispatch_kbo_collection(collection_mode text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  github_token text;
begin
  if collection_mode not in ('today', 'yesterday', 'upcoming', 'schedule') then
    raise exception 'Unsupported collection mode: %', collection_mode;
  end if;

  select decrypted_secret
    into github_token
    from vault.decrypted_secrets
   where name = 'github_actions_token';

  if github_token is null then
    raise exception 'Vault secret github_actions_token is missing';
  end if;

  return net.http_post(
    url := 'https://api.github.com/repos/ji-silver/sticket/actions/workflows/collect-kbo.yml/dispatches',
    headers := jsonb_build_object(
      'Accept', 'application/vnd.github+json',
      'Authorization', 'Bearer ' || github_token,
      'X-GitHub-Api-Version', '2026-03-10',
      'User-Agent', 'sticket-kbo-collector'
    ),
    body := jsonb_build_object(
      'ref', 'main',
      'inputs', jsonb_build_object('mode', collection_mode)
    ),
    timeout_milliseconds := 5000
  );
end;
$$;

revoke all on function private.dispatch_kbo_collection(text) from public, anon, authenticated;

-- KST 10:02~23:47, 15분 간격. 한 번 누락돼도 30분 내 다음 요청이 생긴다.
select cron.schedule(
  'kbo-collect-today',
  '2,17,32,47 1-14 * 3-11 *',
  $$select private.dispatch_kbo_collection('today')$$
);

-- KST 00:17, 09:17 전날 경기 최종 보정.
select cron.schedule(
  'kbo-collect-yesterday',
  '17 0,15 * 3-11 *',
  $$select private.dispatch_kbo_collection('yesterday')$$
);

-- KST 10:07 일정 수집.
select cron.schedule(
  'kbo-collect-upcoming-schedule',
  '7 1 * 3-7 *',
  $$select private.dispatch_kbo_collection('upcoming')$$
);

select cron.schedule(
  'kbo-collect-remaining-schedule',
  '7 1 * 8-11 *',
  $$select private.dispatch_kbo_collection('schedule')$$
);
