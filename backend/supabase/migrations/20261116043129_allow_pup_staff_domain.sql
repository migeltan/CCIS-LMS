-- PUP staff (teachers, admins) sign up with @pup.edu.ph; students stay on @iskolarngbayan.pup.edu.ph.
-- New accounts still start as 'student': teacher access needs admin approval (request_teacher / approve_teacher).
insert into public.allowed_email_domains (domain) values ('pup.edu.ph')
on conflict do nothing;