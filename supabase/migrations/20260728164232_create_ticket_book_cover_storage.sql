insert into storage.buckets (id,
                             name,
                             public,
                             file_size_limit,
                             allowed_mime_types)
values ('ticket-book-covers',
        'ticket-book-covers',
        false,
        5242880,
        array[
            'image/jpeg',
        'image/png',
        'image/heic',
        'image/heif'
            ]);


create
policy "Users can read their own ticket book covers"
on storage.objects
for
select
    to authenticated
    using (
    bucket_id = 'ticket-book-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    );



create
policy "Users can upload their own ticket book covers"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'ticket-book-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create
policy "Users can update their own ticket book covers"
on storage.objects
for
update
    to authenticated
    using (
    bucket_id = 'ticket-book-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    )
with check (
    bucket_id = 'ticket-book-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    );


create
policy "Users can delete their own ticket book covers"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'ticket-book-covers'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
);