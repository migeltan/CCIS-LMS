-- ============ Helper functions (security definer avoids RLS recursion) ============
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher' and status = 'active'
  );
$$;

create or replace function public.teaches_section(p_section_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sections
    where id = p_section_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled(p_section_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments
    where section_id = p_section_id and student_id = auth.uid()
  );
$$;

create or replace function public.section_of_activity(p_activity_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select section_id from public.activities where id = p_activity_id;
$$;

create or replace function public.shares_section_with(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.sections s
    join public.enrollments e on e.section_id = s.id
    where (s.teacher_id = auth.uid() and e.student_id = p_profile_id)
       or (e.student_id = auth.uid() and s.teacher_id = p_profile_id)
  );
$$;

-- ============ Enable RLS on every table ============
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.sections enable row level security;
alter table public.enrollments enable row level security;
alter table public.announcements enable row level security;
alter table public.materials enable row level security;
alter table public.activities enable row level security;
alter table public.submissions enable row level security;
alter table public.attachments enable row level security;

-- ============ profiles ============
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or public.shares_section_with(id));

create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Users may not promote themselves (role/status change only via admin or RPC)
create or replace function public.protect_profile_columns()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.id is distinct from old.id then
      raise exception 'Only an admin can change role or status';
    end if;
  end if;
  return new;
end; $$;

create trigger protect_profile_columns
before update on public.profiles
for each row execute function public.protect_profile_columns();

-- ============ courses ============
create policy "courses_select" on public.courses for select to authenticated
  using (true);
create policy "courses_insert" on public.courses for insert to authenticated
  with check (public.is_teacher() or public.is_admin());
create policy "courses_update" on public.courses for update to authenticated
  using (public.is_teacher() or public.is_admin())
  with check (public.is_teacher() or public.is_admin());
create policy "courses_delete" on public.courses for delete to authenticated
  using (public.is_admin());

-- ============ sections ============
create policy "sections_select" on public.sections for select to authenticated
  using (teacher_id = auth.uid() or public.is_enrolled(id) or public.is_admin());
create policy "sections_insert" on public.sections for insert to authenticated
  with check ((public.is_teacher() and teacher_id = auth.uid()) or public.is_admin());
create policy "sections_update" on public.sections for update to authenticated
  using (teacher_id = auth.uid() or public.is_admin())
  with check (teacher_id = auth.uid() or public.is_admin());
create policy "sections_delete" on public.sections for delete to authenticated
  using (teacher_id = auth.uid() or public.is_admin());

-- ============ enrollments (students join only through join_section RPC) ============
create policy "enrollments_select" on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.teaches_section(section_id) or public.is_admin());
create policy "enrollments_delete" on public.enrollments for delete to authenticated
  using (student_id = auth.uid() or public.teaches_section(section_id) or public.is_admin());

-- ============ announcements ============
create policy "announcements_select" on public.announcements for select to authenticated
  using (public.teaches_section(section_id) or public.is_enrolled(section_id) or public.is_admin());
create policy "announcements_manage" on public.announcements for all to authenticated
  using (public.teaches_section(section_id) or public.is_admin())
  with check (public.teaches_section(section_id) or public.is_admin());

-- ============ materials ============
create policy "materials_select" on public.materials for select to authenticated
  using (public.teaches_section(section_id) or public.is_enrolled(section_id) or public.is_admin());
create policy "materials_manage" on public.materials for all to authenticated
  using (public.teaches_section(section_id) or public.is_admin())
  with check (public.teaches_section(section_id) or public.is_admin());

-- ============ activities ============
create policy "activities_select" on public.activities for select to authenticated
  using (public.teaches_section(section_id) or public.is_enrolled(section_id) or public.is_admin());
create policy "activities_manage" on public.activities for all to authenticated
  using (public.teaches_section(section_id) or public.is_admin())
  with check (public.teaches_section(section_id) or public.is_admin());

-- ============ submissions ============
create policy "submissions_select" on public.submissions for select to authenticated
  using (
    student_id = auth.uid()
    or public.teaches_section(public.section_of_activity(activity_id))
    or public.is_admin()
  );
create policy "submissions_insert" on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.is_enrolled(public.section_of_activity(activity_id))
  );
create policy "submissions_update" on public.submissions for update to authenticated
  using (
    (student_id = auth.uid() and public.is_enrolled(public.section_of_activity(activity_id)))
    or public.teaches_section(public.section_of_activity(activity_id))
    or public.is_admin()
  )
  with check (
    (student_id = auth.uid() and public.is_enrolled(public.section_of_activity(activity_id)))
    or public.teaches_section(public.section_of_activity(activity_id))
    or public.is_admin()
  );

-- Students may not set or change score, feedback, or grade_released
create or replace function public.protect_grade_columns()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon')
     and not public.teaches_section(public.section_of_activity(new.activity_id))
     and not public.is_admin() then
    if tg_op = 'INSERT' then
      if new.score is not null or new.feedback is not null or new.grade_released then
        raise exception 'Only the teacher can set grades';
      end if;
    else
      if new.score is distinct from old.score
         or new.feedback is distinct from old.feedback
         or new.grade_released is distinct from old.grade_released then
        raise exception 'Only the teacher can change grades';
      end if;
    end if;
  end if;
  return new;
end; $$;

create trigger protect_grade_columns
before insert or update on public.submissions
for each row execute function public.protect_grade_columns();

-- ============ attachments (visible if the parent row is visible) ============
create policy "attachments_select" on public.attachments for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.materials m where m.id = attachments.material_id)
    or exists (select 1 from public.activities a where a.id = attachments.activity_id)
    or exists (select 1 from public.submissions s where s.id = attachments.submission_id)
  );

create policy "attachments_manage" on public.attachments for all to authenticated
  using (
    public.is_admin()
    or (material_id is not null and public.teaches_section(
          (select m.section_id from public.materials m where m.id = material_id)))
    or (activity_id is not null and public.teaches_section(
          (select a.section_id from public.activities a where a.id = activity_id)))
    or (submission_id is not null and exists (
          select 1 from public.submissions s
          where s.id = submission_id and s.student_id = auth.uid()))
  )
  with check (
    public.is_admin()
    or (material_id is not null and public.teaches_section(
          (select m.section_id from public.materials m where m.id = material_id)))
    or (activity_id is not null and public.teaches_section(
          (select a.section_id from public.activities a where a.id = activity_id)))
    or (submission_id is not null and exists (
          select 1 from public.submissions s
          where s.id = submission_id and s.student_id = auth.uid()))
  );