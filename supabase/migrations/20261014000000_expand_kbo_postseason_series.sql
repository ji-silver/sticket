-- 기존 POSTSEASON 경기는 재수집할 때 공식 세부 단계로 갱신한다.
-- 기존 기록을 삭제하거나 날짜로 분류하지 않고 허용하는 경기 종류만 확장한다.
alter table public.games
    drop constraint games_series_type_check,
    add constraint games_series_type_check check (
        series_type in (
            'PRESEASON',
            'REGULAR',
            'POSTSEASON',
            'WILDCARD',
            'SEMI_PLAYOFF',
            'PLAYOFF',
            'KOREAN_SERIES'
        )
    );
