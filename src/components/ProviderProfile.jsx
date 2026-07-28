import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ClientIcon, PlayIcon } from "./Icons.jsx";
import { incrementProviderViews, getProviderShowcasePhotos, createServiceRequest } from "../lib/storage.js";
import { isValidEmail, isValidPhone } from "../lib/image.js";
import ImageLightbox from "./admin/ImageLightbox.jsx";

const EMPTY_REQUEST = { nombre: "", celular: "", correo: "", mensaje: "" };

export default function ProviderProfile({ provider, onNavigate, toast }) {
  const counted = useRef(false);
  const [photos, setPhotos] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [requestErrors, setRequestErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  async function handleSendRequest(e) {
    e.preventDefault();
    const next = {
      nombre: !requestForm.nombre.trim(),
      celular: !isValidPhone(requestForm.celular),
      correo: !isValidEmail(requestForm.correo),
    };
    setRequestErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast("Revisa los campos marcados en rojo.");
      return;
    }
    setSending(true);
    const ok = await createServiceRequest(provider.id, requestForm);
    setSending(false);
    if (ok) {
      setSent(true);
      setRequesting(false);
      setRequestForm(EMPTY_REQUEST);
    } else {
      toast("No se pudo enviar la solicitud, intenta de nuevo.");
    }
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

        {sent ? (
          <div className="empty-state" style={{ marginTop: 20 }}>
            <h3>¡Solicitud enviada!</h3>
            <p>{provider.nombreCompleto.split(" ")[0]} verá tu solicitud y te contactará pronto.</p>
          </div>
        ) : !requesting ? (
          <button className="btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => setRequesting(true)}>
            Solicitar servicio a {provider.nombreCompleto.split(" ")[0]}
          </button>
        ) : (
          <form onSubmit={handleSendRequest} style={{ marginTop: 20 }} noValidate>
            <div className="section-divider">
              <h4>Cuéntale qué necesitas</h4>
            </div>
            <div className={`field-group ${requestErrors.nombre ? "has-error" : ""}`}>
              <label>
                Tu nombre <span className="req">*</span>
              </label>
              <input
                type="text"
                value={requestForm.nombre}
                onChange={(e) => setRequestForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <span className="err-msg">Ingresa tu nombre.</span>
            </div>
            <div className="field-row two">
              <div className={`field-group ${requestErrors.celular ? "has-error" : ""}`}>
                <label>
                  Celular <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="300 000 0000"
                  value={requestForm.celular}
                  onChange={(e) => setRequestForm((f) => ({ ...f, celular: e.target.value }))}
                />
                <span className="err-msg">Ingresa un celular válido.</span>
              </div>
              <div className={`field-group ${requestErrors.correo ? "has-error" : ""}`}>
                <label>
                  Correo <span className="req">*</span>
                </label>
                <input
                  type="email"
                  placeholder="nombre@correo.com"
                  value={requestForm.correo}
                  onChange={(e) => setRequestForm((f) => ({ ...f, correo: e.target.value }))}
                />
                <span className="err-msg">Ingresa un correo válido.</span>
              </div>
            </div>
            <div className="field-group">
              <label>
                ¿Qué necesitas? <span className="hint">Opcional</span>
              </label>
              <textarea
                rows={3}
                value={requestForm.mensaje}
                onChange={(e) => setRequestForm((f) => ({ ...f, mensaje: e.target.value }))}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? "Enviando…" : "Enviar solicitud"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setRequesting(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <ImageLightbox src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  );
}
