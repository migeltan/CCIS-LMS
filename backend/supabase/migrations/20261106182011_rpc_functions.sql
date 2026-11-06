-- Student joins a section by code
create or replace function public.join_section(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_section_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select id into v_section_id
  from public.sections
  where join_code = upper(trim(p_code));

  if v_section_id is null then
    raise exception 'Invalid join code';
  end if;

  insert into public.enrollments (section_id, student_id)
  values (v_section_id, auth.uid())
  on conflict do nothing;

  return v_section_id;
end; $$;

-- Student asks to become a teacher
create or replace function public.request_teacher()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set status = 'pending_teacher'
  where id = auth.uid() and role = 'student';
end; $$;

-- Admin approves a teacher request
create or replace function public.approve_teacher(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.profiles
  set role = 'teacher', status = 'active'
  where id = p_user_id;
end; $$;

-- Admin rejects a teacher request
create or replace function public.reject_teacher(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.profiles
  set status = 'active'
  where id = p_user_id;
end; $$;

-- Only signed-in users may call these
revoke execute on function public.join_section(text) from public, anon;
revoke execute on function public.request_teacher() from public, anon;
revoke execute on function public.approve_teacher(uuid) from public, anon;
revoke execute on function public.reject_teacher(uuid) from public, anon;
grant execute on function public.join_section(text) to authenticated;
grant execute on function public.request_teacher() to authenticated;
grant execute on function public.approve_teacher(uuid) to authenticated;
grant execute on function public.reject_teacher(uuid) to authenticated;