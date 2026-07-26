import { useEffect, useRef } from "react";
import { ArrowLeftIcon, ClientIcon } from "./Icons.jsx";
import { incrementProviderViews } from "../lib/storage.js";

export default function ProviderProfile({ provider, onNavigate }) {
  const counted = useRef(false);

  useEffect(() => {
    if (provider && !counted.current) {
      counted.current = true;
      incrementProviderViews(provider.id);
    }
  }, [provider]);

  if (!provider) {
    onNavigate("browseProviders");
    return null;
  }

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <button className="back-link" onClick={() => onNavigate("browseProviders")}>
        <ArrowLeftIcon width="16" height="16" /> Volver a la búsqueda
      </button>

      <div className="form-card">
        <div className="profile-header">
          <div className="provider-avatar" style={{ width: 64, height: 64 }}>
            <ClientIcon width="30" height="30" />
          </div>
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

        {(provider.instagramUrl || provider.tiktokUrl) && (
          <div className="profile-socials">
            {provider.instagramUrl && (
              <a href={provider.instagramUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                Instagram
              </a>
            )}
            {provider.tiktokUrl && (
              <a href={provider.tiktokUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                TikTok
              </a>
            )}
          </div>
        )}

        <div className="ratings-placeholder">
          <span className="coming-soon-badge">Próximamente</span>
          <p>Aún sin calificaciones de clientes.</p>
        </div>

        <button className="btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => onNavigate("registerClient")}>
          Contactar a {provider.nombreCompleto.split(" ")[0]}
        </button>
      </div>
    </div>
  );
}
