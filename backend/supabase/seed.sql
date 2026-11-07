-- ============ Demo auth users (school domain, so the email trigger accepts them) ============
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'demo.admin@iskolarngbayan.pup.edu.ph',
   extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Admin"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'demo.teacher@iskolarngbayan.pup.edu.ph',
   extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Teacher"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'demo.student1@iskolarngbayan.pup.edu.ph',
   extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Student One"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'demo.student2@iskolarngbayan.pup.edu.ph',
   extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Student Two"}',
   now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email', now(), now(), now()
from auth.users u
where u.id in (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000004'
);

-- ============ Profiles (works whether or not the auth trigger already created them) ============
insert into public.profiles (id, full_name, email, role)
select u.id, u.raw_user_meta_data->>'full_name', u.email, 'student'
from auth.users u
on conflict (id) do nothing;

update public.profiles set role = 'admin'   where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.profiles set role = 'teacher' where id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- ============ Demo content ============
insert into public.courses (id, code, title) values
  ('cccccccc-0000-0000-0000-000000000001', 'INTE 301', 'Systems Integration and Architecture');

insert into public.sections (id, course_id, teacher_id, name, join_code, term) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000002', 'BSIT 3-1', 'DEMO01', '1st Semester 2026-2027');

insert into public.enrollments (section_id, student_id) values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003');

insert into public.announcements (id, section_id, body) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
   'Welcome to INTE 301! Check Classwork for the first activity.');

insert into public.materials (id, section_id, title, description, link_url) values
  ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
   'Course Syllabus', 'Read before the first meeting.', 'https://example.com/syllabus');

insert into public.activities (id, section_id, title, instructions, due_at, points, form_url) values
  ('11111111-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
   'Activity 1: System Architecture Diagram',
   'Submit a diagram of a system you know, with a short explanation.',
   now() + interval '3 days', 100, null);

insert into public.submissions (id, activity_id, student_id, answer_text, status, score, feedback, grade_released) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000003', 'See my diagram link.', 'graded', 92,
   'Clear and well organized.', true);