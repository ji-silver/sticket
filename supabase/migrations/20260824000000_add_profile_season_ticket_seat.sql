alter table public.profiles
    add column season_ticket_seat_name text,
    add column season_ticket_season smallint,
    add column season_ticket_team_id text
        references public.teams (id);

alter table public.profiles
    add constraint profiles_season_ticket_seat_check
        check (
            (
                season_ticket_seat_name is null
                and season_ticket_season is null
                and season_ticket_team_id is null
            )
            or (
                season_ticket_seat_name is not null
                and season_ticket_season is not null
                and season_ticket_team_id is not null
                and season_ticket_seat_name = btrim(season_ticket_seat_name)
                and char_length(season_ticket_seat_name) between 1 and 100
                and season_ticket_season between 1982 and 2100
            )
        );

comment on column public.profiles.season_ticket_seat_name is
    '시즌권의 기본 좌석 정보';
comment on column public.profiles.season_ticket_season is
    '시즌권이 적용되는 시즌';
comment on column public.profiles.season_ticket_team_id is
    '시즌권이 적용되는 홈 구단';

notify pgrst, 'reload schema';
