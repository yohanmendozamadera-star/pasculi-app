-- Corrige 2 bugs de RLS en el directorio de negocios:
--
-- 1) La subida de fotos necesita poder "leer de vuelta" el archivo recién
--    subido (mismo patrón que ya vimos con las fotos de proveedores) — el
--    bucket es público para lectura vía URL, pero la operación de subida en
--    sí necesita su propia política de SELECT.
--
-- 2) products_insert_public verificaba "el negocio existe y está pendiente"
--    con una subconsulta normal — pero un negocio "pendiente" NO es visible
--    para el rol público bajo las políticas de "businesses" (solo se ven los
--    aprobados), así que esa subconsulta siempre daba falso. Se reemplaza
--    por una función segura que sí puede ver el negocio sin depender de sus
--    propias políticas de RLS.

create policy "business_photos_select_public" on storage.objects
  for select to public using (bucket_id = 'business-photos');

create or replace function public.business_is_pending(target_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses where id = target_id and estado = 'pendiente');
$$;

grant execute on function public.business_is_pending(uuid) to anon, authenticated;

drop policy if exists "products_insert_public" on products;
create policy "products_insert_public" on products
  for insert to public with check (business_is_pending(business_id));
