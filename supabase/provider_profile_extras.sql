-- Agrega: cédula reverso, redes sociales, y contador de vistas de perfil.
-- Ejecuta este script completo en el SQL Editor de tu proyecto de Supabase.

alter table providers
  add column if not exists foto_cedula_reverso_path text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists profile_views integer not null default 0;

-- Incrementa el contador de vistas sin dar permiso de escritura general
-- sobre la tabla providers: SECURITY DEFINER hace que corra con permisos
-- del dueño de la función, no del visitante anónimo que la llama, y solo
-- toca profile_views de un proveedor aprobado existente.
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
