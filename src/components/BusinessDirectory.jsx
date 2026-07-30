import { useState } from "react";
import { searchProducts, getBusinessPhotoUrl } from "../lib/businessStorage.js";
import { fmtPrice } from "../lib/image.js";
import { SearchIcon, ArrowLeftIcon } from "./Icons.jsx";

export default function BusinessDirectory({ onNavigate, onOpenProduct }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const found = await searchProducts(query.trim());
    setResults(found);
    setSearching(false);
  }

  return (
    <div style={{ padding: 0 }}>
      <button className="back-link" onClick={() => onNavigate("home")}>
        <ArrowLeftIcon width="16" height="16" /> Volver al inicio
      </button>

      <div className="form-header">
        <h2>Directorio de negocios</h2>
        <p>Busca un producto y te mostramos qué negocios lo tienen, con foto y precio.</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="¿Qué estás buscando? Ej. torta, camisa, celular…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ flexShrink: 0 }} disabled={searching}>
          <SearchIcon width="16" height="16" style={{ marginRight: 6, verticalAlign: "-3px" }} />
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {results === null ? (
        <div className="empty-state">
          <h3>Escribe qué producto buscas</h3>
          <p>Te mostraremos los negocios aprobados que lo tienen disponible.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <h3>No encontramos productos con ese nombre</h3>
          <p>Prueba con otra palabra, o vuelve pronto.</p>
        </div>
      ) : (
        <div className="product-grid">
          {results.map((p) => (
            <button className="product-card" key={p.id} onClick={() => onOpenProduct(p)}>
              {p.fotoPath ? (
                <img src={getBusinessPhotoUrl(p.fotoPath)} alt={p.nombre} />
              ) : (
                <div className="product-card-noimg">Sin foto</div>
              )}
              <div className="product-card-body">
                <h4>{p.nombre}</h4>
                {fmtPrice(p.precio) && <div className="product-price">{fmtPrice(p.precio)}</div>}
                <p className="small-note" style={{ margin: 0 }}>
                  {p.businessNombre} · {p.businessCiudad}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="small-note" style={{ textAlign: "center", marginTop: 24 }}>
        ¿Tienes un negocio?{" "}
        <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate("registerBusiness")}>
          Regístralo gratis
        </button>
      </p>
    </div>
  );
}
