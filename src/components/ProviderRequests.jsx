import { useEffect, useState } from "react";
import { getMyServiceRequests, updateServiceRequestStatus } from "../lib/storage.js";
import { fmtDate } from "../lib/image.js";

const ESTADO_LABEL = {
  pendiente: "Nueva",
  aceptado: "En curso",
  completado: "Completada",
  rechazado: "Rechazada",
  cancelado: "Cancelada",
};

function RequestCard({ req, children }) {
  return (
    <div className="request-card">
      <div className="request-top">
        <strong>{req.clienteNombre}</strong>
        <span className={`status-pill status-request-${req.estado}`}>{ESTADO_LABEL[req.estado]}</span>
      </div>
      <p className="small-note" style={{ margin: "4px 0" }}>
        {req.clienteCelular} · {req.clienteCorreo}
      </p>
      {req.mensaje && <p style={{ fontSize: 13.5, marginTop: 6 }}>{req.mensaje}</p>}
      <p className="small-note" style={{ marginTop: 6 }}>
        {fmtDate(req.timestamp)}
      </p>
      {children && <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{children}</div>}
    </div>
  );
}

export default function ProviderRequests({ providerId, toast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setRequests(await getMyServiceRequests(providerId));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  async function setStatus(id, estado) {
    setBusyId(id);
    const ok = await updateServiceRequestStatus(id, estado);
    setBusyId(null);
    if (ok) {
      toast("Solicitud actualizada.");
      load();
    } else {
      toast("No se pudo actualizar la solicitud.");
    }
  }

  if (loading) return <div className="empty-state">Cargando solicitudes…</div>;

  const nuevas = requests.filter((r) => r.estado === "pendiente");
  const enCurso = requests.filter((r) => r.estado === "aceptado");
  const historial = requests.filter((r) => ["completado", "rechazado", "cancelado"].includes(r.estado));

  return (
    <div>
      <h3 className="section-title" style={{ fontSize: 15 }}>
        Nuevas solicitudes
      </h3>
      {nuevas.length === 0 ? (
        <p className="small-note" style={{ marginBottom: 18 }}>
          No tienes solicitudes nuevas por ahora.
        </p>
      ) : (
        <div className="request-list" style={{ marginBottom: 18 }}>
          {nuevas.map((r) => (
            <RequestCard req={r} key={r.id}>
              <button
                className="row-btn approve"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "aceptado")}
              >
                Aceptar
              </button>
              <button
                className="row-btn reject"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "rechazado")}
              >
                Rechazar
              </button>
            </RequestCard>
          ))}
        </div>
      )}

      <h3 className="section-title" style={{ fontSize: 15 }}>
        En curso
      </h3>
      {enCurso.length === 0 ? (
        <p className="small-note" style={{ marginBottom: 18 }}>
          No tienes solicitudes en curso.
        </p>
      ) : (
        <div className="request-list" style={{ marginBottom: 18 }}>
          {enCurso.map((r) => (
            <RequestCard req={r} key={r.id}>
              <button
                className="row-btn approve"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "completado")}
              >
                Marcar completada
              </button>
              <button
                className="row-btn reject"
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "cancelado")}
              >
                Cancelar
              </button>
            </RequestCard>
          ))}
        </div>
      )}

      <h3 className="section-title" style={{ fontSize: 15 }}>
        Historial
      </h3>
      {historial.length === 0 ? (
        <p className="small-note">Aún no tienes solicitudes cerradas.</p>
      ) : (
        <div className="request-list">
          {historial.map((r) => (
            <RequestCard req={r} key={r.id} />
          ))}
        </div>
      )}
    </div>
  );
}
