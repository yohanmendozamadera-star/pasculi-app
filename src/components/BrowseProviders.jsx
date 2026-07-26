import { useState } from "react";
import { ArrowLeftIcon, ClientIcon } from "./Icons.jsx";

export default function BrowseProviders({ providers, categories, onNavigate, onOpenProfile }) {
  const [categoria, setCategoria] = useState(null);

  const aprobados = providers.filter((p) => p.estado === "aprobado");

  if (!categoria) {
    return (
      <div style={{ padding: 0 }}>
        <button className="back-link" onClick={() => onNavigate("clientOptions")}>
          <ArrowLeftIcon width="16" height="16" /> Volver a las opciones
        </button>
        <div className="form-header">
          <h2>¿Qué servicio necesitas?</h2>
          <p>Elige una categoría para ver los proveedores verificados disponibles.</p>
        </div>
        <div className="cat-grid">
          {Object.keys(categories).map((c) => {
            const count = aprobados.filter((p) => p.categoria === c).length;
            return (
              <button key={c} className="cat-chip cat-chip-btn" onClick={() => setCategoria(c)}>
                <span className="dot" />
                <span>{c}</span>
                <span className="cat-chip-count">{count} disponible{count === 1 ? "" : "s"}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const list = aprobados.filter((p) => p.categoria === categoria);

  return (
    <div style={{ padding: 0 }}>
      <button className="back-link" onClick={() => setCategoria(null)}>
        <ArrowLeftIcon width="16" height="16" /> Otra categoría
      </button>
      <div className="form-header">
        <h2>{categoria}</h2>
        <p>
          {list.length} proveedor{list.length === 1 ? "" : "es"} verificado{list.length === 1 ? "" : "s"} en
          esta categoría.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <h3>Aún no hay proveedores aprobados aquí</h3>
          <p>Vuelve pronto o prueba con otra categoría.</p>
        </div>
      ) : (
        <div className="provider-list">
          {list.map((p) => (
            <div className="provider-card provider-card-clickable" key={p.id} onClick={() => onOpenProfile(p)}>
              <div className="provider-avatar">
                <ClientIcon width="20" height="20" />
              </div>
              <div className="provider-info">
                <h4>{p.nombreCompleto}</h4>
                <p className="provider-meta">{p.ciudad}</p>
                <div className="chip-select">
                  {(p.especialidades || []).map((sp) => (
                    <span key={sp} className="chip-option checked">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate("registerClient");
                }}
              >
                Contactar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
