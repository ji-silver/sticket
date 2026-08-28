begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
values
    (
        '00000000-0000-0000-0000-000000000000',
        '10000000-0000-0000-0000-000000000001',
        'authenticated',
        'authenticated',
        'harness-a@example.com',
        crypt('password', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        '20000000-0000-0000-0000-000000000002',
        'authenticated',
        'authenticated',
        'harness-b@example.com',
        crypt('password', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

insert into public.profiles (id, nickname, favorite_team_id)
values
    ('10000000-0000-0000-0000-000000000001', '테스트A', 'lg'),
    ('20000000-0000-0000-0000-000000000002', '테스트B', 'kia');

insert into public.ticket_books (id, user_id, cover_color)
values
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '#111111'
    ),
    (
        '22000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000002',
        '#222222'
    );

insert into public.tickets (id, ticket_book_id, game_key, memo)
values
    (
        '11100000-0000-0000-0000-000000000001',
        '11000000-0000-0000-0000-000000000001',
        'harness-20260801-doosan-lg-1',
        '사용자 A 기록'
    ),
    (
        '22200000-0000-0000-0000-000000000002',
        '22000000-0000-0000-0000-000000000002',
        'harness-20260802-kiwoom-kia-1',
        '사용자 B 기록'
    );

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
);

select is(
    (select count(*) from public.profiles),
    1::bigint,
    '사용자는 자신의 프로필만 조회한다'
);

select is(
    (select count(*) from public.ticket_books),
    1::bigint,
    '사용자는 자신의 티켓북만 조회한다'
);

select is(
    (select count(*) from public.tickets),
    1::bigint,
    '사용자는 자신의 티켓만 조회한다'
);

select is(
    (
        with changed as (
            update public.ticket_books
            set cover_color = '#FFFFFF'
            where id = '22000000-0000-0000-0000-000000000002'
            returning 1
        )
        select count(*) from changed
    ),
    0::bigint,
    '사용자는 다른 사용자의 티켓북을 수정하지 못한다'
);

reset role;

select is(
    (
        select cover_color
        from public.ticket_books
        where id = '22000000-0000-0000-0000-000000000002'
    ),
    '#222222',
    '차단된 수정은 원본 데이터를 보존한다'
);

select * from finish();

rollback;
