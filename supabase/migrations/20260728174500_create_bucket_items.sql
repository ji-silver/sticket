-- 티켓북별 직관 버킷리스트
create table public.bucket_items
(
    id             uuid primary key default gen_random_uuid(),
    ticket_book_id uuid        not null
        references public.ticket_books (id)
            on delete cascade,
    title          text        not null,
    is_completed   boolean     not null default false,
    display_order  integer     not null,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),

    constraint bucket_items_title_trimmed_check
        check (title = btrim(title)),

    constraint bucket_items_title_length_check
        check (char_length(title) between 1 and 50),

    constraint bucket_items_display_order_check
        check (display_order > 0)
);

create index bucket_items_ticket_book_order_idx
    on public.bucket_items (ticket_book_id, display_order, created_at);

create trigger bucket_items_set_updated_at
    before update
    on public.bucket_items
    for each row
execute function public.set_updated_at();

alter table public.bucket_items enable row level security;

revoke all
    on table public.bucket_items
    from anon, authenticated;

grant select, insert, update, delete
    on table public.bucket_items
    to authenticated;

create policy "Users can read their own bucket items"
    on public.bucket_items
    for select
    to authenticated
    using (
    exists (
        select 1
        from public.ticket_books
        where ticket_books.id = bucket_items.ticket_book_id
          and ticket_books.user_id = (select auth.uid())
    )
    );

create policy "Users can create their own bucket items"
    on public.bucket_items
    for insert
    to authenticated
    with check (
    exists (
        select 1
        from public.ticket_books
        where ticket_books.id = bucket_items.ticket_book_id
          and ticket_books.user_id = (select auth.uid())
    )
    );

create policy "Users can update their own bucket items"
    on public.bucket_items
    for update
    to authenticated
    using (
    exists (
        select 1
        from public.ticket_books
        where ticket_books.id = bucket_items.ticket_book_id
          and ticket_books.user_id = (select auth.uid())
    )
    )
    with check (
    exists (
        select 1
        from public.ticket_books
        where ticket_books.id = bucket_items.ticket_book_id
          and ticket_books.user_id = (select auth.uid())
    )
    );

create policy "Users can delete their own bucket items"
    on public.bucket_items
    for delete
    to authenticated
    using (
    exists (
        select 1
        from public.ticket_books
        where ticket_books.id = bucket_items.ticket_book_id
          and ticket_books.user_id = (select auth.uid())
    )
    );
