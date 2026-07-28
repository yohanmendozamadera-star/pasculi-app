-- Pasculi — esquema inicial de Supabase.
-- Ejecuta este script completo en el SQL Editor de tu proyecto de Supabase
-- (Dashboard → SQL Editor → New query → pega y corre "Run").

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────────────────

create table if not exists categories (
  name text primary key,
  especialidades text[] not null default '{}'
);

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),
  nombre_completo text not null,
  identificacion text not null,
  celular text not null unique,
  correo text not null,
  ciudad text not null,
  direccion text not null,
  categoria text not null,
  especialidades text[] not null default '{}',
  ubicacion jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  foto_perfil_path text,
  selfie_path text,
  foto_cedula_path text,
  foto_cedula_reverso_path text,
  trabajo1_path text,
  trabajo2_path text,
  trabajo3_path text,
  youtube_url text,
  profile_views integer not null default 0,
  created_at timestamptz not null default now()
);

-- Administradores reales. Sin políticas públicas: solo la función
-- is_admin() (security definer) la puede leer. Después de correr este
-- script, agrega tu propia cuenta:
--   insert into admins (user_id) select id from auth.users where email = 'tu-correo-admin@ejemplo.com';
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  celular text not null unique,
  correo text not null,
  ciudad text not null,
  ubicacion jsonb,
  created_at timestamptz not null default now()
);

-- Solicitudes de servicio: el cliente pide, el proveedor acepta/rechaza y
-- luego marca completado. Sin dinero real todavía, solo el flujo y estados.
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id),
  cliente_nombre text not null,
  cliente_celular text not null,
  cliente_correo text not null,
  mensaje text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptado', 'completado', 'rechazado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- Seed: categorías y especialidades por defecto
-- ─────────────────────────────────────────────────────────

insert into categories (name, especialidades) values
  ('Limpieza y Jardinería', array['Limpieza de casas','Limpieza de oficinas','Jardinería y poda','Fumigación','Lavado de tanques']),
  ('Instalación y Mantenimiento de Aire Acondicionado', array['Instalación de aire acondicionado','Mantenimiento aire acondicionado industrial','Mantenimiento aire acondicionado residencial','Desmonte de aire acondicionado','Carga de gas refrigerante']),
  ('Servicio de Grúa', array['Grúa liviana','Grúa pesada','Auxilio vial','Traslado de vehículos']),
  ('Servicio Contable y Declaración de Renta', array['Declaración de renta','Contabilidad general','Nómina y liquidaciones','Asesoría tributaria']),
  ('Desayuno Sorpresa', array['Desayunos románticos','Desayunos infantiles','Desayunos empresariales','Detalles y arreglos']),
  ('Electricidad', array['Instalaciones eléctricas','Reparaciones eléctricas','Cableado estructurado','Certificación RETIE']),
  ('Mensajería', array['Mensajería en moto','Entrega de documentos','Domicilios varios']),
  ('Albañilería', array['Albañilería general','Plomería','Cielo raso en PVC','Cielo raso en icopor','Estucado y pintura'])
on conflict (name) do nothing;

-- ─────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────

alter table categories enable row level security;
alter table providers enable row level security;
alter table clients enable row level security;
alter table admins enable row level security;

-- Distingue al admin real de cualquier otra cuenta autenticada (proveedor
-- con login propio, sesión anónima, etc). SECURITY DEFINER: puede leer la
-- tabla admins aunque quien llama no tenga permiso directo sobre ella.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth.role() = 'authenticated'
    and exists (select 1 from admins where user_id = auth.uid());
$$;

-- El frontend necesita poder preguntar "¿la sesión actual es admin?" sin
-- exponer la tabla admins en sí (is_admin() solo revela sí/no de quien
-- llama, nunca la lista completa).
grant execute on function public.is_admin() to anon, authenticated;

