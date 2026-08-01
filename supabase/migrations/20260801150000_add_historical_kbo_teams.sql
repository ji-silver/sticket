-- 2015년 이후 KBO 경기에서 사용하는 과거 구단명
insert into public.teams (
    id,
    sport,
    name,
    short_name,
    display_order,
    is_active
)
values
    ('sk', 'baseball', 'SK 와이번스', 'SK', 11, false),
    ('nexen', 'baseball', '넥센 히어로즈', '넥센', 12, false);

-- 과거 경기 조회 시 비활성 구단 정보도 조인할 수 있어야 합니다.
drop policy if exists "Authenticated users can read active teams"
    on public.teams;

create policy "Authenticated users can read teams"
on public.teams
for select
to authenticated
using (true);
