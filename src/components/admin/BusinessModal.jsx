import { useEffect, useState } from "react";
import { getBusinessProducts, getBusinessPhotoUrl } from "../../lib/businessStorage.js";
import { fmtPrice } from "../../lib/image.js";
import ImageLightbox from "./ImageLightbox.jsx";

export default function BusinessModal({ business, onClose, onApprove, onReject }) {
  const [products, setProducts] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!business) {
      setProducts(null);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    getBusinessProducts(business.id).then(setProducts);
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [business]);

  if (!business) return null;
  const fotoNegocio = business.fotoNegocioPath ? getBusinessPhotoUrl(business.fotoNegocioPath) : null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3 style={{ marginBottom: 4 }}>{business.nombreNegocio}</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>
          {business.nombreContacto} · {business.celular}
        </p>

        {fotoNegocio && (
          <img
            src={fotoNegocio}
            alt={business.nombreNegocio}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 10, cursor: "zoom-in", marginBottom: 14 }}
            onClick={() => setLightbox({ src: fotoNegocio, alt: business.nombreNegocio })}
          />
        )}

        <table style={{ width: "100%", fontSize: 13.5 }}>
          <tbody>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Correo</td>
              <td style={{ textAlign: "right" }}>{business.correo}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Ciudad</td>
              <td style={{ textAlign: "right" }}>{business.ciudad}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Dirección</td>
              <td style={{ textAlign: "right" }}>{business.direccion}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Categoría</td>
              <td style={{ textAlign: "right" }}>{business.categoria}</td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Vistas / Clics</td>
              <td style={{ textAlign: "right" }}>
                {business.profileViews ?? 0} / {business.contactClicks ?? 0}
              </td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "6px 0" }}>Estado</td>
              <td style={{ textAlign: "right" }}>
                <span className={`status-pill status-${business.estado}`}>{business.estado.toUpperCase()}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ marginTop: 16, marginBottom: 8, fontSize: 14 }}>Productos</h4>
        {!products ? (
          <p className="small-note">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="small-note">Sin productos.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const url = p.fotoPath ? getBusinessPhotoUrl(p.fotoPath) : null;
              return (
                <div className="product-card" key={p.id} style={{ cursor: "default" }}>
                  {url ? (
                    <img
                      src={url}
                      alt={p.nombre}
                      style={{ cursor: "zoom-in" }}
                      onClick={() => setLightbox({ src: url, alt: p.nombre })}
                    />
                  ) : (
                    <div className="product-card-noimg">Sin foto</div>
                  )}
                  <div className="product-card-body">
                    <h4>{p.nombre}</h4>
                    {fmtPrice(p.precio) && <div className="product-price">{fmtPrice(p.precio)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {business.estado !== "aprobado" && (
            <button className="row-btn approve" style={{ flex: 1 }} onClick={() => onApprove(business.id)}>
              Aprobar
            </button>
          )}
          {business.estado !== "rechazado" && (
            <button className="row-btn reject" style={{ flex: 1 }} onClick={() => onReject(business.id)}>
              Rechazar
            </button>
          )}
        </div>
      </div>

      <ImageLightbox src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  );
}
