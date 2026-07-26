import { useEffect } from "react";

export default function ProviderModal({ provider, photos, onClose, onApprove, onReject }) {
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
          <div>
            <img src={photos?.fotoPerfil || ""} alt="Perfil" />
            <div className="ph-label">Perfil</div>
          </div>
          <div>
            <img src={photos?.selfie || ""} alt="Selfie" />
            <div className="ph-label">Selfie</div>
          </div>
          <div>
            <img src={photos?.fotoCedula || ""} alt="Cédula" />
            <div className="ph-label">Cédula</div>
          </div>
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
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Estado</td>
              <td style={{ textAlign: "right" }}>
                <span className={`status-pill status-${provider.estado}`}>
                  {provider.estado.toUpperCase()}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
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
    </div>
  );
}
