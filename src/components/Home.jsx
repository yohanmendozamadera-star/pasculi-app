import { ClientIcon, ProviderIcon } from "./Icons.jsx";

export default function Home({ providers, categories, onNavigate }) {
  const aprobados = providers.filter((p) => p.estado === "aprobado").length;
  const totalCategorias = Object.keys(categories).length;

  return (
    <>
      <section className="hero">
        <span className="hero-eyebrow">Barranquilla · Soledad</span>
        <h1>Servicios de confianza, verificados, cerca de ti</h1>
        <p className="sub">
          Pasculi conecta clientes con proveedores de servicios del hogar verificados con
          cédula y selfie. Regístrate como cliente o como proveedor, así como quieras usar
          la plataforma.
        </p>
        <div className="hero-badges">
          <span className="hero-badge">{aprobados} proveedores aprobados</span>
          <span className="hero-badge">{totalCategorias} categorías de servicio</span>
          <span className="hero-badge">Verificación con cédula</span>
        </div>
      </section>

      <div className="cta-grid">
        <button className="cta-card" onClick={() => onNavigate("clientOptions")}>
          <div className="cta-icon teal">
            <ClientIcon width="22" height="22" />
          </div>
          <h3>Soy cliente</h3>
          <p>Regístrate en segundos y encuentra proveedores verificados para lo que necesites.</p>
          <span className="cta-arrow">Registrarme como cliente →</span>
        </button>
        <button className="cta-card" onClick={() => onNavigate("providerOptions")}>
          <div className="cta-icon mango">
            <ProviderIcon width="22" height="22" />
          </div>
          <h3>Soy proveedor</h3>
          <p>Crea tu perfil, verifica tu identidad y elige las categorías donde prestas servicio.</p>
          <span className="cta-arrow">Registrarme como proveedor →</span>
        </button>
      </div>

      <h3 className="section-title">Categorías disponibles</h3>
      <div className="cat-grid">
        {Object.keys(categories).map((c) => (
          <div className="cat-chip" key={c}>
            <span className="dot" />
            {c}
          </div>
        ))}
      </div>

      <footer>Pasculi · Marketplace de servicios locales · Barranquilla y Soledad</footer>
    </>
  );
}
