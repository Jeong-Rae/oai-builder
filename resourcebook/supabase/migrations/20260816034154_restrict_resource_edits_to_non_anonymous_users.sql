drop policy "Signed-in users can add resources" on public.resources;
drop policy "Signed-in users can edit resources" on public.resources;
drop policy "Signed-in users can delete resources" on public.resources;

create policy "Signed-in users can add resources"
on public.resources for insert to authenticated
with check (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false');

create policy "Signed-in users can edit resources"
on public.resources for update to authenticated
using (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false')
with check (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false');

create policy "Signed-in users can delete resources"
on public.resources for delete to authenticated
using (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false');
