-- 정책은 로그인 전에 읽을 수 있어야 하지만, 앱 사용자가 최소 버전을 낮출 수는 없어야 한다.
create table public.app_update_policies (
    platform text primary key check (platform in ('ios', 'android')),
    enabled boolean not null default false,
    minimum_version text not null,
    message text not null default '스티켓을 계속 이용하려면 최신 버전으로 업데이트해 주세요.',
    constraint app_update_policies_message_check check (length(btrim(message)) > 0),
    -- CASE로 형식을 먼저 검사해 잘못된 문자열을 숫자로 변환하는 오류를 방지한다.
    constraint app_update_policies_version_check check (
        case when minimum_version ~ '^[0-9]{1,16}\.[0-9]{1,16}\.[0-9]{1,16}$' then
            split_part(minimum_version, '.', 1)::numeric <= 9007199254740991 and
            split_part(minimum_version, '.', 2)::numeric <= 9007199254740991 and
            split_part(minimum_version, '.', 3)::numeric <= 9007199254740991
        else false end
    )
);

alter table public.app_update_policies enable row level security;
revoke all on public.app_update_policies from anon, authenticated;
grant select on public.app_update_policies to anon, authenticated;
grant select, insert, update, delete on public.app_update_policies to service_role;
create policy "필수 업데이트 정책 공개 조회"
    on public.app_update_policies for select to anon, authenticated using (true);

-- 기능이 탑재되는 첫 배포에서는 차단을 켜지 않는다. 이후 실제 스토어 출시를 확인한 뒤 관리자가 설정한다.
insert into public.app_update_policies (platform, minimum_version)
values ('ios', '1.5.0');
