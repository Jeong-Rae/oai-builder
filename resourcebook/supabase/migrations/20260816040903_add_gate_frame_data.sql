update public.resources
set data = jsonb_set(
  data,
  '{frames}',
  '[
    {"id":"frame-1","label":"프레임 1","imageUrl":"https://wfbdauyahltgoqirecql.supabase.co/storage/v1/object/public/resource-images/gate/frames/gate_1f.1254.png"},
    {"id":"frame-2","label":"프레임 2","imageUrl":"https://wfbdauyahltgoqirecql.supabase.co/storage/v1/object/public/resource-images/gate/frames/gate_2f.1254.png"},
    {"id":"frame-3","label":"프레임 3","imageUrl":"https://wfbdauyahltgoqirecql.supabase.co/storage/v1/object/public/resource-images/gate/frames/gate_3f.1254.png"},
    {"id":"frame-4","label":"프레임 4","imageUrl":"https://wfbdauyahltgoqirecql.supabase.co/storage/v1/object/public/resource-images/gate/frames/gate_4f.1254.png"}
  ]'::jsonb,
  true
)
where slug = 'field-gate'
  and not (data ? 'frames');
