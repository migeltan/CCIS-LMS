-- Private buckets, 10 MB cap, PDF/PPTX/DOCX/images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('materials', 'materials', false, 10485760, array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg'
  ]),
  ('submissions', 'submissions', false, 10485760, array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg'
  ])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Path convention for materials:   <section_id>/<file name>
create policy "materials_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'materials'
    and (
      public.teaches_section(((storage.foldername(name))[1])::uuid)
      or public.is_enrolled(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "materials_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'materials'
    and public.teaches_section(((storage.foldername(name))[1])::uuid)
  );

create policy "materials_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'materials'
    and public.teaches_section(((storage.foldername(name))[1])::uuid)
  );

create policy "materials_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'materials'
    and public.teaches_section(((storage.foldername(name))[1])::uuid)
  );

-- Path convention for submissions:  <section_id>/<student_id>/<file name>
create policy "submissions_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.teaches_section(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "submissions_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_enrolled(((storage.foldername(name))[1])::uuid)
  );

create policy "submissions_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[2] = auth.uid()::text
  );