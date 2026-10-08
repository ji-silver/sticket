-- 시즌별 최신 순위를 한 행으로 교체해 앱이 서로 다른 기준일의 구단 성적을 섞어 읽지 않는다.
create table public.kbo_standings (
    season smallint primary key check (season between 1982 and 2100),
    as_of_date date not null,
    standings jsonb not null,
    collected_at timestamptz not null default now(),
    constraint kbo_standings_season_date_check check (extract(year from as_of_date) = season),
    constraint kbo_standings_complete_check check (
        jsonb_typeof(standings) = 'array' and jsonb_array_length(standings) = 10
    )
);

-- 늦게 끝난 수집 작업이나 원본 사이트의 일시적 회귀가 최신 순위를 덮어쓰지 못하게 한다.
create function public.prevent_kbo_standings_date_regression()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.as_of_date < old.as_of_date then
        raise exception 'KBO 순위 기준일을 이전 날짜로 변경할 수 없습니다.';
    end if;
    return new;
end;
$$;

revoke all on function public.prevent_kbo_standings_date_regression() from public, anon, authenticated;
create trigger kbo_standings_prevent_date_regression
    before update on public.kbo_standings
    for each row execute function public.prevent_kbo_standings_date_regression();

alter table public.kbo_standings enable row level security;
revoke all on public.kbo_standings from anon, authenticated;
grant select on public.kbo_standings to authenticated;
grant select, insert, update, delete on public.kbo_standings to service_role;
create policy "로그인 사용자는 KBO 순위를 조회할 수 있습니다"
    on public.kbo_standings for select to authenticated using (true);
