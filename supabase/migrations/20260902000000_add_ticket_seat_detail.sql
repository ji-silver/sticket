alter table public.tickets
    add column seat_detail text,
    add constraint tickets_seat_detail_check
        check (
            seat_detail is null
                or (
                seat_detail = btrim(seat_detail)
                    and char_length(seat_detail) between 1 and 100
                )
            );

comment on column public.tickets.seat_detail is
    '좌석의 블록, 열, 번호 등 선택 입력 정보';
