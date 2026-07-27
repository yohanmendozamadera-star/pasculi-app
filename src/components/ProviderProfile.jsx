import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ClientIcon, PlayIcon } from "./Icons.jsx";
import { incrementProviderViews, getProviderShowcasePhotos } from "../lib/storage.js";
import ImageLightbox from "./admin/ImageLightbox.jsx";

export default function ProviderProfile({ provider, onNavigate }) {
  const counted = useRef(false);
  const [photos, setPhotos] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!provider) return;
    if (!counted.current) {
      counted.current = true;
      incrementProviderViews(provider.id);
    }
    getProviderShowcasePhotos(provider).then(setPhotos);
  }, [provider]);

  if (!provider) {
    onNavigate("browseProviders");
    return null;
  }

  const trabajos = [photos?.trabajo1, photos?.trabajo2, photos?.trabajo3].filter(Boolean);

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <button className="back-link" onClick={() => onNavigate("browseProviders")}>
        <ArrowLeftIcon width="16" height="16" /> Volver a la búsqueda
      </button>

      <div className="form-card">
        <div className="profile-header">
          {photos?.fotoPerfil ? (
            <img className="profile-avatar-photo" src={photos.fotoPerfil} alt={provider.nombreCompleto} />
          ) : (
            <div className="provider-avatar" style={{ width: 64, height: 64 }}>
              <ClientIcon width="30" height="30" />
            </div>
          )}
          <div>
            <h2 style={{ marginBottom: 4 }}>{provider.nombreCompleto}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>{provider.ciudad}</p>
          </div>
        </div>

        <div className="chip-select" style={{ marginTop: 18 }}>
          <span className="badge badge-cat">{provider.categoria}</span>
          {(provider.especialidades || []).map((sp) => (
            <span key={sp} className="chip-option checked">
              {sp}
            </span>
          ))}
        </div>

        {(trabajos.length > 0 || provider.youtubeUrl) && (
          <>
            <h3 className="section-title" style={{ fontSize: 15, marginTop: 22 }}>
              Trabajos realizados
            </h3>
            {trabajos.length > 0 && (
              <div className="portfolio-grid">
                {trabajos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Trabajo ${i + 1}`}
                    onClick={() => setLightbox({ src, alt: `Trabajo ${i + 1}` })}
                  />
                ))}
              </div>
            )}
            {provider.youtubeUrl && (
              <a
                href={provider.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <PlayIcon width="14" height="14" /> Ver video en YouTube
              </a>
            )}
          </>
        )}

        <div className="ratings-placeholder">
          <span className="coming-soon-badge">Próximamente</span>
          <p>Aún sin calificaciones de clientes.</p>
        </div>

        <button className="btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => onNavigate("registerClient")}>
          Contactar a {provider.nombreCompleto.split(" ")[0]}
        </button>
      </div>

      <ImageLightbox src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  );
}
