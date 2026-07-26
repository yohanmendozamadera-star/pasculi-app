-- Corrige las políticas de acceso público para que funcionen con el nuevo
-- sistema de API keys de Supabase (sb_publishable_...), que no mapea 1:1 al
-- rol clásico "anon". Usamos el pseudo-rol "public" (siempre incluye a
-- cualquiera) para lo que debe ser abierto, y dejamos "authenticated" para
-- lo que de verdad requiere el login del admin.

drop policy if exists "categories_select_public" on categories;
create policy "categories_select_public" on categories
  for select to public using (true);

drop policy if exists "providers_insert_public" on providers;
create policy "providers_insert_public" on providers
  for insert to public with check (estado = 'pendiente');

drop policy if exists "providers_select_approved_public" on providers;
create policy "providers_select_approved_public" on providers
  for select to public using (estado = 'aprobado');

drop policy if exists "clients_insert_public" on clients;
create policy "clients_insert_public" on clients
  for insert to public with check (true);

drop policy if exists "provider_photos_insert_public" on storage.objects;
create policy "provider_photos_insert_public" on storage.objects
  for insert to public with check (bucket_id = 'provider-photos');
