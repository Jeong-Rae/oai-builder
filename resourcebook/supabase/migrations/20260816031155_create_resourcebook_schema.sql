create table public.resources (
  id bigint generated always as identity primary key,
  slug text not null unique,
  "group" text not null check ("group" in ('필드', '오브젝트')),
  sort_order integer not null default 0,
  data jsonb not null,
  hero_image_url text,
  preview_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resources_group_sort_order_idx on public.resources ("group", sort_order);

grant usage on schema public to anon, authenticated;
grant select on public.resources to anon, authenticated;
grant insert, update, delete on public.resources to authenticated;

alter table public.resources enable row level security;

create policy "Anyone can read resources"
on public.resources for select to anon, authenticated using (true);

create policy "Signed-in users can add resources"
on public.resources for insert to authenticated with check (true);

create policy "Signed-in users can edit resources"
on public.resources for update to authenticated using (true) with check (true);

create policy "Signed-in users can delete resources"
on public.resources for delete to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('resource-images', 'resource-images', true)
on conflict (id) do update set public = true;

create policy "Anyone can read resource images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'resource-images');

create policy "Signed-in users can upload resource images"
on storage.objects for insert to authenticated
with check (bucket_id = 'resource-images');
