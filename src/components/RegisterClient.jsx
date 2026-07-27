import { useState } from "react";
import { isValidEmail, isValidPhone } from "../lib/image.js";
import { insertClient } from "../lib/storage.js";
import PolicyCheckbox from "./PolicyCheckbox.jsx";
import { PinIcon } from "./Icons.jsx";

const EMPTY = { nombreCompleto: "", celular: "", correo: "", ciudad: "" };

export default function RegisterClient({ setClients, onNavigate, toast }) {
  const [form, setForm] = useState(EMPTY);
  const [loc, setLoc] = useState(null);
  const [locStatus, setLocStatus] = useState(
    "No se ha capturado la ubicación (opcional, ayuda a encontrarte proveedores cerca)."
  );
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocStatus("Tu navegador no permite compartir ubicación.");
      return;
    }
    setLocStatus("Obteniendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(next);
        setLocStatus(`Ubicación capturada: ${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`);
      },
      () => {
        setLocStatus("No se pudo obtener tu ubicación. Puedes continuar sin ella.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {
      nombreCompleto: !form.nombreCompleto.trim(),
      celular: !isValidPhone(form.celular),
      correo: !isValidEmail(form.correo),
      ciudad: !form.ciudad.trim(),
      policy: !acceptedPolicy,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast("Revisa los campos marcados en rojo.");
      return;
    }
    setSubmitting(true);
    const result = await insertClient(form, loc);
    setSubmitting(false);
    if (result.ok) {
      setClients((list) => [result.client, ...list]);
      toast("¡Registro de cliente exitoso!");
      setForm(EMPTY);
      setLoc(null);
      onNavigate("home");
    } else if (result.reason === "duplicate") {
      toast("Ya existe un cliente registrado con ese celular.");
    } else {
      toast("No se pudo guardar el registro, intenta de nuevo.");
    }
  }

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-card">
        <div className="form-header">
          <h2>Registro de cliente</h2>
          <p>Completa tus datos para empezar a solicitar servicios en Pasculi.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={`field-group ${errors.nombreCompleto ? "has-error" : ""}`}>
            <label>
              Nombre completo <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. María Fernanda Pérez"
              value={form.nombreCompleto}
              onChange={(e) => update("nombreCompleto", e.target.value)}
            />
            <span className="err-msg">Ingresa tu nombre completo.</span>
          </div>

          <div className="field-row two">
            <div className={`field-group ${errors.celular ? "has-error" : ""}`}>
              <label>
                Celular <span className="req">*</span>
                <span className="hint">Será tu usuario en Pasculi</span>
              </label>
              <input
                type="tel"
                placeholder="300 000 0000"
                value={form.celular}
                onChange={(e) => update("celular", e.target.value)}
              />
              <span className="err-msg">Ingresa un número de celular válido.</span>
            </div>
            <div className={`field-group ${errors.correo ? "has-error" : ""}`}>
              <label>
                Correo <span className="req">*</span>
              </label>
              <input
                type="email"
                placeholder="nombre@correo.com"
                value={form.correo}
                onChange={(e) => update("correo", e.target.value)}
              />
              <span className="err-msg">Ingresa un correo válido.</span>
            </div>
          </div>

          <div className={`field-group ${errors.ciudad ? "has-error" : ""}`}>
            <label>
              Ciudad <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="Escribe tu ciudad"
              value={form.ciudad}
              onChange={(e) => update("ciudad", e.target.value)}
            />
            <span className="err-msg">Ingresa tu ciudad.</span>
          </div>

          <button type="button" className="loc-btn" onClick={captureLocation}>
            <PinIcon width="16" height="16" /> Usar mi ubicación actual
          </button>
          <div className="loc-status">{locStatus}</div>

          <div style={{ marginTop: 18 }}>
            <PolicyCheckbox checked={acceptedPolicy} onChange={setAcceptedPolicy} error={errors.policy} />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Enviando…" : "Crear cuenta de cliente"}
          </button>
          <p className="small-note">
            Al registrarte aceptas ser contactado por Pasculi a través de tu celular.
          </p>
        </form>
      </div>
    </div>
  );
}
