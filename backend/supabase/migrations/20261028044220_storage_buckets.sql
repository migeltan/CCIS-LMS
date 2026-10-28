-- Two private buckets: materials (teacher uploads) and submissions (student uploads).
-- Cap at 10 MB per file and allow only PDF, PowerPoint, Word, and images.
-- Access policies on storage.objects come later from the DB role's migration.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('materials', 'materials', false, 10485760, array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]),
  ('submissions', 'submissions', false, 10485760, array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ])
on conflict (id) do nothing;