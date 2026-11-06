-- Join code generator (used as a column default)
create or replace function public.generate_join_code()
returns text language sql as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  status text not null default 'active' check (status in ('active', 'pending_teacher', 'suspended')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  name text not null,
  join_code text not null unique default public.generate_join_code(),
  term text,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  section_id uuid not null references public.sections(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (section_id, student_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null,
  description text,
  link_url text,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null,
  instructions text,
  due_at timestamptz,
  points int not null default 100,
  form_url text,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'graded')),
  score numeric,
  feedback text,
  grade_released boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique (activity_id, student_id)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(material_id, activity_id, submission_id) = 1)
);

create index sections_course_id_idx on public.sections(course_id);
create index sections_teacher_id_idx on public.sections(teacher_id);
create index enrollments_student_id_idx on public.enrollments(student_id);
create index announcements_section_id_idx on public.announcements(section_id);
create index materials_section_id_idx on public.materials(section_id);
create index activities_section_id_idx on public.activities(section_id);
create index submissions_activity_id_idx on public.submissions(activity_id);
create index submissions_student_id_idx on public.submissions(student_id);
create index attachments_material_id_idx on public.attachments(material_id);
create index attachments_activity_id_idx on public.attachments(activity_id);
create index attachments_submission_id_idx on public.attachments(submission_id);