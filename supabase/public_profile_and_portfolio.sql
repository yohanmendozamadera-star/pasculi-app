-- Perfil público del proveedor: foto de perfil + hasta 3 fotos de trabajos
-- visibles para cualquiera (solo de proveedores APROBADOS), video de
-- YouTube, y se quitan Instagram/TikTok. Además, una función segura para
-- que el proveedor edite sus propios datos básicos.

-- La ciudad del cliente deja de ser una lista fija; se le pide su ubicación.
alter table clients add column if not exists ubicacion jsonb;

alter table providers
  add column if not exists trabajo1_path text,
  add column if not exists trabajo2_path text,
  add column if not exists trabajo3_path text,
  add column if not exists youtube_url text;

alter table providers drop column if exists instagram_url;
alter table providers drop column if exists tiktok_url;

-- La foto de perfil y las fotos de trabajos son "vitrina pública": cualquiera
-- puede verlas, pero SOLO si son exactamente la foto vigente de un proveedor
-- aprobado (si el admin la borra o la reemplaza, el archivo viejo deja de
-- ser público automáticamente). La selfie y la cédula (frente/reverso)
-- siguen siendo privadas — no se tocan aquí.
drop policy if exists "provider_photos_select_public_showcase" on storage.objects;
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

-- Amplía update_provider_photo / delete_provider_photo para que también
-- acepten las 3 fotos de trabajos (además de perfil, selfie y cédula).
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
