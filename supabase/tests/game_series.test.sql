begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

set local role service_role;

select lives_ok(
    format(
        $$insert into public.games
          (game_key, season, series_type, game_date, away_team_id, home_team_id, status)
          values (%L, 2026, %L, '2026-10-14', 'doosan', 'lg', 'SCHEDULED')$$,
        'series-test-' || series_type,
        series_type
    ),
    series_type || ' 경기를 저장할 수 있다'
)
from unnest(array[
    'PRESEASON', 'REGULAR', 'POSTSEASON',
    'WILDCARD', 'SEMI_PLAYOFF', 'PLAYOFF', 'KOREAN_SERIES'
]) as allowed(series_type);

select throws_ok(
    $$insert into public.games
      (game_key, season, series_type, game_date, away_team_id, home_team_id, status)
      values ('series-test-unknown', 2026, 'UNKNOWN', '2026-10-14', 'doosan', 'lg', 'SCHEDULED')$$,
    '23514', null,
    '확인되지 않은 경기 종류는 저장하지 못한다'
);

-- 수집기가 같은 경기 키로 재저장해도 확인된 단계만 보존하고 점수·상태는 갱신한다.
insert into public.games
    (game_key, season, series_type, game_date, away_team_id, home_team_id, status, away_score, home_score)
select 'series-test-' || series_type, 2026, 'POSTSEASON', '2026-10-14',
       'doosan', 'lg', 'FINISHED', 0, 17
from unnest(array['WILDCARD', 'SEMI_PLAYOFF', 'PLAYOFF', 'KOREAN_SERIES']) as known(series_type)
on conflict (game_key) do update
    set series_type = excluded.series_type,
        away_score = excluded.away_score,
        home_score = excluded.home_score,
        status = excluded.status;

select is(
    (select games.series_type from public.games where game_key = 'series-test-' || expected.series_type),
    expected.series_type,
    expected.series_type || ' 단계는 단계 미상인 재수집 결과로 덮어쓰지 않는다'
)
from unnest(array['WILDCARD', 'SEMI_PLAYOFF', 'PLAYOFF', 'KOREAN_SERIES']) as expected(series_type);

select is(
    (select home_score::text || ':' || status from public.games where game_key = 'series-test-WILDCARD'),
    '17:FINISHED',
    '단계를 보존해도 새 점수와 경기 상태는 갱신한다'
);

update public.games set series_type = 'KOREAN_SERIES' where game_key = 'series-test-POSTSEASON';
select is(
    (select series_type from public.games where game_key = 'series-test-POSTSEASON'),
    'KOREAN_SERIES',
    '단계 미상인 기존 경기는 확인된 세부 단계로 보완한다'
);

update public.games set series_type = 'PLAYOFF' where game_key = 'series-test-SEMI_PLAYOFF';
select is(
    (select series_type from public.games where game_key = 'series-test-SEMI_PLAYOFF'),
    'PLAYOFF',
    '새 공식 세부 단계로 기존 분류를 정정할 수 있다'
);

update public.games set series_type = 'POSTSEASON' where game_key = 'series-test-REGULAR';
select is(
    (select series_type from public.games where game_key = 'series-test-REGULAR'),
    'POSTSEASON',
    '세부 단계가 아닌 기존 값의 변경은 막지 않는다'
);

reset role;
select * from finish();
rollback;
