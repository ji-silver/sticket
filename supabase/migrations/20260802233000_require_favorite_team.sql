-- 기존 미설정 프로필은 로그인 후 응원 구단을 선택할 수 있게 유지합니다.
-- NOT VALID 제약은 기존 행 검증만 미루고, 새로 생성하거나 수정하는 행에는 즉시 적용됩니다.
alter table public.profiles
    add constraint profiles_favorite_team_required_check
        check (favorite_team_id is not null)
        not valid;
