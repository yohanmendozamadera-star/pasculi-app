export default function ProviderSuccess({ provider, onNavigate }) {
  if (!provider) {
    onNavigate("home");
    return null;
  }
  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <div className="form-card" style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: 8 }}>¡Registro enviado!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Tu perfil quedó en revisión. Este es tu carné de proveedor Pasculi. Con tu correo
          y contraseña puedes entrar cuando quieras a ver el estado de tu perfil.
        </p>
        <div className="carnet">
          <div className="carnet-top">
            <img className="carnet-photo" src={provider.fotoPerfilPreview || ""} alt="" />
            <div>
              <div className="carnet-name">{provider.nombreCompleto}</div>
              <div className="carnet-id">ID {provider.identificacion}</div>
            </div>
          </div>
          <div className="carnet-row">
            <span className="k">Celular</span>
            <span>{provider.celular}</span>
          </div>
          <div className="carnet-row">
            <span className="k">Ciudad</span>
            <span>{provider.ciudad}</span>
          </div>
          <div className="carnet-row">
            <span className="k">Categoría</span>
            <span>{provider.categoria}</span>
          </div>
          <div className="carnet-row">
            <span className="k">Estado</span>
            <span className="status-pill status-pendiente">EN REVISIÓN</span>
          </div>
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => onNavigate("providerDashboard")}>
            Ver mi perfil
          </button>
          <button className="btn-secondary" onClick={() => onNavigate("home")}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
