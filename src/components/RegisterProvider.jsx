import { useState, useEffect } from "react";
import { CIUDADES } from "../data/categories.js";
import { isValidEmail, isValidPhone, uid } from "../lib/image.js";
import { insertProvider, uploadProviderPhotos, ensureAuthSession, finalizeProviderAccount } from "../lib/storage.js";
import PhotoSlot from "./PhotoSlot.jsx";
import { PinIcon } from "./Icons.jsx";

const EMPTY = {
  nombreCompleto: "",
  identificacion: "",
  celular: "",
  correo: "",
  ciudad: "",
  direccion: "",
  categoria: "",
  instagramUrl: "",
  tiktokUrl: "",
  password: "",
  confirmPassword: "",
};

const EMPTY_PHOTOS = { fotoPerfil: null, selfie: null, fotoCedula: null, fotoCedulaReverso: null };

// En celular, abrir la cámara para la selfie o la foto de cédula puede
// hacer que el navegador recargue la página al volver (por falta de
// memoria) y perder todo lo llenado. Guardamos el progreso a medida que se
// escribe para poder recuperarlo si eso pasa.
const DRAFT_KEY = "pasculi:providerDraft";

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function RegisterProvider({ setProviders, categories, onNavigate, toast, setLastProvider }) {
  const draft = loadDraft();
  const [form, setForm] = useState(draft?.form || EMPTY);
  const [especialidades, setEspecialidades] = useState(draft?.especialidades || []);
  const [photos, setPhotos] = useState(draft?.photos || EMPTY_PHOTOS);
  const [loc, setLoc] = useState(draft?.loc || null);
  const [locStatus, setLocStatus] = useState(
    draft?.loc
      ? `Ubicación capturada: ${draft.loc.lat.toFixed(5)}, ${draft.loc.lng.toFixed(5)}`
      : "No se ha capturado la ubicación (opcional, ayuda a los clientes a encontrarte)."
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, especialidades, photos, loc }));
    } catch {
      // si no cabe en sessionStorage simplemente no se recupera el borrador
    }
  }, [form, especialidades, photos, loc]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleEspecialidad(sp) {
    setEspecialidades((list) =>
      list.includes(sp) ? list.filter((x) => x !== sp) : [...list, sp]
    );
  }

  function handleCategoriaChange(value) {
    update("categoria", value);
    setEspecialidades([]);
  }

  function handlePhotoChange(key, dataUrl) {
    setPhotos((p) => ({ ...p, [key]: dataUrl }));
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
    const fotosOk = photos.fotoPerfil && photos.selfie && photos.fotoCedula && photos.fotoCedulaReverso;
    const next = {
      nombreCompleto: !form.nombreCompleto.trim(),
      identificacion: !form.identificacion.trim(),
      celular: !isValidPhone(form.celular),
      correo: !isValidEmail(form.correo),
      ciudad: !form.ciudad,
      direccion: !form.direccion.trim(),
      categoria: !form.categoria,
      especialidades: especialidades.length === 0,
      fotos: !fotosOk,
      password: form.password.length < 6,
      confirmPassword: form.password !== form.confirmPassword,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast("Revisa los campos marcados en rojo.");
      return;
    }
    setSubmitting(true);
    const id = uid();

    const session = await ensureAuthSession();
    if (!session) {
      setSubmitting(false);
      toast("No se pudo iniciar tu registro, intenta de nuevo.");
      return;
    }

    const photoPaths = await uploadProviderPhotos(photos);
    if (!photoPaths) {
      setSubmitting(false);
      toast("No se pudieron subir las fotos, intenta de nuevo.");
      return;
    }

    const result = await insertProvider(id, form, especialidades, loc, photoPaths, session.user.id);

    if (!result.ok) {
      setSubmitting(false);
      if (result.reason === "duplicate") {
        toast("Ya existe un proveedor registrado con ese celular.");
      } else {
        toast("No se pudo guardar el registro, intenta de nuevo.");
      }
      return;
    }

    await finalizeProviderAccount(form.correo, form.password);
    setSubmitting(false);

    setProviders((list) => [result.provider, ...list]);
    setLastProvider({ ...result.provider, fotoPerfilPreview: photos.fotoPerfil });
    setForm(EMPTY);
    setEspecialidades([]);
    setPhotos(EMPTY_PHOTOS);
    setLoc(null);
    sessionStorage.removeItem(DRAFT_KEY);
    onNavigate("providerSuccess");
  }

  const specialtyList = form.categoria ? categories[form.categoria] || [] : [];

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-card">
        <div className="form-header">
          <h2>Registro de proveedor</h2>
          <p>
            Crea tu perfil de proveedor en Pasculi. Con tu correo y contraseña podrás
            entrar después a ver el estado de tu perfil. Quedará pendiente de aprobación
            por el administrador.
          </p>
          <p className="small-note">
            ¿Ya te registraste antes?{" "}
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: 0 }}
              onClick={() => onNavigate("providerDashboard")}
            >
              Entra a ver tu perfil
            </button>
          </p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="section-divider">
            <span className="num">1</span>
            <h4>Datos personales</h4>
          </div>

          <div className={`field-group ${errors.nombreCompleto ? "has-error" : ""}`}>
            <label>
              Nombre completo <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Carlos Andrés Martínez"
              value={form.nombreCompleto}
              onChange={(e) => update("nombreCompleto", e.target.value)}
            />
            <span className="err-msg">Ingresa tu nombre completo.</span>
          </div>

          <div className="field-row two">
            <div className={`field-group ${errors.identificacion ? "has-error" : ""}`}>
              <label>
                Identificación (cédula) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Número de cédula"
                value={form.identificacion}
                onChange={(e) => update("identificacion", e.target.value)}
              />
              <span className="err-msg">Ingresa tu número de identificación.</span>
            </div>
            <div className={`field-group ${errors.celular ? "has-error" : ""}`}>
              <label>
                Celular <span className="req">*</span>
              </label>
              <input
                type="tel"
                placeholder="300 000 0000"
                value={form.celular}
                onChange={(e) => update("celular", e.target.value)}
              />
              <span className="err-msg">Ingresa un número de celular válido.</span>
            </div>
          </div>

          <div className="field-row two">
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
            <div className={`field-group ${errors.ciudad ? "has-error" : ""}`}>
              <label>
                Ciudad <span className="req">*</span>
              </label>
              <select value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)}>
                <option value="">Selecciona tu ciudad</option>
                {CIUDADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="err-msg">Selecciona tu ciudad.</span>
            </div>
          </div>

          <div className="field-row two">
            <div className={`field-group ${errors.password ? "has-error" : ""}`}>
              <label>
                Contraseña <span className="req">*</span>
                <span className="hint">Para entrar después a ver tu perfil</span>
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <span className="err-msg">Mínimo 6 caracteres.</span>
            </div>
            <div className={`field-group ${errors.confirmPassword ? "has-error" : ""}`}>
              <label>
                Confirmar contraseña <span className="req">*</span>
              </label>
              <input
                type="password"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              <span className="err-msg">Las contraseñas no coinciden.</span>
            </div>
          </div>

          <div className="section-divider">
            <span className="num">2</span>
            <h4>Fotos de verificación</h4>
          </div>
          <div className="photo-grid">
            <PhotoSlot
              slotKey="fotoPerfil"
              title="Foto de perfil"
              hint="Desde tu galería"
              value={photos.fotoPerfil}
              onChange={handlePhotoChange}
            />
            <PhotoSlot
              slotKey="selfie"
              title="Selfie obligatoria"
              hint="Toma la foto en el momento"
              capture="user"
              value={photos.selfie}
              onChange={handlePhotoChange}
            />
            <PhotoSlot
              slotKey="fotoCedula"
              title="Cédula (frente)"
              hint="Foto clara y legible"
              capture="environment"
              value={photos.fotoCedula}
              onChange={handlePhotoChange}
            />
            <PhotoSlot
              slotKey="fotoCedulaReverso"
              title="Cédula (reverso)"
              hint="Foto clara y legible"
              capture="environment"
              value={photos.fotoCedulaReverso}
              onChange={handlePhotoChange}
            />
          </div>
          <div className={`field-group ${errors.fotos ? "has-error" : ""}`} style={{ marginTop: 10 }}>
            <span className="err-msg">Debes cargar las 4 fotos: perfil, selfie y cédula (frente y reverso).</span>
          </div>

          <div className="section-divider">
            <span className="num">3</span>
            <h4>Servicio que prestas</h4>
          </div>
          <div className={`field-group ${errors.categoria ? "has-error" : ""}`}>
            <label>
              Categoría <span className="req">*</span>
            </label>
            <select value={form.categoria} onChange={(e) => handleCategoriaChange(e.target.value)}>
              <option value="">Selecciona una categoría</option>
              {Object.keys(categories).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="err-msg">Selecciona una categoría.</span>
          </div>
          <div className={`field-group ${errors.especialidades ? "has-error" : ""}`}>
            <label>
              Especialidades <span className="req">*</span>
              <span className="hint">Puedes elegir varias</span>
            </label>
            {specialtyList.length === 0 ? (
              <p className="small-note">
                Selecciona primero una categoría para ver las especialidades disponibles.
              </p>
            ) : (
              <div className="chip-select">
                {specialtyList.map((sp) => (
                  <label
                    key={sp}
                    className={`chip-option ${especialidades.includes(sp) ? "checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={especialidades.includes(sp)}
                      onChange={() => toggleEspecialidad(sp)}
                    />
                    {sp}
                  </label>
                ))}
              </div>
            )}
            <span className="err-msg">Selecciona al menos una especialidad.</span>
          </div>

          <div className="section-divider">
            <span className="num">4</span>
            <h4>Ubicación</h4>
          </div>
          <div className={`field-group ${errors.direccion ? "has-error" : ""}`}>
            <label>
              Dirección de residencia <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="Calle, número, barrio"
              value={form.direccion}
              onChange={(e) => update("direccion", e.target.value)}
            />
            <span className="err-msg">Ingresa tu dirección.</span>
          </div>
          <button type="button" className="loc-btn" onClick={captureLocation}>
            <PinIcon width="16" height="16" /> Usar mi ubicación actual
          </button>
          <div className="loc-status">{locStatus}</div>

          <div className="section-divider">
            <span className="num">5</span>
            <h4>Redes sociales</h4>
          </div>
          <div className="field-row two">
            <div className="field-group">
              <label>
                Instagram <span className="hint">Opcional</span>
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/tu_usuario"
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>
                TikTok <span className="hint">Opcional</span>
              </label>
              <input
                type="url"
                placeholder="https://tiktok.com/@tu_usuario"
                value={form.tiktokUrl}
                onChange={(e) => update("tiktokUrl", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar registro de proveedor"}
            </button>
            <p className="small-note">
              Tu perfil quedará en estado "pendiente" hasta que el administrador lo apruebe.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
