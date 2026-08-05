-- 티켓 한 개에 해당하는 다이어리 편집 정보를 JSON으로 저장
-- version은 다이어리 저장 형식이 바뀔 떄 구분
alter table public.tickets
    add column diary_data jsonb not null
        default '{
          "version": 1,
          "paperType": "plain",
          "items": [],
          "drawingPath": null
        }'::jsonb;


-- diary_data에는 JSON 객체만 저장할 수 있음
alter table public.tickets
    add constraint tickets_diary_data_object_check
        check (jsonb_typeof(diary_data) = 'object');


-- 다이어리 사진과 PencilKit 그림을 저장할 비공개 버킷
insert into storage.buckets (id,
                             name,
                             public,
                             file_size_limit,
                             allowed_mime_types)
values ('ticket-diaries',
        'ticket-diaries',
        false,
        10485760,
        array[
            'image/jpeg',
        'application/octet-stream'
            ]);


-- 자신의 폴더에 저장된 다이어리 파일만 조회
create
policy "사용자는 자신의 다이어리 파일을 조회할 수 있음"
    on storage.objects
    for
select
    to authenticated
    using (
    bucket_id = 'ticket-diaries'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    );


-- 자신의 사용자 ID 폴더에만 다이어리 파일 업로드
create
policy "사용자는 자신의 다이어리 파일을 업로드할 수 있음"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'ticket-diaries'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );


-- 자신의 다이어리 파일만 수정
create
policy "사용자는 자신의 다이어리 파일을 수정할 수 있음"
    on storage.objects
    for
update
    to authenticated
    using (
    bucket_id = 'ticket-diaries'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    )
with check (
    bucket_id = 'ticket-diaries'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    );


-- 자신의 다이어리 파일만 삭제
create
policy "사용자는 자신의 다이어리 파일을 삭제할 수 있음"
    on storage.objects
    for delete
to authenticated
    using (
        bucket_id = 'ticket-diaries'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
    );