-- categories: lectura pública (para mostrar el formulario de registro),
-- escritura solo para el admin real.
create policy "categories_select_public" on categories
  for select to public using (true);

create policy "categories_write_admin" on categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- providers: cualquiera puede registrarse (siempre en estado "pendiente"),
-- lectura pública solo de los aprobados (para el contador de la home),
-- lectura completa y aprobar/rechazar solo el admin real.
create policy "providers_insert_public" on providers
  for insert to public with check (estado = 'pendiente');

create policy "providers_select_approved_public" on providers
  for select to public using (estado = 'aprobado');

create policy "providers_select_admin" on providers
  for select to authenticated using (is_admin());

create policy "providers_update_admin" on providers
  for update to authenticated using (is_admin()) with check (is_admin());

-- El proveedor puede ver su propio registro (para su panel "Mi perfil").
create policy "providers_select_own" on providers
  for select to authenticated using (auth_user_id = auth.uid());

-- El proveedor (o el admin) puede reemplazar UNA de sus 4 fotos sin poder
-- tocar ningún otro campo (estado, aprobación, etc). El admin además puede
-- borrar una foto (deja el campo vacío para pedir que la vuelvan a subir).
create or replace function public.update_provider_photo(target_id uuid, photo_key text, new_path text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select auth_user_id into owner from providers where id = target_id;
  if owner is null or (owner != auth.uid() and not is_admin()) then
    return false;
  end if;
  if photo_key = 'fotoPerfil' then
    update providers set foto_perfil_path = new_path where id = target_id;
  elsif photo_key = 'selfie' then
    update providers set selfie_path = new_path where id = target_id;
  elsif photo_key = 'fotoCedula' then
    update providers set foto_cedula_path = new_path where id = target_id;
  elsif photo_key = 'fotoCedulaReverso' then
    update providers set foto_cedula_reverso_path = new_path where id = target_id;
  elsif photo_key = 'trabajo1' then
    update providers set trabajo1_path = new_path where id = target_id;
  elsif photo_key = 'trabajo2' then
    update providers set trabajo2_path = new_path where id = target_id;
  elsif photo_key = 'trabajo3' then
    update providers set trabajo3_path = new_path where id = target_id;
  else
    return false;
  end if;
  return true;
end;
$$;

grant execute on function public.update_provider_photo(uuid, text, text) to authenticated;

-- El proveedor edita sus propios datos básicos (nunca estado/aprobación).
create or replace function public.update_provider_profile(
  target_id uuid,
  new_nombre text,
  new_celular text,
  new_direccion text,
  new_especialidades text[]
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select auth_user_id into owner from providers where id = target_id;
  if owner is null or owner != auth.uid() then
    return false;
  end if;
  update providers set
    nombre_completo = coalesce(new_nombre, nombre_completo),
    celular = coalesce(new_celular, celular),
    direccion = coalesce(new_direccion, direccion),
    especialidades = coalesce(new_especialidades, especialidades)
  where id = target_id;
  return true;
end;
$$;

grant execute on function public.update_provider_profile(uuid, text, text, text, text[]) to authenticated;

create or replace function public.delete_provider_photo(target_id uuid, photo_key text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    return false;
  end if;
  if photo_key = 'fotoPerfil' then
    update providers set foto_perfil_path = null where id = target_id;
  elsif photo_key = 'selfie' then
    update providers set selfie_path = null where id = target_id;
  elsif photo_key = 'fotoCedula' then
    update providers set foto_cedula_path = null where id = target_id;
  elsif photo_key = 'fotoCedulaReverso' then
    update providers set foto_cedula_reverso_path = null where id = target_id;
  elsif photo_key = 'trabajo1' then
    update providers set trabajo1_path = null where id = target_id;
  elsif photo_key = 'trabajo2' then
    update providers set trabajo2_path = null where id = target_id;
  elsif photo_key = 'trabajo3' then
    update providers set trabajo3_path = null where id = target_id;
  else
    return false;
  end if;
  return true;
end;
$$;

grant execute on function public.delete_provider_photo(uuid, text) to authenticated;

-- Incrementa el contador de vistas del perfil sin dar permiso de escritura
-- general sobre providers: corre con permisos del dueño de la función
-- (SECURITY DEFINER), no del visitante anónimo que la llama.
create or replace function public.increment_provider_views(target_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update providers
  set profile_views = profile_views + 1
  where id = target_id and estado = 'aprobado';
$$;

grant execute on function public.increment_provider_views(uuid) to anon, authenticated;

-- clients: cualquiera puede registrarse; solo el admin real los puede listar.
create policy "clients_insert_public" on clients
  for insert to public with check (true);

create policy "clients_select_admin" on clients
  for select to authenticated using (is_admin());

-- service_requests: cualquiera puede pedir un servicio, sin cuenta ni login.
-- Solo el proveedor dueño de la solicitud (o el admin) la ve y la gestiona.
alter table service_requests enable row level security;

create policy "service_requests_insert_public" on service_requests
  for insert to public with check (estado = 'pendiente');

create policy "service_requests_select_owner_or_admin" on service_requests
  for select to authenticated using (
    is_admin()
    or exists (select 1 from providers p where p.id = service_requests.provider_id and p.auth_user_id = auth.uid())
  );

create policy "service_requests_update_owner_or_admin" on service_requests
  for update to authenticated using (
    is_admin()
    or exists (select 1 from providers p where p.id = service_requests.provider_id and p.auth_user_id = auth.uid())
  ) with check (
    is_admin()
    or exists (select 1 from providers p where p.id = service_requests.provider_id and p.auth_user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────
-- Storage: bucket privado para fotos de verificación
-- ─────────────────────────────────────────────────────────
--
-- Las fotos son datos sensibles (cédula, selfie), así que no se suben de
-- forma anónima abierta: cada quien se registra como proveedor primero
-- obtiene una sesión anónima real de Supabase Auth (auth.uid()), sube sus
-- fotos bajo su propia carpeta, y solo puede leer esa carpeta. El admin
-- real puede leer todas. Requiere activar "Allow anonymous sign-ins" en
-- Authentication → Sign In / Providers del dashboard.

insert into storage.buckets (id, name, public)
values ('provider-photos', 'provider-photos', false)
on conflict (id) do nothing;

create policy "provider_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'provider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "provider_photos_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provider-photos'
    and (is_admin() or auth.uid()::text = (storage.foldername(name))[1])
  );

-- El admin puede subir/reemplazar fotos en la carpeta de CUALQUIER
-- proveedor (no solo la propia), y borrar objetos del bucket.
create policy "provider_photos_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'provider-photos' and is_admin());

create policy "provider_photos_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'provider-photos' and is_admin());

-- La foto de perfil y las fotos de trabajos son "vitrina pública": cualquiera
-- puede verlas, pero SOLO si son exactamente la foto vigente de un proveedor
-- aprobado (si el admin la borra o reemplaza, el archivo viejo deja de ser
-- público solo). La selfie y la cédula (frente/reverso) siguen privadas.
create policy "provider_photos_select_public_showcase" on storage.objects
  for select to public
  using (
    bucket_id = 'provider-photos'
    and exists (
      select 1 from providers p
      where p.estado = 'aprobado'
        and storage.objects.name in (p.foto_perfil_path, p.trabajo1_path, p.trabajo2_path, p.trabajo3_path)
    )
  );

-- ─────────────────────────────────────────────────────────
-- ÚLTIMO PASO, MUY IMPORTANTE: agrega tu cuenta admin existente a la
-- tabla admins (reemplaza el correo por el que usas para entrar al panel).
-- ─────────────────────────────────────────────────────────
-- insert into admins (user_id) select id from auth.users where email = 'tu-correo-admin@ejemplo.com';
