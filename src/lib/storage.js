// Capa de persistencia de Pasculi, respaldada por Supabase (Postgres + Storage).
// Todos los componentes solo llaman a las funciones exportadas aquí.

import { supabase } from "./supabaseClient.js";
import { DEFAULT_CATEGORIES } from "../data/categories.js";
import { uid } from "./image.js";

const PHOTOS_BUCKET = "provider-photos";

function providerFromRow(row) {
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    identificacion: row.identificacion,
    celular: row.celular,
    correo: row.correo,
    ciudad: row.ciudad,
    direccion: row.direccion,
    categoria: row.categoria,
    especialidades: row.especialidades || [],
    ubicacion: row.ubicacion,
    estado: row.estado,
    timestamp: row.created_at,
    fotoPerfilPath: row.foto_perfil_path,
    selfiePath: row.selfie_path,
    fotoCedulaPath: row.foto_cedula_path,
    fotoCedulaReversoPath: row.foto_cedula_reverso_path,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    profileViews: row.profile_views,
    authUserId: row.auth_user_id,
  };
}

function clientFromRow(row) {
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    celular: row.celular,
    correo: row.correo,
    ciudad: row.ciudad,
    timestamp: row.created_at,
  };
}

// ── Proveedores ──────────────────────────────────────────

export async function getProviders() {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("No se pudieron cargar los proveedores", error);
    return [];
  }
  return data.map(providerFromRow);
}

// Devuelve { ok: true, provider } o { ok: false, reason: "duplicate" | "error" }
//
// No pedimos la fila de vuelta (sin .select()): quien se registra no tiene
// permiso de LEER la tabla (solo el admin), y Postgres exige que una fila
// devuelta por INSERT...RETURNING sea visible bajo una política de SELECT.
// Por eso construimos el objeto local a partir de lo que ya sabemos.
export async function insertProvider(id, form, especialidades, ubicacion, photoPaths, authUserId) {
  const { error } = await supabase.from("providers").insert({
    id,
    auth_user_id: authUserId,
    nombre_completo: form.nombreCompleto,
    identificacion: form.identificacion,
    celular: form.celular,
    correo: form.correo,
    ciudad: form.ciudad,
    direccion: form.direccion,
    categoria: form.categoria,
    especialidades,
    ubicacion,
    foto_perfil_path: photoPaths.fotoPerfil,
    selfie_path: photoPaths.selfie,
    foto_cedula_path: photoPaths.fotoCedula,
    foto_cedula_reverso_path: photoPaths.fotoCedulaReverso,
    instagram_url: form.instagramUrl || null,
    tiktok_url: form.tiktokUrl || null,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    console.error("No se pudo guardar el proveedor", error);
    return { ok: false, reason: "error" };
  }
  return {
    ok: true,
    provider: {
      id,
      authUserId,
      nombreCompleto: form.nombreCompleto,
      identificacion: form.identificacion,
      celular: form.celular,
      correo: form.correo,
      ciudad: form.ciudad,
      direccion: form.direccion,
      categoria: form.categoria,
      especialidades,
      ubicacion,
      estado: "pendiente",
      timestamp: new Date().toISOString(),
      fotoPerfilPath: photoPaths.fotoPerfil,
      selfiePath: photoPaths.selfie,
      fotoCedulaPath: photoPaths.fotoCedula,
      fotoCedulaReversoPath: photoPaths.fotoCedulaReverso,
      instagramUrl: form.instagramUrl || null,
      tiktokUrl: form.tiktokUrl || null,
      profileViews: 0,
    },
  };
}

export async function updateProviderStatus(id, estado) {
  const { error } = await supabase.from("providers").update({ estado }).eq("id", id);
  if (error) {
    console.error("No se pudo actualizar el estado del proveedor", error);
    return false;
  }
  return true;
}

// Las fotos son sensibles (cédula, selfie): solo se pueden subir con una
// sesión real de Supabase Auth. Si quien se registra no tiene ninguna
// sesión activa, le abrimos una anónima (auth.uid() será la "carpeta" donde
// quedan sus fotos, y solo esa sesión — o el admin — puede leerlas). Si ya
// hay una sesión (ej. el propio admin probando el formulario) la respetamos
// tal cual, para no cerrarle su sesión real.
export async function ensureAuthSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("No se pudo abrir la sesión para subir las fotos", error);
    return null;
  }
  return data.session;
}

// Convierte la sesión anónima usada para subir las fotos en una cuenta real
// (correo + contraseña), sin perder el vínculo con las fotos ya subidas:
// Supabase mantiene el mismo auth.uid() al "actualizar" un usuario anónimo.
export async function finalizeProviderAccount(email, password) {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) {
    console.error("No se pudo crear la cuenta del proveedor", error);
    return false;
  }
  return true;
}

// Sube las 4 fotos comprimidas (dataURL) al bucket privado y devuelve sus paths.
export async function uploadProviderPhotos(photos) {
  const session = await ensureAuthSession();
  if (!session) return null;
  return uploadPhotosToFolder(session.user.id, photos);
}

async function uploadPhotosToFolder(folder, photos) {
  const paths = {};
  for (const [key, dataUrl] of Object.entries(photos)) {
    if (!dataUrl) continue;
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${folder}/${key}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) {
      console.error(`No se pudo subir la foto ${key}`, error);
      return null;
    }
    paths[key] = path;
  }
  return paths;
}

