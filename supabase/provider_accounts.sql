-- Cuentas reales de proveedor + corrección de seguridad importante:
-- hasta ahora is_admin() consideraba admin a CUALQUIER cuenta autenticada
-- no anónima. Al darle login real a los proveedores, eso los volvería
-- admins por accidente. Se reemplaza por una tabla explícita de admins.

-- 1) Tabla de administradores reales. Sin políticas públicas: solo la
--    función is_admin() (security definer) la puede leer.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table admins enable row level security;

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

-- 2) Vincula cada proveedor a su cuenta real de Supabase Auth.
alter table providers add column if not exists auth_user_id uuid references auth.users(id);

-- El proveedor puede ver su propio registro (para su panel "Mi perfil").
drop policy if exists "providers_select_own" on providers;
create policy "providers_select_own" on providers
  for select to authenticated using (auth_user_id = auth.uid());

-- 3) El proveedor (o el admin) puede reemplazar UNA de sus 4 fotos sin
--    poder tocar ningún otro campo (estado, aprobación, etc).
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
  else
    return false;
  end if;
  return true;
end;
$$;

grant execute on function public.update_provider_photo(uuid, text, text) to authenticated;

-- El admin puede borrar una foto (deja el campo vacío para pedir que la
-- vuelvan a subir).
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
  else
    return false;
  end if;
  return true;
end;
$$;

grant execute on function public.delete_provider_photo(uuid, text) to authenticated;

-- 4) El admin puede subir/reemplazar fotos en la carpeta de CUALQUIER
--    proveedor (no solo la propia), y borrar objetos del bucket.
drop policy if exists "provider_photos_insert_admin" on storage.objects;
create policy "provider_photos_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'provider-photos' and is_admin());

drop policy if exists "provider_photos_delete_admin" on storage.objects;
create policy "provider_photos_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'provider-photos' and is_admin());

-- ─────────────────────────────────────────────────────────
-- ÚLTIMO PASO, MUY IMPORTANTE: agrega tu cuenta admin existente a la
-- tabla admins (reemplaza el correo por el que usas para entrar al panel).
-- Sin este paso, TU PROPIA cuenta admin dejará de tener acceso.
-- ─────────────────────────────────────────────────────────
-- insert into admins (user_id) select id from auth.users where email = 'tu-correo-admin@ejemplo.com';
