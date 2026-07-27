import { useState, useEffect } from "react";

function PrivacyPolicyModal({ onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h3 style={{ marginBottom: 14 }}>Política de privacidad de Pasculi</h3>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>
          <p style={{ marginBottom: 10 }}>
            <strong>Lo que nunca se hace público:</strong> tu documento de identidad, tu selfie de
            verificación, tu dirección exacta y tu ubicación GPS solo los ve el equipo de Pasculi,
            únicamente para confirmar tu identidad. Nadie más tiene acceso a esas fotos.
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Lo que sí es público (si te registras como proveedor y quedas aprobado):</strong>{" "}
            tu nombre, ciudad, categoría, especialidades, tu foto de perfil, las fotos de trabajos que
            elijas subir y tu video de YouTube (si lo agregas). Esto es necesario para que los clientes
            puedan encontrarte y decidir contactarte.
          </p>
          <p>
            No compartimos tus datos con terceros ajenos a Pasculi. Puedes escribirnos en cualquier
            momento para pedir que se elimine tu información.
          </p>
        </div>
        <button className="btn-primary" style={{ width: "100%", marginTop: 18 }} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function PolicyCheckbox({ checked, onChange, error }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={`field-group ${error ? "has-error" : ""}`}>
      <label className="policy-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>
          Leí y acepto la{" "}
          <button type="button" className="btn-ghost" style={{ padding: 0 }} onClick={() => setShowModal(true)}>
            política de privacidad
          </button>{" "}
          de Pasculi.
        </span>
      </label>
      <span className="err-msg">Debes aceptar la política de privacidad para continuar.</span>
      {showModal && <PrivacyPolicyModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
