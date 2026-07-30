import { useEffect, useState } from "react";
import { CIUDADES } from "../data/categories.js";
import { isValidEmail, isValidPhone } from "../lib/image.js";
import { registerBusiness, getBusinessCategories } from "../lib/businessStorage.js";
import PolicyCheckbox from "./PolicyCheckbox.jsx";
import PhotoSlot from "./PhotoSlot.jsx";
import { PinIcon } from "./Icons.jsx";

const EMPTY_FORM = {
  nombreNegocio: "",
  nombreContacto: "",
  celular: "",
  correo: "",
  ciudad: "",
  direccion: "",
  categoria: "",
  descripcion: "",
  instagramUrl: "",
  facebookUrl: "",
  whatsappUrl: "",
};

const EMPTY_PRODUCT = { nombre: "", precio: "", descripcion: "", fotoDataUrl: null };

export default function RegisterBusiness({ onNavigate, toast }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fotoNegocio, setFotoNegocio] = useState(null);
  const [productos, setProductos] = useState([{ ...EMPTY_PRODUCT }]);
  const [loc, setLoc] = useState(null);
  const [locStatus, setLocStatus] = useState(
    "No se ha capturado la ubicación (ayuda a los clientes a encontrarte en el mapa)."
  );
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBusinessCategories().then(setCategories);
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateProduct(index, field, value) {
    setProductos((list) => list.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addProduct() {
    setProductos((list) => [...list, { ...EMPTY_PRODUCT }]);
  }

  function removeProduct(index) {
    setProductos((list) => list.filter((_, i) => i !== index));
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
      () => setLocStatus("No se pudo obtener tu ubicación. Puedes continuar sin ella."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const productosValidos = productos.filter((p) => p.nombre.trim());
    const next = {
      nombreNegocio: !form.nombreNegocio.trim(),
      nombreContacto: !form.nombreContacto.trim(),
      celular: !isValidPhone(form.celular),
      correo: !isValidEmail(form.correo),
      ciudad: !form.ciudad,
      direccion: !form.direccion.trim(),
      categoria: !form.categoria,
      fotoNegocio: !fotoNegocio,
      productos: productosValidos.length === 0,
      policy: !acceptedPolicy,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast("Revisa los campos marcados en rojo.");
      return;
    }
    setSubmitting(true);
    const result = await registerBusiness(form, loc, fotoNegocio, productosValidos);
    setSubmitting(false);
    if (!result.ok) {
      if (result.reason === "duplicate") {
        toast("Ya existe un negocio registrado con ese celular.");
      } else {
        toast("No se pudo registrar el negocio, intenta de nuevo.");
      }
      return;
    }
    toast("¡Negocio registrado! Queda pendiente de aprobación.");
    onNavigate("home");
  }

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-card">
        <div className="form-header">
          <h2>Registra tu negocio</h2>
          <p>
            Gratis. Carga tus productos y tu negocio aparecerá en el buscador de Pasculi una vez
            aprobado por el administrador.
          </p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="section-divider">
            <span className="num">1</span>
            <h4>Datos del negocio</h4>
          </div>

          <div className={`field-group ${errors.nombreNegocio ? "has-error" : ""}`}>
            <label>
              Nombre del negocio <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Panadería Doña Rosa"
              value={form.nombreNegocio}
              onChange={(e) => update("nombreNegocio", e.target.value)}
            />
            <span className="err-msg">Ingresa el nombre del negocio.</span>
          </div>

          <div className="field-row two">
            <div className={`field-group ${errors.nombreContacto ? "has-error" : ""}`}>
              <label>
                Nombre de contacto <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.nombreContacto}
                onChange={(e) => update("nombreContacto", e.target.value)}
              />
              <span className="err-msg">Ingresa tu nombre.</span>
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
              <span className="err-msg">Ingresa un celular válido.</span>
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

          <div className={`field-group ${errors.direccion ? "has-error" : ""}`}>
            <label>
              Dirección <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="Calle, número, barrio"
              value={form.direccion}
              onChange={(e) => update("direccion", e.target.value)}
            />
            <span className="err-msg">Ingresa la dirección.</span>
          </div>
          <button type="button" className="loc-btn" onClick={captureLocation}>
            <PinIcon width="16" height="16" /> Usar mi ubicación actual
          </button>
          <div className="loc-status">{locStatus}</div>

          <div className={`field-group ${errors.categoria ? "has-error" : ""}`} style={{ marginTop: 16 }}>
            <label>
              Categoría <span className="req">*</span>
            </label>
            <select value={form.categoria} onChange={(e) => update("categoria", e.target.value)}>
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="err-msg">Selecciona una categoría.</span>
          </div>

          <div className="field-group">
            <label>
              Descripción del negocio <span className="hint">Opcional</span>
            </label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => update("descripcion", e.target.value)}
            />
          </div>

          <div className={`field-group ${errors.fotoNegocio ? "has-error" : ""}`}>
            <label>
              Foto del negocio <span className="req">*</span>
            </label>
            <div className="photo-grid" style={{ gridTemplateColumns: "1fr" }}>
              <PhotoSlot
                slotKey="fotoNegocio"
                title="Foto o logo"
                hint="Desde tu galería"
                value={fotoNegocio}
                onChange={(_key, dataUrl) => setFotoNegocio(dataUrl)}
              />
            </div>
            <span className="err-msg">Sube una foto de tu negocio.</span>
          </div>

          <div className="section-divider">
            <span className="num">2</span>
            <h4>Redes sociales</h4>
          </div>
          <div className="field-row two">
            <div className="field-group">
              <label>
                Instagram <span className="hint">Opcional</span>
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/tu_negocio"
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>
                Facebook <span className="hint">Opcional</span>
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/tu_negocio"
                value={form.facebookUrl}
                onChange={(e) => update("facebookUrl", e.target.value)}
              />
            </div>
          </div>
          <div className="field-group">
            <label>
              WhatsApp <span className="hint">Opcional</span>
            </label>
            <input
              type="url"
              placeholder="https://wa.me/57300..."
              value={form.whatsappUrl}
              onChange={(e) => update("whatsappUrl", e.target.value)}
            />
          </div>

          <div className="section-divider">
            <span className="num">3</span>
            <h4>Tus productos</h4>
          </div>
          <div className={`field-group ${errors.productos ? "has-error" : ""}`}>
            <span className="err-msg">Agrega al menos un producto con nombre.</span>
          </div>
          {productos.map((p, i) => (
            <div className="form-card" key={i} style={{ background: "var(--bg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: 14 }}>Producto {i + 1}</h4>
                {productos.length > 1 && (
                  <button type="button" className="btn-ghost" onClick={() => removeProduct(i)}>
                    Quitar
                  </button>
                )}
              </div>
              <div className="field-row two">
                <div className="field-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej. Torta de chocolate"
                    value={p.nombre}
                    onChange={(e) => updateProduct(i, "nombre", e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Precio (COP)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={p.precio}
                    onChange={(e) => updateProduct(i, "precio", e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Descripción</label>
                <input
                  type="text"
                  placeholder="Breve descripción"
                  value={p.descripcion}
                  onChange={(e) => updateProduct(i, "descripcion", e.target.value)}
                />
              </div>
              <div className="photo-grid" style={{ gridTemplateColumns: "1fr" }}>
                <PhotoSlot
                  slotKey={`producto-${i}`}
                  title="Foto del producto"
                  hint="Opcional"
                  value={p.fotoDataUrl}
                  onChange={(_key, dataUrl) => updateProduct(i, "fotoDataUrl", dataUrl)}
                />
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addProduct}>
            + Agregar otro producto
          </button>

          <div style={{ marginTop: 18 }}>
            <PolicyCheckbox checked={acceptedPolicy} onChange={setAcceptedPolicy} error={errors.policy} />
          </div>

          <div style={{ marginTop: 26 }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Enviando…" : "Registrar mi negocio"}
            </button>
            <p className="small-note">
              Tu negocio quedará en estado "pendiente" hasta que el administrador lo apruebe.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
