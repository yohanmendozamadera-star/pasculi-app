// Directorio de negocios: registro gratis, catálogo de productos y buscador
// público. Sigue el mismo patrón que storage.js pero para este dominio
// separado (negocios / productos), sin verificación de identidad ni login.

import { supabase } from "./supabaseClient.js";
import { uid } from "./image.js";

const BUCKET = "business-photos";

function businessFromRow(row) {
  return {
    id: row.id,
    nombreNegocio: row.nombre_negocio,
    nombreContacto: row.nombre_contacto,
    celular: row.celular,
    correo: row.correo,
    ciudad: row.ciudad,
    direccion: row.direccion,
    ubicacion: row.ubicacion,
    categoria: row.categoria,
    descripcion: row.descripcion,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    whatsappUrl: row.whatsapp_url,
    fotoNegocioPath: row.foto_negocio_path,
    estado: row.estado,
    profileViews: row.profile_views,
    contactClicks: row.contact_clicks,
    timestamp: row.created_at,
  };
}

function productFromRow(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio,
    fotoPath: row.foto_path,
    timestamp: row.created_at,
  };
}

// El bucket es público: la URL no vence y no necesita sesión ni firma.
export function getBusinessPhotoUrl(path) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function uploadBusinessPhoto(folder, key, dataUrl) {
  if (!dataUrl) return null;
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${folder}/${key}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    console.error(`No se pudo subir la foto ${key}`, error);
    return null;
  }
  return path;
}

// ── Categorías de negocio ────────────────────────────────

export async function getBusinessCategories() {
  const { data, error } = await supabase.from("business_categories").select("name").order("name");
  if (error) {
    console.error("No se pudieron cargar las categorías de negocio", error);
    return [];
  }
  return data.map((r) => r.name);
}

// ── Negocios + productos ─────────────────────────────────

export async function getBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("No se pudieron cargar los negocios", error);
    return [];
  }
  return data.map(businessFromRow);
}

export async function updateBusinessStatus(id, estado) {
  const { error } = await supabase.from("businesses").update({ estado }).eq("id", id);
  if (error) {
    console.error("No se pudo actualizar el estado del negocio", error);
    return false;
  }
  return true;
}

export async function getBusiness(id) {
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("No se pudo cargar el negocio", error);
    return null;
  }
  return data ? businessFromRow(data) : null;
}

export async function getBusinessProducts(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("No se pudieron cargar los productos", error);
    return [];
  }
  return data.map(productFromRow);
}

// Registra el negocio y su catálogo inicial de productos en un solo flujo.
// productos: [{ nombre, descripcion, precio, fotoDataUrl }]
export async function registerBusiness(form, ubicacion, fotoNegocioDataUrl, productos) {
  const id = uid();
  const fotoNegocioPath = await uploadBusinessPhoto(id, "logo", fotoNegocioDataUrl);

  const { error } = await supabase.from("businesses").insert({
    id,
    nombre_negocio: form.nombreNegocio,
    nombre_contacto: form.nombreContacto,
    celular: form.celular,
    correo: form.correo,
    ciudad: form.ciudad,
    direccion: form.direccion,
    ubicacion,
    categoria: form.categoria,
    descripcion: form.descripcion || null,
    instagram_url: form.instagramUrl || null,
    facebook_url: form.facebookUrl || null,
    whatsapp_url: form.whatsappUrl || null,
    foto_negocio_path: fotoNegocioPath,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    console.error("No se pudo registrar el negocio", error);
    return { ok: false, reason: "error" };
  }

  for (const p of productos) {
    const fotoPath = await uploadBusinessPhoto(id, `product-${uid()}`, p.fotoDataUrl);
    const { error: prodError } = await supabase.from("products").insert({
      business_id: id,
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      precio: p.precio || null,
      foto_path: fotoPath,
    });
    if (prodError) {
      console.error("No se pudo guardar un producto", prodError);
    }
  }

  return { ok: true, businessId: id };
}

// Busca productos por nombre/descripción entre negocios aprobados, con los
// datos básicos del negocio ya incluidos (tipo resultado de buscador).
export async function searchProducts(query) {
  const { data, error } = await supabase
    .from("products")
    .select("*, businesses!inner(id, nombre_negocio, ciudad, estado)")
    .eq("businesses.estado", "aprobado")
    .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    console.error("No se pudo buscar productos", error);
    return [];
  }
  return data.map((row) => ({
    ...productFromRow(row),
    businessNombre: row.businesses.nombre_negocio,
    businessCiudad: row.businesses.ciudad,
  }));
}

export async function incrementBusinessViews(businessId) {
  const { error } = await supabase.rpc("increment_business_views", { target_id: businessId });
  if (error) console.error("No se pudo registrar la vista del negocio", error);
}

export async function incrementBusinessContactClicks(businessId) {
  const { error } = await supabase.rpc("increment_business_contact_clicks", { target_id: businessId });
  if (error) console.error("No se pudo registrar el clic de contacto", error);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("No se pudo borrar el producto", error);
    return false;
  }
  return true;
}
