-- sns 로그인 -> 닉네임, 응원구단 -> KBO 구단 정보

-- kBO 팀 테이블 생성
create table public.teams
(
    id            text primary key,
    sport         text        not null,
    name          text        not null,
    short_name    text        not null,
    display_order smallint    not null check (display_order > 0),
    is_active     boolean     not null default true,
    created_at    timestamptz not null default now(),

    constraint teams_sport_name_key
        unique (sport, name),

    constraint teams_sport_short_name_key
        unique (sport, short_name),

    constraint teams_sport_display_order_key
        unique (sport, display_order)
);

-- KBO 10개 구단 등록
insert into public.teams (

                          id,
                          sport,
                          name,
                          short_name,
                          display_order)
values ('ssg', 'baseball', 'SSG 랜더스', 'SSG', 1),
       ('lg', 'baseball', 'LG 트윈스', 'LG', 2),
       ('doosan', 'baseball', '두산 베어스', '두산', 3),
       ('kia', 'baseball', 'KIA 타이거즈', 'KIA', 4),
       ('samsung', 'baseball', '삼성 라이온즈', '삼성', 5),
       ('lotte', 'baseball', '롯데 자이언츠', '롯데', 6),
       ('hanwha', 'baseball', '한화 이글스', '한화', 7),
       ('kiwoom', 'baseball', '키움 히어로즈', '키움', 8),
       ('kt', 'baseball', 'KT 위즈', 'KT', 9),
       ('nc', 'baseball', 'NC 다이노스', 'NC', 10);

create table public.profiles (
    --
    id uuid primary key
        references auth.users (id)
        on delete cascade,

    nickname text not null,
    favorite_team_id text
        references public.teams (id)
        on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint profiles_nickname_trimmed_check
        check (nickname = btrim(nickname)),

    constraint profiles_nickname_length_check
        check (char_length(nickname) between 2 and 10)
);

create function public.set_updated_at()
    returns trigger
    language plpgsql
set search_path = ''
as $$
begin
  new.updated_at
= now();
return new;
end;
$$;

create trigger profiles_set_updated_at
    before update
    on public.profiles
    for each row
    execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public;

alter table public.teams enable row level security;
alter table public.profiles enable row level security;

revoke all on table public.teams from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;

grant select
    on table public.teams
    to authenticated;

grant select, insert, update
    on table public.profiles
    to authenticated;

create
policy "Authenticated users can read active teams"
on public.teams
for
select
    to authenticated
    using (is_active);

create
policy "Users can read their own profile"
on public.profiles
for
select
    to authenticated
    using ((select auth.uid()) = id);

create
policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create
policy "Users can update their own profile"
on public.profiles
for
update
    to authenticated
    using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);