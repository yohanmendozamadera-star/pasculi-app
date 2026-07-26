import { ArrowLeftIcon } from "./Icons.jsx";

export default function ComingSoon({ icon: Icon, iconTone, title, description, onNavigate }) {
  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <button className="back-link" onClick={() => onNavigate("clientOptions")}>
        <ArrowLeftIcon width="16" height="16" /> Volver a las opciones
      </button>

      <div className="coming-soon-card">
        <div className={`cta-icon ${iconTone}`} style={{ width: 56, height: 56, margin: "0 auto 18px" }}>
          <Icon width="26" height="26" />
        </div>
        <span className="coming-soon-badge">Próximamente</span>
        <h2 style={{ marginTop: 10 }}>{title}</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>{description}</p>
        <button className="btn-primary" style={{ marginTop: 22 }} onClick={() => onNavigate("browseProviders")}>
          Mientras tanto, buscar por categoría
        </button>
      </div>
    </div>
  );
}
