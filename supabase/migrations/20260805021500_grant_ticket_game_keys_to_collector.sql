-- 수집기가 기존 티켓의 경기 라인업만 보충할 수 있도록 경기 키만 허용
grant select (game_key)
    on public.tickets
    to service_role;
