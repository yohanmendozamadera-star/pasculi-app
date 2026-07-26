import { useEffect, useState } from "react";
import ImageLightbox from "./ImageLightbox.jsx";

export default function ProviderModal({ provider, photos, onClose, onApprove, onReject }) {
  const [lightbox, setLightbox] = useState(null);

  // Bloquea el scroll de fondo mientras el modal está abierto: en varios
  // navegadores móviles un modal position:fixed sobre una página que sigue
  // haciendo scroll puede renderizar mal y dejar ver contenido de fondo.
  useEffect(() => {
    if (!provider) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [provider]);

  useEffect(() => {
    if (!provider) setLightbox(null);
  }, [provider]);

  if (!provider) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3 style={{ marginBottom: 4 }}>{provider.nombreCompleto}</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>
          Cédula {provider.identificacion} · {provider.celular}
        </p>
        <div className="modal-photos">
          {[
            { key: "fotoPerfil", label: "Perfil" },
            { key: "selfie", label: "Selfie" },
            { key: "fotoCedula", label: "Cédula (frente)" },
            { key: "fotoCedulaReverso", label: "Cédula (reverso)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <img
                src={photos?.[key] || ""}
                alt={label}
                onClick={() => photos?.[key] && setLightbox({ src: photos[key], alt: label })}
              />
              <div className="ph-label">{label}</div>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", fontSize: 13.5 }}>
          <tbody>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Correo</td>
              <td style={{ textAlign: "right" }}>{provider.correo}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Ciudad</td>
              <td style={{ textAlign: "right" }}>{provider.ciudad}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Dirección</td>
              <td style={{ textAlign: "right" }}>{provider.direccion}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Ubicación GPS</td>
              <td style={{ textAlign: "right" }}>
                {provider.ubicacion
                  ? `${provider.ubicacion.lat.toFixed(5)}, ${provider.ubicacion.lng.toFixed(5)}`
                  : "No capturada"}
              </td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Categoría</td>
              <td style={{ textAlign: "right" }}>{provider.categoria}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Especialidades</td>
              <td style={{ textAlign: "right" }}>{(provider.especialidades || []).join(", ")}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Redes sociales</td>
              <td style={{ textAlign: "right" }}>
                {provider.instagramUrl && (
                  <a href={provider.instagramUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 10 }}>
                    Instagram
                  </a>
                )}
                {provider.tiktokUrl && (
                  <a href={provider.tiktokUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 10 }}>
                    TikTok
                  </a>
                )}
                {!provider.instagramUrl && !provider.tiktokUrl && "Sin registrar"}
              </td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Vistas del perfil</td>
              <td style={{ textAlign: "right" }}>{provider.profileViews ?? 0}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Estado</td>
              <td style={{ textAlign: "right" }}>
                <span className={`status-pill status-${provider.estado}`}>
                  {provider.estado.toUpperCase()}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="ratings-placeholder">
          <span className="coming-soon-badge">Próximamente</span>
          <p>Aún sin calificaciones de clientes.</p>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {provider.estado !== "aprobado" && (
            <button className="row-btn approve" style={{ flex: 1 }} onClick={() => onApprove(provider.id)}>
              Aprobar
            </button>
          )}
          {provider.estado !== "rechazado" && (
            <button className="row-btn reject" style={{ flex: 1 }} onClick={() => onReject(provider.id)}>
              Rechazar
            </button>
          )}
        </div>
      </div>

      <ImageLightbox src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  );
}
