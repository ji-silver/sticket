-- 기존 중복 닉네임은 사용자의 선택 없이 바꾸지 않는다.
-- 중복이 남아 있으면 배포를 중단하고 정리한 뒤 다시 적용해야 한다.
do $$
begin
    if exists (
        select 1 from public.profiles
        group by lower(btrim(nickname))
        having count(*) > 1
    ) then
        raise exception '기존 프로필에 중복 닉네임이 있어 고유 제약을 적용할 수 없습니다.'
            using hint = '영문 대소문자와 앞뒤 공백을 제외한 중복 닉네임을 먼저 정리해 주세요.';
    end if;
end;
$$;

-- 화면에서 사전 조회만 하면 동시 저장을 막을 수 없으므로 DB가 최종 검사한다.
-- 표시할 닉네임은 유지하고 비교할 때만 영문 대소문자와 앞뒤 공백을 무시한다.
create unique index profiles_nickname_unique
    on public.profiles (lower(btrim(nickname)));
