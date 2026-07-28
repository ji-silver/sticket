-- 사용자가 만든 스포츠 티켓북
create table public.ticket_books
(
    id               uuid primary key     default gen_random_uuid(),

    user_id          uuid        not null
        references auth.users (id)
            on delete cascade,

    -- 현재는 야구만 실제 생성 가능
    sport            text        not null default 'baseball',

    cover_color      text        not null,

    cover_pattern    text        not null default 'solid'
        check (cover_pattern in ('solid', 'stripe')),

    -- 추후 Supabase Storage의 표지 사진 경로 저장
    cover_photo_path text,

    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),

    -- 한 사용자는 종목별로 티켓북 하나만 생성 가능
    constraint ticket_books_user_sport_key
        unique (user_id, sport),

    -- MVP에서는 야구 데이터만 저장 가능
    constraint ticket_books_sport_check
        check (sport = 'baseball')
);


-- 수정될 때 updated_at 자동 갱신
create trigger ticket_books_set_updated_at
    before update
    on public.ticket_books
    for each row
    execute function public.set_updated_at();


-- RLS 활성화
alter table public.ticket_books enable row level security;


-- 기본 접근 권한 제거
revoke all
    on table public.ticket_books
    from anon, authenticated;


-- 로그인한 사용자는 CRUD 가능
grant select, insert, update, delete
    on table public.ticket_books
    to authenticated;


-- 자신의 티켓북만 조회
create
policy "Users can read their own ticket books"
on public.ticket_books
for
select
    to authenticated
    using ((select auth.uid()) = user_id);


-- 자신의 티켓북만 생성
create
policy "Users can create their own ticket books"
on public.ticket_books
for insert
to authenticated
with check ((select auth.uid()) = user_id);


-- 자신의 티켓북만 수정
create
policy "Users can update their own ticket books"
on public.ticket_books
for
update
    to authenticated
    using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);


-- 자신의 티켓북만 삭제
create
policy "Users can delete their own ticket books"
on public.ticket_books
for delete
to authenticated
using ((select auth.uid()) = user_id);