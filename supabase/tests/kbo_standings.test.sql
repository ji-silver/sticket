begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

set local role service_role;
select lives_ok(
    $$insert into public.kbo_standings (season, as_of_date, standings)
      values (2026, '2026-10-07', (select jsonb_agg(jsonb_build_object('rank', n)) from generate_series(1, 10) n))$$,
    '수집기는 전체 순위 스냅샷을 저장한다'
);

set local role anon;
select throws_ok(
    $$select * from public.kbo_standings$$,
    '42501', 'permission denied for table kbo_standings',
    '비로그인 사용자는 순위에 접근하지 못한다'
);

set local role authenticated;
select is((select count(*) from public.kbo_standings), 1::bigint, '로그인 사용자는 순위를 조회한다');
select throws_ok(
    $$update public.kbo_standings set as_of_date = '2026-10-08' where season = 2026$$,
    '42501', 'permission denied for table kbo_standings',
    '로그인 사용자는 순위를 변경하지 못한다'
);
select throws_ok(
    $$insert into public.kbo_standings (season, as_of_date, standings) values (2025, '2025-10-07', '[]')$$,
    '42501', 'permission denied for table kbo_standings',
    '로그인 사용자는 순위를 추가하지 못한다'
);

set local role service_role;
select throws_ok(
    $$update public.kbo_standings set as_of_date = '2026-10-06' where season = 2026$$,
    'P0001', 'KBO 순위 기준일을 이전 날짜로 변경할 수 없습니다.',
    '오래된 수집 결과가 최신 순위를 덮어쓰지 못한다'
);
select throws_ok(
    $$update public.kbo_standings set standings = '[]' where season = 2026$$,
    '23514', null,
    '부분 스냅샷을 저장하지 못한다'
);
reset role;
select * from finish();
rollback;
