-- KBO 경기 당시의 양 팀 선발 라인업 스냅샷
alter table public.games
    add column away_lineup jsonb not null default '[]'::jsonb,
    add column home_lineup jsonb not null default '[]'::jsonb,
    add column lineup_collected_at timestamptz;

alter table public.games
    add constraint games_away_lineup_array_check
        check (jsonb_typeof(away_lineup) = 'array'),
    add constraint games_home_lineup_array_check
        check (jsonb_typeof(home_lineup) = 'array');
