-- Solicitudes de servicio: el cliente pide, el proveedor acepta/rechaza y
-- luego marca completado. Es la base "tipo Upwork/Binance" que pediste —
-- por ahora sin dinero real, solo el flujo y los estados.

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

alter table service_requests enable row level security;

-- Cualquiera puede pedir un servicio (siempre en estado "pendiente"),
-- sin necesidad de cuenta ni login.
create policy "service_requests_insert_public" on service_requests
  for insert to public with check (estado = 'pendiente');

-- Solo el proveedor dueño de la solicitud (o el admin) puede verla y
-- cambiar su estado (aceptar, rechazar, completar, cancelar).
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