// Carpeta de Storage donde viven las fotos de un proveedor: se deduce de
// cualquiera de sus rutas ya guardadas (todas comparten la misma carpeta).
function providerFolder(provider) {
  const anyPath =
    provider.fotoPerfilPath || provider.selfiePath || provider.fotoCedulaPath || provider.fotoCedulaReversoPath;
  if (anyPath) return anyPath.split("/")[0];
  return provider.authUserId || provider.id;
}

export const PHOTO_PATH_COLUMN = {
  fotoPerfil: "fotoPerfilPath",
  selfie: "selfiePath",
  fotoCedula: "fotoCedulaPath",
  fotoCedulaReverso: "fotoCedulaReversoPath",
};

// Reemplaza UNA foto de un proveedor (la usa tanto el propio proveedor
// logueado como el admin). Sube el archivo nuevo y actualiza la fila vía la
// función segura update_provider_photo (ver schema.sql) — ninguna otra
// columna se puede tocar por esta vía. Devuelve el nuevo path o null si falló.
export async function replaceProviderPhoto(provider, photoKey, dataUrl) {
  const folder = providerFolder(provider);
  const paths = await uploadPhotosToFolder(folder, { [photoKey]: dataUrl });
  if (!paths) return null;

  const { data, error } = await supabase.rpc("update_provider_photo", {
    target_id: provider.id,
    photo_key: photoKey,
    new_path: paths[photoKey],
  });
  if (error || !data) {
    console.error("No se pudo actualizar la foto del proveedor", error);
    return null;
  }
  return paths[photoKey];
}

// Borra una foto de un proveedor (solo admin) y limpia el archivo en Storage.
export async function deleteProviderPhoto(provider, photoKey) {
  const oldPath = provider[PHOTO_PATH_COLUMN[photoKey]];

  const { data, error } = await supabase.rpc("delete_provider_photo", {
    target_id: provider.id,
    photo_key: photoKey,
  });
  if (error || !data) {
    console.error("No se pudo borrar la foto del proveedor", error);
    return false;
  }
  if (oldPath) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([oldPath]);
  }
  return true;
}

// Trae el registro del proveedor logueado (para su propio panel).
export async function getMyProviderProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("auth_user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error("No se pudo cargar tu perfil de proveedor", error);
    return null;
  }
  return data?.[0] ? providerFromRow(data[0]) : null;
}

// Genera URLs firmadas temporales para que el admin vea las 4 fotos de un proveedor.
export async function getProviderPhotoUrls(provider) {
  const empty = { fotoPerfil: null, selfie: null, fotoCedula: null, fotoCedulaReverso: null };
  const paths = [
    provider.fotoPerfilPath,
    provider.selfiePath,
    provider.fotoCedulaPath,
    provider.fotoCedulaReversoPath,
  ].filter(Boolean);
  if (paths.length === 0) return empty;

  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrls(paths, 300);
  if (error) {
    console.error("No se pudieron generar las URLs de las fotos", error);
    return empty;
  }
  const byPath = Object.fromEntries(data.map((d) => [d.path, d.signedUrl]));
  return {
    fotoPerfil: byPath[provider.fotoPerfilPath] || null,
    selfie: byPath[provider.selfiePath] || null,
    fotoCedula: byPath[provider.fotoCedulaPath] || null,
    fotoCedulaReverso: byPath[provider.fotoCedulaReversoPath] || null,
  };
}

// Suma una vista al perfil público de un proveedor (RPC segura, ver schema.sql).
export async function incrementProviderViews(providerId) {
  const { error } = await supabase.rpc("increment_provider_views", { target_id: providerId });
  if (error) {
    console.error("No se pudo registrar la vista del perfil", error);
  }
}

// Le pregunta a Postgres si la sesión actual es la del admin real (la
// tabla admins nunca es legible directamente desde el cliente).
export async function checkIsAdmin() {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("No se pudo verificar el rol de la sesión", error);
    return false;
  }
  return !!data;
}

// ── Clientes ─────────────────────────────────────────────

export async function getClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("No se pudieron cargar los clientes", error);
    return [];
  }
  return data.map(clientFromRow);
}

export async function insertClient(form) {
  const id = uid();
  const { error } = await supabase.from("clients").insert({
    id,
    nombre_completo: form.nombreCompleto,
    celular: form.celular,
    correo: form.correo,
    ciudad: form.ciudad,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    console.error("No se pudo guardar el cliente", error);
    return { ok: false, reason: "error" };
  }
  return {
    ok: true,
    client: {
      id,
      nombreCompleto: form.nombreCompleto,
      celular: form.celular,
      correo: form.correo,
      ciudad: form.ciudad,
      timestamp: new Date().toISOString(),
    },
  };
}

// ── Categorías ───────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) {
    console.error("No se pudieron cargar las categorías", error);
    return DEFAULT_CATEGORIES;
  }
  if (data.length === 0) return DEFAULT_CATEGORIES;
  return Object.fromEntries(data.map((row) => [row.name, row.especialidades || []]));
}

export async function addCategory(name) {
  const { error } = await supabase.from("categories").insert({ name, especialidades: [] });
  if (error) {
    console.error("No se pudo agregar la categoría", error);
    return false;
  }
  return true;
}

export async function deleteCategory(name) {
  const { error } = await supabase.from("categories").delete().eq("name", name);
  if (error) {
    console.error("No se pudo eliminar la categoría", error);
    return false;
  }
  return true;
}

export async function setCategorySpecialties(name, especialidades) {
  const { error } = await supabase.from("categories").update({ especialidades }).eq("name", name);
  if (error) {
    console.error("No se pudieron actualizar las especialidades", error);
    return false;
  }
  return true;
}
