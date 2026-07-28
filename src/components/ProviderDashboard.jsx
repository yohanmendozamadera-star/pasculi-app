import { useEffect, useState } from "react";
import { getMyProviderProfile, getProviderPhotoUrls, replaceProviderPhoto, updateProviderProfile } from "../lib/storage.js";
import { supabase } from "../lib/supabaseClient.js";
import PhotoSlot from "./PhotoSlot.jsx";
import ProviderRequests from "./ProviderRequests.jsx";

const PHOTO_SLOTS = [
  { key: "fotoPerfil", title: "Foto de perfil", hint: "Desde tu galería" },
  { key: "selfie", title: "Selfie", hint: "Toma la foto en el momento", capture: "user" },
  { key: "fotoCedula", title: "Cédula (frente)", hint: "Foto clara y legible", capture: "environment" },
  { key: "fotoCedulaReverso", title: "Cédula (reverso)", hint: "Foto clara y legible", capture: "environment" },
  { key: "trabajo1", title: "Trabajo 1", hint: "Opcional" },
  { key: "trabajo2", title: "Trabajo 2", hint: "Opcional" },
  { key: "trabajo3", title: "Trabajo 3", hint: "Opcional" },
];

export default function ProviderDashboard({ categories, toast }) {
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("perfil");

  async function load() {
    const p = await getMyProviderProfile();
    setProfile(p);
    setPhotos(p ? await getProviderPhotoUrls(p) : null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReplace(key, dataUrl) {
    if (!dataUrl || !profile) return;
    setUploadingKey(key);
    const newPath = await replaceProviderPhoto(profile, key, dataUrl);
    setUploadingKey(null);
    if (newPath) {
      toast("Foto actualizada.");
      load();
    } else {
      toast("No se pudo actualizar la foto, intenta de nuevo.");
    }
  }

  function startEditing() {
    setForm({
      nombreCompleto: profile.nombreCompleto,
      celular: profile.celular,
      direccion: profile.direccion,
      especialidades: profile.especialidades || [],
    });
    setEditing(true);
  }

  function toggleEspecialidad(sp) {
    setForm((f) => ({
      ...f,
      especialidades: f.especialidades.includes(sp)
        ? f.especialidades.filter((x) => x !== sp)
        : [...f.especialidades, sp],
    }));
  }

  async function saveEdits(e) {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProviderProfile(profile.id, form);
    setSaving(false);
    if (ok) {
      toast("Perfil actualizado.");
      setEditing(false);
      load();
    } else {
      toast("No se pudo guardar, intenta de nuevo.");
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando tu perfil…</div>;
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <h3>No encontramos tu perfil de proveedor</h3>
        <p>Si crees que esto es un error, escríbenos.</p>
      </div>
    );
  }

  const specialtyList = categories?.[profile.categoria] || [];

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>{profile.nombreCompleto}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>{profile.ciudad}</p>
          </div>
          <button className="row-btn" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>

        <div className="admin-tabs" style={{ marginTop: 16 }}>
          <button className={tab === "perfil" ? "active" : ""} onClick={() => setTab("perfil")}>
            Mi perfil
          </button>
          <button className={tab === "solicitudes" ? "active" : ""} onClick={() => setTab("solicitudes")}>
            Solicitudes
          </button>
        </div>

        {tab === "solicitudes" ? (
          <ProviderRequests providerId={profile.id} toast={toast} />
        ) : (
          <>
        <div className="stats-row" style={{ marginTop: 18, marginBottom: 18 }}>
          <div className="stat-card">
            <div className="stat-num">
              <span className={`status-pill status-${profile.estado}`}>{profile.estado.toUpperCase()}</span>
            </div>
            <div className="stat-label">Estado de tu perfil</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{profile.profileViews ?? 0}</div>
            <div className="stat-label">Vistas de tu perfil</div>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="chip-select" style={{ marginBottom: 10 }}>
              <span className="badge badge-cat">{profile.categoria}</span>
              {(profile.especialidades || []).map((sp) => (
                <span key={sp} className="chip-option checked">
                  {sp}
                </span>
              ))}
            </div>
            <p className="small-note" style={{ marginTop: -4 }}>
              Celular {profile.celular} · {profile.direccion}
            </p>
            <button className="btn-secondary" style={{ marginTop: 10 }} onClick={startEditing}>
              Editar mis datos
            </button>
          </>
        ) : (
          <form onSubmit={saveEdits} style={{ marginBottom: 18 }}>
            <div className="field-group">
              <label>Nombre completo</label>
              <input
                type="text"
                value={form.nombreCompleto}
                onChange={(e) => setForm((f) => ({ ...f, nombreCompleto: e.target.value }))}
              />
            </div>
            <div className="field-row two">
              <div className="field-group">
                <label>Celular</label>
                <input
                  type="tel"
                  value={form.celular}
                  onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
                />
              </div>
              <div className="field-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                />
              </div>
            </div>
            <div className="field-group">
              <label>
                Especialidades <span className="hint">{profile.categoria}</span>
              </label>
              <div className="chip-select">
                {specialtyList.map((sp) => (
                  <label key={sp} className={`chip-option ${form.especialidades.includes(sp) ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={form.especialidades.includes(sp)}
                      onChange={() => toggleEspecialidad(sp)}
                    />
                    {sp}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <h3 className="section-title" style={{ fontSize: 15 }}>
          Tus fotos
        </h3>
        <p className="small-note" style={{ marginTop: -8, marginBottom: 12 }}>
          Perfil, verificación y hasta 3 fotos de trabajos. Si el admin te pidió corregir una foto
          borrosa, cámbiala aquí.
        </p>
        <div className="photo-grid">
          {PHOTO_SLOTS.map(({ key, title, hint, capture }) => (
            <PhotoSlot
              key={key}
              slotKey={key}
              title={title}
              hint={uploadingKey === key ? "Subiendo…" : hint}
              capture={capture}
              value={photos?.[key]}
              onChange={handleReplace}
            />
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
