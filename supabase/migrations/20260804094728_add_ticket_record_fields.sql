alter table public.tickets
    add column rating numeric(2, 1),
    add column memo text,
    add column foods text[] not null default '{}';

-- 별점은 입력하지 않거나 0.5 단위
alter table public.tickets
    add constraint tickets_rating_check
        check (
            rating is null
                or (
                rating between 0.5 and 5.0
                    and mod(rating, 0.5) = 0
                )
            );

alter table public.tickets
    add constraint tickets_memo_check
        check (
            memo is null
                or (
                memo = btrim(memo)
                    and char_length(memo) between 1 and 300
                )
            );

-- 야구 푸드 10개까지
alter table public.tickets
    add constraint tickets_foods_count_check
        check (cardinality(foods) <= 10);