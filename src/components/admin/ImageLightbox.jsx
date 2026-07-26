import { useEffect, useState } from "react";

export default function ImageLightbox({ src, alt, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!src) return;
    setZoomed(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [src]);

  if (!src) return null;

  return (
    <div className="lightbox-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="modal-close lightbox-close" onClick={onClose}>
        ✕
      </button>
      <div className={`lightbox-scroll ${zoomed ? "zoomed" : ""}`}>
        <img
          src={src}
          alt={alt}
          className={`lightbox-img ${zoomed ? "zoomed" : ""}`}
          onClick={() => setZoomed((z) => !z)}
        />
      </div>
      <div className="lightbox-hint">{zoomed ? "Toca la foto para alejar" : "Toca la foto para ampliar"}</div>
    </div>
  );
}
