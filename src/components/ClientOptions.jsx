import { SearchIcon, StarIcon, ClipboardIcon } from "./Icons.jsx";

export default function ClientOptions({ onNavigate }) {
  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-header" style={{ textAlign: "center" }}>
        <h2>¿Cómo quieres encontrar tu servicio?</h2>
        <p>Elige la forma que prefieras. Puedes cambiar de opción en cualquier momento.</p>
      </div>

      <div className="cta-grid cols-3">
        <button className="cta-card" onClick={() => onNavigate("browseProviders")}>
          <div className="cta-icon teal">
            <SearchIcon width="22" height="22" />
          </div>
          <h3>Buscar por categoría</h3>
          <p>Explora proveedores verificados organizados por el servicio que necesitas.</p>
          <span className="cta-arrow">Explorar categorías →</span>
        </button>

        <button className="cta-card" onClick={() => onNavigate("topRated")}>
          <div className="cta-icon mango">
            <StarIcon width="22" height="22" />
          </div>
          <h3>Mejor calificados</h3>
          <p>Encuentra a los proveedores con mejor puntuación de otros clientes.</p>
          <span className="cta-arrow">Ver calificados →</span>
        </button>

        <button className="cta-card" onClick={() => onNavigate("requestService")}>
          <div className="cta-icon coral">
            <ClipboardIcon width="22" height="22" />
          </div>
          <h3>Solicitar un servicio</h3>
          <p>Cuéntanos qué necesitas y deja que los proveedores interesados te contacten.</p>
          <span className="cta-arrow">Publicar solicitud →</span>
        </button>
      </div>

      <button className="btn-ghost" style={{ width: "100%" }} onClick={() => onNavigate("home")}>
        Volver al inicio
      </button>
    </div>
  );
}
