begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select is((select enabled from public.app_update_policies where platform = 'ios'), false, '첫 배포에서는 필수 업데이트를 활성화하지 않는다');
select is((select minimum_version from public.app_update_policies where platform = 'ios'), '1.5.0', '초기 최소 버전은 현재 출시 버전이다');
select is((select count(*) from public.app_update_policies where platform = 'android'), 0::bigint, 'Android 정책은 활성화하지 않는다');

set local role anon;
select is((select count(*) from public.app_update_policies), 1::bigint, '로그인 전에도 필수 업데이트 정책을 조회한다');
select throws_ok($$update public.app_update_policies set enabled = true where platform = 'ios'$$, '42501', null, '로그인 전에는 정책을 수정하지 못한다');
select throws_ok($$insert into public.app_update_policies (platform, minimum_version) values ('android', '1.0.0')$$, '42501', null, '로그인 전에는 정책을 추가하지 못한다');
select throws_ok($$delete from public.app_update_policies$$, '42501', null, '로그인 전에는 정책을 삭제하지 못한다');

set local role authenticated;
select is((select count(*) from public.app_update_policies), 1::bigint, '로그인 후에도 필수 업데이트 정책을 조회한다');
select throws_ok($$update public.app_update_policies set enabled = true where platform = 'ios'$$, '42501', null, '로그인 사용자는 필수 업데이트를 바꾸지 못한다');
select throws_ok($$insert into public.app_update_policies (platform, minimum_version) values ('android', '1.0.0')$$, '42501', null, '로그인 사용자는 정책을 추가하지 못한다');
select throws_ok($$delete from public.app_update_policies$$, '42501', null, '로그인 사용자는 정책을 삭제하지 못한다');

set local role service_role;
select lives_ok($$update public.app_update_policies set enabled = true, minimum_version = '1.6.0' where platform = 'ios'$$, '관리자는 특정 출시 버전을 필수로 지정할 수 있다');
select throws_ok($$update public.app_update_policies set minimum_version = '1.bad.0'$$, '23514', null, '잘못된 버전은 정책에 저장하지 못한다');
select throws_ok($$update public.app_update_policies set minimum_version = '9007199254740992.0.0'$$, '23514', null, '앱에서 정확하게 비교할 수 없는 숫자는 저장하지 못한다');
select throws_ok($$update public.app_update_policies set message = '   '$$, '23514', null, '빈 안내 문구는 저장하지 못한다');
reset role;
select * from finish();
rollback;
