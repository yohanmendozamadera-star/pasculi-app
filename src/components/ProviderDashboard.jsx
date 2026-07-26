import { useEffect, useState } from "react";
import { getMyProviderProfile, getProviderPhotoUrls, replaceProviderPhoto } from "../lib/storage.js";
import { supabase } from "../lib/supabaseClient.js";
import PhotoSlot from "./PhotoSlot.jsx";

const PHOTO_SLOTS = [
  { key: "fotoPerfil", title: "Foto de perfil", hint: "Desde tu galería" },
  { key: "selfie", title: "Selfie", hint: "Toma la foto en el momento", capture: "user" },
  { key: "fotoCedula", title: "Cédula (frente)", hint: "Foto clara y legible", capture: "environment" },
  { key: "fotoCedulaReverso", title: "Cédula (reverso)", hint: "Foto clara y legible", capture: "environment" },
];

export default function ProviderDashboard({ toast }) {
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState(null);

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

        <div className="chip-select" style={{ marginBottom: 18 }}>
          <span className="badge badge-cat">{profile.categoria}</span>
          {(profile.especialidades || []).map((sp) => (
            <span key={sp} className="chip-option checked">
              {sp}
            </span>
          ))}
        </div>

        <h3 className="section-title" style={{ fontSize: 15 }}>
          Tus fotos de verificación
        </h3>
        <p className="small-note" style={{ marginTop: -8, marginBottom: 12 }}>
          Si el administrador te pidió corregir una foto borrosa, cámbiala aquí.
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
      </div>
    </div>
  );
}
