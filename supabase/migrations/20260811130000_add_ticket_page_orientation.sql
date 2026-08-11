-- 경기 기록과 다이어리가 공유하는 페이지 방향
alter table public.tickets
    add column page_orientation text;

alter table public.tickets
    add constraint tickets_page_orientation_check
        check (page_orientation in ('portrait', 'landscape'));

-- 이미 방향을 선택했거나 세로형으로 꾸민 기존 다이어리는 그대로 유지
update public.tickets
set page_orientation = case
    when diary_data ->> 'orientation' in ('portrait', 'landscape')
        then diary_data ->> 'orientation'
    when jsonb_array_length(coalesce(diary_data -> 'items', '[]'::jsonb)) > 0
        or nullif(diary_data ->> 'drawingPath', '') is not null
        then 'portrait'
    else null
end;
