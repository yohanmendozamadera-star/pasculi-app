import { ProviderIcon, ShieldIcon } from "./Icons.jsx";

export default function ProviderOptions({ onNavigate }) {
  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-header" style={{ textAlign: "center" }}>
        <h2>Zona de proveedores</h2>
        <p>Regístrate por primera vez o entra a ver tu perfil si ya tienes cuenta.</p>
      </div>

      <div className="cta-grid">
        <button className="cta-card" onClick={() => onNavigate("registerProvider")}>
          <div className="cta-icon mango">
            <ProviderIcon width="22" height="22" />
          </div>
          <h3>Registrarme</h3>
          <p>Crea tu perfil, verifica tu identidad y elige las categorías donde prestas servicio.</p>
          <span className="cta-arrow">Empezar registro →</span>
        </button>

        <button className="cta-card" onClick={() => onNavigate("providerDashboard")}>
          <div className="cta-icon teal">
            <ShieldIcon width="22" height="22" />
          </div>
          <h3>Ya tengo cuenta</h3>
          <p>Entra con tu correo y contraseña a ver el estado de tu perfil.</p>
          <span className="cta-arrow">Iniciar sesión →</span>
        </button>
      </div>

      <button className="btn-ghost" style={{ width: "100%" }} onClick={() => onNavigate("home")}>
        Volver al inicio
      </button>
    </div>
  );
}
