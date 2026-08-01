-- 사용자가 실제로 직관한 경기의 티켓
create table public.tickets
(
    id                  uuid primary key     default gen_random_uuid(),

    -- 티켓이 들어갈 티켓북 (티켓북 삭제 시 티켓도 같이 삭제)
    ticket_book_id      uuid        not null
        references public.ticket_books (id)
            on delete cascade,

    -- KBO에서 수집한 경기
    game_key            text        not null
        references public.games (game_key)
            on delete restrict,

    -- 좌석 정보는 선택 사항
    seat_name           text,

    -- Supabase Storage에 저장된 원본 티켓 이미지 경로
    original_photo_path text,

    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    -- 같은 티켓북에는 같은 경기를 한 번만 등록
    constraint tickets_ticket_book_game_key
        unique (ticket_book_id, game_key),

    -- 좌석 정보가 있다면 공백 제거된 1~100자만 허용
    constraint tickets_seat_name_check
        check (
            seat_name is null
                or (
                seat_name = btrim(seat_name)
                    and char_length(seat_name) between 1 and 100
                )
            ),

    -- 사진 경로가 있다면 빈 문자열은 허용하지 않음
    constraint tickets_original_photo_path_check
        check (
            original_photo_path is null
                or char_length(btrim(original_photo_path)) > 0
            )
);


-- 티켓북별 티켓 목록 조회 최적화
create index tickets_ticket_book_created_at_idx
    on public.tickets (ticket_book_id, created_at desc);


-- 티켓 수정 시 updated_at 자동 갱신
create trigger tickets_set_updated_at
    before update
    on public.tickets
    for each row
    execute function public.set_updated_at();


-- Row Level Security 활성화
alter table public.tickets enable row level security;


-- 기본 접근 권한 제거
revoke all
    on table public.tickets
    from anon, authenticated;


-- 로그인 사용자에게 CRUD 권한 부여
-- 실제 접근 범위는 아래 RLS 정책에서 제한
grant select, insert, update, delete
    on table public.tickets
    to authenticated;


-- 자신이 소유한 티켓북의 티켓만 조회
create
policy "사용자는 자신의 티켓을 조회할 수 있음"
    on public.tickets
    for
select
    to authenticated
    using (
    exists (
    select 1
    from public.ticket_books
    where ticket_books.id = tickets.ticket_book_id
    and ticket_books.user_id = (select auth.uid())
    )
    );


-- 자신이 소유한 티켓북에만 티켓 생성
create
policy "사용자는 자신의 티켓을 생성할 수 있음"
    on public.tickets
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.ticket_books
            where ticket_books.id = tickets.ticket_book_id
              and ticket_books.user_id = (select auth.uid())
        )
    );


-- 자신이 소유한 티켓만 수정
create
policy "사용자는 자신의 티켓을 수정할 수 있음"
    on public.tickets
    for
update
    to authenticated
    using (
    exists (
    select 1
    from public.ticket_books
    where ticket_books.id = tickets.ticket_book_id
    and ticket_books.user_id = (select auth.uid())
    )
    )
with check (
    exists (
    select 1
    from public.ticket_books
    where ticket_books.id = tickets.ticket_book_id
    and ticket_books.user_id = (select auth.uid())
    )
    );


-- 자신이 소유한 티켓만 삭제
create
policy "사용자는 자신의 티켓을 삭제할 수 있음"
    on public.tickets
    for delete
to authenticated
    using (
        exists (
            select 1
            from public.ticket_books
            where ticket_books.id = tickets.ticket_book_id
              and ticket_books.user_id = (select auth.uid())
        )
    );


-- 원본 티켓 이미지를 보관할 비공개 Storage 버킷
insert into storage.buckets
(id,
 name,
 public,
 file_size_limit,
 allowed_mime_types)
values ('ticket-originals',
        'ticket-originals',
        false,
        10485760,
        array[
            'image/jpeg'
            ]);


-- 자신의 폴더에 저장된 원본 티켓 이미지만 조회
create
policy "사용자는 자신의 원본 티켓을 조회할 수 있음"
    on storage.objects
    for
select
    to authenticated
    using (
    bucket_id = 'ticket-originals'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    );


-- 자신의 사용자 ID 폴더에만 원본 티켓 이미지 업로드
create
policy "사용자는 자신의 원본 티켓을 업로드할 수 있음"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'ticket-originals'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );


-- 자신의 원본 티켓 이미지만 삭제
create
policy "사용자는 자신의 원본 티켓을 삭제할 수 있음"
    on storage.objects
    for delete
to authenticated
    using (
        bucket_id = 'ticket-originals'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );