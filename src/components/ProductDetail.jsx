import { useEffect, useRef, useState } from "react";
import {
  getBusiness,
  getBusinessPhotoUrl,
  incrementBusinessViews,
  incrementBusinessContactClicks,
} from "../lib/businessStorage.js";
import { fmtPrice } from "../lib/image.js";
import { ArrowLeftIcon, PinIcon } from "./Icons.jsx";
import ImageLightbox from "./admin/ImageLightbox.jsx";

function mapsUrl(business) {
  if (business.ubicacion) {
    return `https://www.google.com/maps/search/?api=1&query=${business.ubicacion.lat},${business.ubicacion.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.direccion}, ${business.ciudad}`
  )}`;
}

function whatsappUrl(business) {
  if (business.whatsappUrl) return business.whatsappUrl;
  const digits = business.celular.replace(/\D/g, "");
  return `https://wa.me/57${digits}`;
}

export default function ProductDetail({ product, onNavigate }) {
  const counted = useRef(false);
  const [business, setBusiness] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!product) return;
    getBusiness(product.businessId).then(setBusiness);
    if (!counted.current) {
      counted.current = true;
      incrementBusinessViews(product.businessId);
    }
  }, [product]);

  if (!product) {
    onNavigate("businessDirectory");
    return null;
  }

  function trackClick() {
    incrementBusinessContactClicks(product.businessId);
  }

  const productPhoto = product.fotoPath ? getBusinessPhotoUrl(product.fotoPath) : null;
  const negocioPhoto = business?.fotoNegocioPath ? getBusinessPhotoUrl(business.fotoNegocioPath) : null;

  return (
    <div className="wrap-narrow" style={{ padding: 0 }}>
      <button className="back-link" onClick={() => onNavigate("businessDirectory")}>
        <ArrowLeftIcon width="16" height="16" /> Volver a la búsqueda
      </button>

      <div className="form-card">
        {productPhoto && (
          <img
            src={productPhoto}
            alt={product.nombre}
            style={{ width: "100%", borderRadius: 14, marginBottom: 16, cursor: "zoom-in", aspectRatio: "4/3", objectFit: "cover" }}
            onClick={() => setLightbox({ src: productPhoto, alt: product.nombre })}
          />
        )}
        <h2 style={{ marginBottom: 4 }}>{product.nombre}</h2>
        {fmtPrice(product.precio) && <div className="product-price" style={{ fontSize: 18 }}>{fmtPrice(product.precio)}</div>}
        {product.descripcion && <p style={{ marginTop: 8, color: "var(--ink)" }}>{product.descripcion}</p>}

        <div className="ratings-placeholder">
          <span className="coming-soon-badge">Próximamente</span>
          <p>Aún sin calificaciones de clientes.</p>
        </div>

        {business && (
          <>
            <div className="section-divider">
              <h4>Vendido por</h4>
            </div>
            <div className="profile-header">
              {negocioPhoto ? (
                <img className="profile-avatar-photo" src={negocioPhoto} alt={business.nombreNegocio} />
              ) : (
                <div className="provider-avatar" style={{ width: 64, height: 64 }} />
              )}
              <div>
                <h3 style={{ marginBottom: 2 }}>{business.nombreNegocio}</h3>
                <p className="small-note" style={{ margin: 0 }}>
                  {business.categoria} · {business.ciudad}
                </p>
              </div>
            </div>
            {business.descripcion && <p style={{ marginTop: 10, fontSize: 13.5 }}>{business.descripcion}</p>}

            <a
              href={mapsUrl(business)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <PinIcon width="14" height="14" /> {business.direccion} — Ver en el mapa
            </a>

            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={whatsappUrl(business)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                onClick={trackClick}
              >
                Contactar
              </a>
              {business.instagramUrl && (
                <a
                  href={business.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  onClick={trackClick}
                >
                  Instagram
                </a>
              )}
              {business.facebookUrl && (
                <a
                  href={business.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  onClick={trackClick}
                >
                  Facebook
                </a>
              )}
            </div>
          </>
        )}
      </div>

      <ImageLightbox src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </div>
  );
}
