-- 구단
alter policy "Authenticated users can read teams"
    on public.teams
    rename to "로그인 사용자는 구단을 조회할 수 있음";

-- 프로필
alter policy "Users can read their own profile"
    on public.profiles
    rename to "사용자는 자신의 프로필을 조회할 수 있음";

alter policy "Users can create their own profile"
    on public.profiles
    rename to "사용자는 자신의 프로필을 생성할 수 있음";

alter policy "Users can update their own profile"
    on public.profiles
    rename to "사용자는 자신의 프로필을 수정할 수 있음";

-- 티켓북
alter policy "Users can read their own ticket books"
    on public.ticket_books
    rename to "사용자는 자신의 티켓북을 조회할 수 있음";

alter policy "Users can create their own ticket books"
    on public.ticket_books
    rename to "사용자는 자신의 티켓북을 생성할 수 있음";

alter policy "Users can update their own ticket books"
    on public.ticket_books
    rename to "사용자는 자신의 티켓북을 수정할 수 있음";

alter policy "Users can delete their own ticket books"
    on public.ticket_books
    rename to "사용자는 자신의 티켓북을 삭제할 수 있음";

-- 버킷리스트
alter policy "Users can read their own bucket items"
    on public.bucket_items
    rename to "사용자는 자신의 버킷리스트를 조회할 수 있음";

alter policy "Users can create their own bucket items"
    on public.bucket_items
    rename to "사용자는 자신의 버킷리스트를 생성할 수 있음";

alter policy "Users can update their own bucket items"
    on public.bucket_items
    rename to "사용자는 자신의 버킷리스트를 수정할 수 있음";

alter policy "Users can delete their own bucket items"
    on public.bucket_items
    rename to "사용자는 자신의 버킷리스트를 삭제할 수 있음";

-- KBO 경기
alter policy "Authenticated users can read games"
    on public.games
    rename to "로그인 사용자는 KBO 경기를 조회할 수 있음";
