-- 앱을 우회하더라도 한국 기준 미래 경기의 티켓은 저장할 수 없습니다.
drop policy if exists "사용자는 자신의 티켓을 생성할 수 있음"
    on public.tickets;

create policy "사용자는 자신의 티켓을 생성할 수 있음"
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
        and exists (
            select 1
            from public.games
            where games.game_key = tickets.game_key
              and games.game_date <= (now() at time zone 'Asia/Seoul')::date
        )
    );

drop policy if exists "사용자는 자신의 티켓을 수정할 수 있음"
    on public.tickets;

create policy "사용자는 자신의 티켓을 수정할 수 있음"
    on public.tickets
    for update
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
        and exists (
            select 1
            from public.games
            where games.game_key = tickets.game_key
              and games.game_date <= (now() at time zone 'Asia/Seoul')::date
        )
    );
