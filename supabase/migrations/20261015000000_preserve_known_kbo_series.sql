-- 원본 비고가 비거나 해석되지 않은 재수집은 확인된 세부 단계를 지우지 않는다.
-- DB에서 기존 행과 비교해 여러 수집 작업이 겹쳐도 같은 보존 규칙을 적용한다.
create function public.preserve_known_kbo_series()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.series_type = 'POSTSEASON'
       and old.series_type in ('WILDCARD', 'SEMI_PLAYOFF', 'PLAYOFF', 'KOREAN_SERIES') then
        new.series_type := old.series_type;
    end if;
    -- 점수·상태와 새로 확인된 세부 단계의 정정은 그대로 반영한다.
    return new;
end;
$$;

revoke all on function public.preserve_known_kbo_series() from public, anon, authenticated;
create trigger games_preserve_known_kbo_series
    before update of series_type on public.games
    for each row execute function public.preserve_known_kbo_series();
