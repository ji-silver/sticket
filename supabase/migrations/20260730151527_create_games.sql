-- KBO에서 수집한 경기 일정과 결과
create table public.games
(
    -- Sticket이 생성하는 고유 경기 키
    -- 예: 20260701-lotte-doosan-1
    game_key            text primary key,

    -- KBO 게임센터에서 제공하는 경기 ID
    -- 취소 경기 등에는 없을 수 있음
    source_game_id      text,

    -- 추후 다른 스포츠를 지원할 수 있도록 종목 저장
    -- MVP에서는 야구만 허용
    sport               text        not null default 'baseball',

    season              smallint    not null,

    series_type         text        not null,

    game_date           date        not null,

    -- 경기 시간이 미정인 경우를 고려해 null 허용
    start_time          time,

    away_team_id        text        not null
        references public.teams (id)
            on delete restrict,

    home_team_id        text        not null
        references public.teams (id)
            on delete restrict,

    -- 경기 전, 취소, 연기 경기에는 점수가 없으므로 null 허용
    away_score          smallint,

    home_score          smallint,

    -- 경기장이 미정인 경우를 고려해 null 허용
    stadium_name        text,

    status              text        not null,

    cancellation_reason text,

    -- 마지막으로 크롤링된 시각
    last_collected_at   timestamptz not null default now(),

    created_at          timestamptz not null default now(),

    updated_at          timestamptz not null default now(),

    constraint games_source_game_id_key
        unique (source_game_id),

    constraint games_sport_check
        check (sport = 'baseball'),

    constraint games_season_check
        check (season between 1982 and 2100),

    constraint games_series_type_check
        check (
            series_type in (
                            'PRESEASON',
                            'REGULAR',
                            'POSTSEASON'
                )
            ),

    constraint games_status_check
        check (
            status in (
                       'SCHEDULED',
                       'IN_PROGRESS',
                       'FINISHED',
                       'CANCELLED',
                       'POSTPONED',
                       'UNKNOWN'
                )
            ),

    constraint games_different_teams_check
        check (away_team_id <> home_team_id),

    constraint games_away_score_check
        check (away_score is null or away_score >= 0),

    constraint games_home_score_check
        check (home_score is null or home_score >= 0),

    -- 원정팀 점수와 홈팀 점수는 함께 존재하거나 함께 없어야 함
    constraint games_score_pair_check
        check (
            (away_score is null and home_score is null)
                or
            (away_score is not null and home_score is not null)
            )
);


-- 티켓 생성 화면에서 날짜로 경기를 조회하므로 인덱스 추가
create index games_game_date_idx
    on public.games (game_date);


-- 경기 정보가 수정될 때 updated_at 자동 갱신
create trigger games_set_updated_at
    before update
    on public.games
    for each row
    execute function public.set_updated_at();


-- RLS 활성화
alter table public.games enable row level security;


-- 앱 사용자의 기본 권한 제거
revoke all
    on table public.games
    from anon, authenticated;


-- 로그인한 사용자는 경기 조회만 가능
grant select
    on table public.games
    to authenticated;


-- 서버에서 실행되는 수집기만 경기 데이터를 변경할 수 있음
grant select, insert, update, delete
    on table public.games
    to service_role;


-- 로그인한 사용자는 모든 경기 정보를 조회할 수 있음
create
policy "Authenticated users can read games"
on public.games
for
select
    to authenticated
    using (true);