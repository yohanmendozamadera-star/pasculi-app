-- Directorio de negocios: registro gratis, catálogo de productos, buscador
-- público (tipo Google), aprobación por el admin, y contador de clics.
-- Sin verificación de identidad (no es tan sensible como el registro de
-- proveedor de servicio) y sin login por ahora — solo registro + catálogo.

create table if not exists business_categories (
  name text primary key
);

insert into business_categories (name) values
  ('Ropa y Accesorios'),
  ('Comida y Bebidas'),
  ('Tecnología'),
  ('Hogar y Decoración'),
  ('Belleza y Cuidado Personal'),
  ('Deportes'),
  ('Otros')
on conflict (name) do nothing;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),
  nombre_negocio text not null,
  nombre_contacto text not null,
  celular text not null unique,
  correo text not null,
  ciudad text not null,
  direccion text not null,
  ubicacion jsonb,
  categoria text not null,
  descripcion text,
  instagram_url text,
  facebook_url text,
  whatsapp_url text,
  foto_negocio_path text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  profile_views integer not null default 0,
  contact_clicks integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  nombre text not null,
  descripcion text,
  precio numeric,
  foto_path text,
  created_at timestamptz not null default now()
);

alter table business_categories enable row level security;
alter table businesses enable row level security;
alter table products enable row level security;

create policy "business_categories_select_public" on business_categories
  for select to public using (true);

create policy "business_categories_write_admin" on business_categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- Cualquiera puede registrar su negocio (siempre en "pendiente"); solo se ve
-- públicamente una vez aprobado. El admin ve y aprueba/rechaza todo.
create policy "businesses_insert_public" on businesses
  for insert to public with check (estado = 'pendiente');

create policy "businesses_select_approved_public" on businesses
  for select to public using (estado = 'aprobado');

create policy "businesses_select_admin" on businesses
  for select to authenticated using (is_admin());

create policy "businesses_update_admin" on businesses
  for update to authenticated using (is_admin()) with check (is_admin());

-- Los productos se suben junto con el negocio (mientras sigue "pendiente");
-- solo se ven públicamente si el negocio ya fue aprobado.
create policy "products_insert_public" on products
  for insert to public with check (
    exists (select 1 from businesses b where b.id = products.business_id and b.estado = 'pendiente')
  );

create policy "products_select_public" on products
  for select to public using (
    exists (select 1 from businesses b where b.id = products.business_id and b.estado = 'aprobado')
  );

create policy "products_select_admin" on products
  for select to authenticated using (is_admin());

create policy "products_delete_admin" on products
  for delete to authenticated using (is_admin());

-- Contadores de clics: vistas de la ficha y clics en "Contactar"/redes.
create or replace function public.increment_business_views(target_id uuid)
returns void
language sql security definer set search_path = public as $$
  update businesses set profile_views = profile_views + 1 where id = target_id and estado = 'aprobado';
$$;

grant execute on function public.increment_business_views(uuid) to anon, authenticated;

create or replace function public.increment_business_contact_clicks(target_id uuid)
returns void
language sql security definer set search_path = public as $$
  update businesses set contact_clicks = contact_clicks + 1 where id = target_id and estado = 'aprobado';
$$;

grant execute on function public.increment_business_contact_clicks(uuid) to anon, authenticated;

-- Bucket público: fotos de negocio y de productos no son sensibles (no hay
-- verificación de identidad aquí), así que se sirven directo sin firmar URLs.
insert into storage.buckets (id, name, public)
values ('business-photos', 'business-photos', true)
on conflict (id) do nothing;

create policy "business_photos_insert_public" on storage.objects
  for insert to public with check (bucket_id = 'business-photos');

create policy "business_photos_delete_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'business-photos' and is_admin());
