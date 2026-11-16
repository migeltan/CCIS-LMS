-- Signup rules (plan section C1):
--  1) only approved email domains / addresses can register,
--  2) every new auth user automatically gets a profiles row (role = student).
-- Teacher access still goes through request_teacher / approve_teacher.

-- ============ Allowlists (managed by admins) ============
create table public.allowed_email_domains (
  domain text primary key check (domain = lower(domain)),
  created_at timestamptz not null default now()
);

create table public.allowed_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- Student domain. Add the teacher/professor domain or single emails later (see notes).
insert into public.allowed_email_domains (domain) values ('iskolarngbayan.pup.edu.ph')
on conflict do nothing;

alter table public.allowed_email_domains enable row level security;
alter table public.allowed_emails enable row level security;

create policy "allowed_domains_admin" on public.allowed_email_domains for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "allowed_emails_admin" on public.allowed_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ 1) Block sign-ups from non-approved emails ============
create or replace function public.enforce_allowed_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(new.email, ''));
begin
  if v_email = '' then
    raise exception 'An email address is required';
  end if;

  if exists (select 1 from public.allowed_emails where email = v_email)
     or exists (select 1 from public.allowed_email_domains where domain = split_part(v_email, '@', 2)) then
    return new;
  end if;

  raise exception 'Sign-up is limited to school accounts. Ask an admin to add your email.';
end; $$;

create trigger enforce_allowed_email
before insert on auth.users
for each row execute function public.enforce_allowed_email();

-- ============ 2) Create the profile automatically ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this migration (role defaults to student).
insert into public.profiles (id, email, full_name)
select u.id, u.email,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''),
                nullif(u.raw_user_meta_data->>'name', ''),
                split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict do nothing;