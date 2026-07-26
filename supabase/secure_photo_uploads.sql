-- Reemplaza el acceso público a las fotos de verificación por acceso
-- restringido: cada proveedor sube sus fotos bajo una sesión anónima propia
-- (auth.uid()), y solo puede leer sus propias fotos. El admin real (login
-- con correo/contraseña) puede leer todas.
--
-- Requiere que "Allow anonymous sign-ins" esté activado en
-- Authentication → Sign In / Providers del dashboard de Supabase.

create or replace function public.is_admin()
returns boolean
language sql stable as $$
  select auth.role() = 'authenticated'
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

-- ── providers / clients / categories: solo el admin real, no sesiones anónimas ──

drop policy if exists "providers_select_admin" on providers;
create policy "providers_select_admin" on providers
  for select to authenticated using (is_admin());

drop policy if exists "providers_update_admin" on providers;
create policy "providers_update_admin" on providers
  for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "clients_select_admin" on clients;
create policy "clients_select_admin" on clients
  for select to authenticated using (is_admin());

drop policy if exists "categories_write_admin" on categories;
create policy "categories_write_admin" on categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- ── storage: cada quien sube y lee solo su propia carpeta (auth.uid()); admin lee todo ──

drop policy if exists "provider_photos_insert_public" on storage.objects;
create policy "provider_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'provider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "provider_photos_select_admin" on storage.objects;
create policy "provider_photos_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provider-photos'
    and (is_admin() or auth.uid()::text = (storage.foldername(name))[1])
  );
