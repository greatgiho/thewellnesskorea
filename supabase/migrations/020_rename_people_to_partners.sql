-- Rename people domain → partners (Guide / Artist / Brand master)
-- sessions.instructor_id unchanged (session leader, not all partner kinds)

alter type public.person_kind rename to partner_kind;
alter type public.person_registration_status rename to partner_registration_status;

alter table public.people rename to partners;
alter table public.person_programs rename to partner_programs;
alter table public.partner_programs rename column person_id to partner_id;
alter table public.person_activity_regions rename to partner_activity_regions;
alter table public.partner_activity_regions rename column person_id to partner_id;
alter table public.journal_post_people rename to journal_post_partners;
alter table public.journal_post_partners rename column person_id to partner_id;

alter table public.sessions rename column person_program_id to partner_program_id;

alter trigger people_updated_at on public.partners rename to partners_updated_at;

-- partners RLS
drop policy if exists "public read published people" on public.partners;
drop policy if exists "admin all on people" on public.partners;
drop policy if exists "teacher read own people" on public.partners;
drop policy if exists "teacher insert own people" on public.partners;
drop policy if exists "teacher update own people" on public.partners;

create policy "public read published partners"
  on public.partners for select
  using (
    is_published = true
    and registration_status in ('admin', 'approved')
  );

create policy "admin all on partners"
  on public.partners for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "teacher read own partners"
  on public.partners for select
  to authenticated
  using (user_id = auth.uid());

create policy "teacher insert own partners"
  on public.partners for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and registration_status in ('draft', 'submitted')
    and is_published = false
    and not exists (
      select 1 from public.partners p where p.user_id = auth.uid()
    )
  );

create policy "teacher update own partners"
  on public.partners for update
  to authenticated
  using (user_id = auth.uid() and is_published = false)
  with check (user_id = auth.uid() and is_published = false);

-- partner_programs RLS
drop policy if exists "public read programs of published people" on public.partner_programs;
drop policy if exists "admin all on person_programs" on public.partner_programs;
drop policy if exists "teacher manage own programs" on public.partner_programs;

create policy "public read programs of published partners"
  on public.partner_programs for select
  using (
    exists (
      select 1 from public.partners p
      where p.id = partner_id
        and p.is_published = true
        and p.registration_status in ('admin', 'approved')
    )
  );

create policy "admin all on partner_programs"
  on public.partner_programs for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "teacher manage own partner programs"
  on public.partner_programs for all
  to authenticated
  using (
    exists (
      select 1 from public.partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

-- partner_activity_regions RLS
drop policy if exists "public read activity regions of published people" on public.partner_activity_regions;
drop policy if exists "admin all on person_activity_regions" on public.partner_activity_regions;
drop policy if exists "teacher read own activity regions" on public.partner_activity_regions;
drop policy if exists "teacher manage own activity regions" on public.partner_activity_regions;

create policy "public read activity regions of published partners"
  on public.partner_activity_regions for select
  using (
    exists (
      select 1 from public.partners p
      where p.id = partner_id
        and p.is_published = true
        and p.registration_status in ('admin', 'approved')
    )
  );

create policy "admin all on partner_activity_regions"
  on public.partner_activity_regions for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "teacher read own partner activity regions"
  on public.partner_activity_regions for select
  to authenticated
  using (
    exists (
      select 1 from public.partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

create policy "teacher manage own partner activity regions"
  on public.partner_activity_regions for all
  to authenticated
  using (
    exists (
      select 1 from public.partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

-- journal_post_partners RLS
drop policy if exists "public read journal post partners" on public.journal_post_partners;
drop policy if exists "admin all on journal post people" on public.journal_post_partners;

create policy "public read journal post partners"
  on public.journal_post_partners for select
  using (
    exists (
      select 1 from public.journal_posts jp
      where jp.id = journal_post_id and jp.is_published = true
    )
    and exists (
      select 1 from public.partners p
      where p.id = partner_id
        and p.is_published = true
        and p.registration_status in ('admin', 'approved')
    )
  );

create policy "admin all on journal post partners"
  on public.journal_post_partners for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- sessions: teacher RLS subquery
drop policy if exists "teacher read own published sessions" on public.sessions;

create policy "teacher read own published sessions"
  on public.sessions for select
  to authenticated
  using (
    not public.is_admin_user()
    and status = 'confirmed'
    and is_published = true
    and instructor_id in (
      select id from public.partners where user_id = auth.uid()
    )
  );
