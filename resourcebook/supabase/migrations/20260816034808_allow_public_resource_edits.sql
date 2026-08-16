grant insert, update, delete on public.resources to anon;

drop policy "Signed-in users can add resources" on public.resources;
drop policy "Signed-in users can edit resources" on public.resources;
drop policy "Signed-in users can delete resources" on public.resources;

create policy "Anyone can add resources"
on public.resources for insert to anon, authenticated with check (true);

create policy "Anyone can edit resources"
on public.resources for update to anon, authenticated using (true) with check (true);

create policy "Anyone can delete resources"
on public.resources for delete to anon, authenticated using (true);

drop policy "Signed-in users can upload resource images" on storage.objects;

create policy "Anyone can upload resource images"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'resource-images');
