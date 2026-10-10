begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
    ('30000000-0000-0000-0000-000000000001', 'nickname-a@example.com'),
    ('30000000-0000-0000-0000-000000000002', 'nickname-b@example.com'),
    ('30000000-0000-0000-0000-000000000003', 'nickname-c@example.com');

insert into public.profiles (id, nickname, favorite_team_id) values
    ('30000000-0000-0000-0000-000000000001', 'Sticket', 'lg'),
    ('30000000-0000-0000-0000-000000000002', '직관팬', 'kia');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select throws_ok(
    $$insert into public.profiles (id, nickname, favorite_team_id)
      values ('30000000-0000-0000-0000-000000000003', 'Sticket', 'lg')$$,
    '23505', 'duplicate key value violates unique constraint "profiles_nickname_unique"',
    '가입할 때 다른 사용자의 닉네임을 사용할 수 없다'
);
select throws_ok(
    $$insert into public.profiles (id, nickname, favorite_team_id)
      values ('30000000-0000-0000-0000-000000000003', 'sticket', 'lg')$$,
    '23505', 'duplicate key value violates unique constraint "profiles_nickname_unique"',
    '영문 대소문자가 달라도 중복 닉네임으로 거절한다'
);
select lives_ok(
    $$insert into public.profiles (id, nickname, favorite_team_id)
      values ('30000000-0000-0000-0000-000000000003', '새직관팬', 'lg')$$,
    '사용하지 않은 닉네임으로 가입할 수 있다'
);
select is((select count(*) from public.profiles), 1::bigint, '중복 검사 때문에 다른 사용자의 프로필이 노출되지 않는다');

select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok(
    $$insert into public.profiles (id, nickname, favorite_team_id)
      values ('30000000-0000-0000-0000-000000000001', 'Sticket', 'kia')
      on conflict (id) do update set nickname = excluded.nickname, favorite_team_id = excluded.favorite_team_id$$,
    '본인의 닉네임을 유지하면서 응원 구단을 바꿀 수 있다'
);
select lives_ok(
    $$update public.profiles set nickname = 'STICKET'
      where id = '30000000-0000-0000-0000-000000000001'$$,
    '본인의 닉네임에서 영문 대소문자만 바꿀 수 있다'
);
select throws_ok(
    $$update public.profiles set nickname = '직관팬', favorite_team_id = 'lg'
      where id = '30000000-0000-0000-0000-000000000001'$$,
    '23505', 'duplicate key value violates unique constraint "profiles_nickname_unique"',
    '수정할 때도 다른 사용자의 닉네임을 사용할 수 없다'
);
select is((select nickname from public.profiles), 'STICKET', '중복으로 거절된 수정은 기존 닉네임을 보존한다');
select is((select favorite_team_id from public.profiles), 'kia', '중복으로 거절된 수정은 다른 프로필 정보도 보존한다');

reset role;
select * from finish();
rollback;
