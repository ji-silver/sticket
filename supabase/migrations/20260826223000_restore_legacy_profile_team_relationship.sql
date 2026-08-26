alter table public.profiles
    drop constraint if exists profiles_season_ticket_team_id_fkey;

alter table public.profiles
    add constraint profiles_season_ticket_team_matches_favorite_check
    check (
        season_ticket_team_id is null
        or season_ticket_team_id is not distinct from favorite_team_id
    );

notify pgrst, 'reload schema';
