import { useState } from "react";
import { CIUDADES } from "../../data/categories.js";
import { fmtDate } from "../../lib/image.js";
import {
  updateProviderStatus,
  getProviderPhotoUrls,
  addCategory as addCategoryApi,
  deleteCategory as deleteCategoryApi,
  setCategorySpecialties,
} from "../../lib/storage.js";
import ProviderModal from "./ProviderModal.jsx";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "proveedores", label: "Proveedores" },
  { key: "clientes", label: "Clientes" },
  { key: "categorias", label: "Categorías" },
];

export default function AdminPanel({
  providers,
  setProviders,
  clients,
  categories,
  setCategories,
  toast,
  onLogout,
}) {
  const [tab, setTab] = useState("dashboard");

  return (
    <>
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
        <button className="row-btn" style={{ marginLeft: "auto" }} onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
      {tab === "dashboard" && <Dashboard providers={providers} clients={clients} />}
      {tab === "proveedores" && (
        <ProvidersTab
          providers={providers}
          setProviders={setProviders}
          categories={categories}
          toast={toast}
        />
      )}
      {tab === "clientes" && <ClientsTab clients={clients} />}
      {tab === "categorias" && (
        <CategoriesTab categories={categories} setCategories={setCategories} toast={toast} />
      )}
    </>
  );
}

function Dashboard({ providers, clients }) {
  const total = providers.length;
  const aprobados = providers.filter((p) => p.estado === "aprobado").length;
  const pendientes = providers.filter((p) => p.estado === "pendiente").length;
  const porCiudad = CIUDADES.map((c) => ({ c, n: providers.filter((p) => p.ciudad === c).length }));

  return (
    <>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{total}</div>
          <div className="stat-label">Proveedores registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{aprobados}</div>
          <div className="stat-label">Proveedores aprobados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{pendientes}</div>
          <div className="stat-label">Pendientes por revisar</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{clients.length}</div>
          <div className="stat-label">Clientes registrados</div>
        </div>
      </div>
      <h3 className="section-title">Proveedores por ciudad</h3>
      <div className="stats-row" style={{ gridTemplateColumns: "repeat(2,1fr)", marginBottom: 10 }}>
        {porCiudad.map((x) => (
          <div className="stat-card" key={x.c}>
            <div className="stat-num">{x.n}</div>
            <div className="stat-label">{x.c}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProvidersTab({ providers, setProviders, categories, toast }) {
  const [filters, setFilters] = useState({ ciudad: "", categoria: "", estado: "", q: "" });
  const [modalProvider, setModalProvider] = useState(null);
  const [modalPhotos, setModalPhotos] = useState(null);

  async function updateStatus(id, estado) {
    const ok = await updateProviderStatus(id, estado);
    if (ok) {
      setProviders((list) => list.map((p) => (p.id === id ? { ...p, estado } : p)));
      toast(estado === "aprobado" ? "Proveedor aprobado." : "Proveedor rechazado.");
      setModalProvider(null);
    } else {
      toast("No se pudo actualizar el estado.");
    }
  }

  async function openDetail(p) {
    setModalProvider(p);
    setModalPhotos(null);
    const photos = await getProviderPhotoUrls(p);
    setModalPhotos(photos);
  }

  let list = [...providers].sort((a, b) => b.timestamp - a.timestamp);
  if (filters.ciudad) list = list.filter((p) => p.ciudad === filters.ciudad);
  if (filters.categoria) list = list.filter((p) => p.categoria === filters.categoria);
  if (filters.estado) list = list.filter((p) => p.estado === filters.estado);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.nombreCompleto.toLowerCase().includes(q) ||
        p.celular.includes(q) ||
        p.identificacion.includes(q)
    );
  }

  return (
    <>
      <div className="filter-bar">
        <select value={filters.ciudad} onChange={(e) => setFilters((f) => ({ ...f, ciudad: e.target.value }))}>
          <option value="">Todas las ciudades</option>
          {CIUDADES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.categoria}
          onChange={(e) => setFilters((f) => ({ ...f, categoria: e.target.value }))}
        >
          <option value="">Todas las categorías</option>
          {Object.keys(categories).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filters.estado} onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre, celular o cédula"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <h3>No hay proveedores con estos filtros</h3>
          <p>Ajusta los filtros o espera nuevos registros.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Celular</th>
                <th>Ciudad</th>
                <th>Categoría</th>
                <th>Vistas</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombreCompleto}</td>
                  <td>{p.celular}</td>
                  <td>{p.ciudad}</td>
                  <td>
                    <span className="badge badge-cat">{p.categoria}</span>
                  </td>
                  <td>{p.profileViews ?? 0}</td>
                  <td>
                    <span className={`status-pill status-${p.estado}`}>{p.estado.toUpperCase()}</span>
                  </td>
                  <td>{fmtDate(p.timestamp)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="row-btn" onClick={() => openDetail(p)}>
                      Ver
                    </button>
                    {p.estado !== "aprobado" && (
                      <button className="row-btn approve" onClick={() => updateStatus(p.id, "aprobado")}>
                        Aprobar
                      </button>
                    )}
                    {p.estado !== "rechazado" && (
                      <button className="row-btn reject" onClick={() => updateStatus(p.id, "rechazado")}>
                        Rechazar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProviderModal
        provider={modalProvider}
        photos={modalPhotos}
        onClose={() => setModalProvider(null)}
        onApprove={(id) => updateStatus(id, "aprobado")}
        onReject={(id) => updateStatus(id, "rechazado")}
      />
    </>
  );
}

function ClientsTab({ clients }) {
  const [filters, setFilters] = useState({ ciudad: "", q: "" });

  let list = [...clients].sort((a, b) => b.timestamp - a.timestamp);
  if (filters.ciudad) list = list.filter((c) => c.ciudad === filters.ciudad);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((c) => c.nombreCompleto.toLowerCase().includes(q) || c.celular.includes(q));
  }

  return (
    <>
      <div className="filter-bar">
        <select value={filters.ciudad} onChange={(e) => setFilters((f) => ({ ...f, ciudad: e.target.value }))}>
          <option value="">Todas las ciudades</option>
          {CIUDADES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar por nombre o celular"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
      </div>
      {list.length === 0 ? (
        <div className="empty-state">
          <h3>Aún no hay clientes registrados</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Celular</th>
                <th>Correo</th>
                <th>Ciudad</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombreCompleto}</td>
                  <td>{c.celular}</td>
                  <td>{c.correo}</td>
                  <td>{c.ciudad}</td>
                  <td>{fmtDate(c.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CategoriesTab({ categories, setCategories, toast }) {
  const [newCat, setNewCat] = useState("");
  const [specCat, setSpecCat] = useState(Object.keys(categories)[0] || "");
  const [newSpec, setNewSpec] = useState("");

  async function addCategory(e) {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    if (categories[name]) {
      toast("Esa categoría ya existe.");
      return;
    }
    const ok = await addCategoryApi(name);
    if (ok) {
      setCategories((c) => ({ ...c, [name]: [] }));
      setNewCat("");
      toast("Categoría agregada.");
    } else {
      toast("No se pudo agregar la categoría.");
    }
  }

  async function addSpecialty(e) {
    e.preventDefault();
    const name = newSpec.trim();
    if (!specCat || !name) return;
    if ((categories[specCat] || []).includes(name)) {
      toast("Esa especialidad ya existe en la categoría.");
      return;
    }
    const nextSpecs = [...(categories[specCat] || []), name];
    const ok = await setCategorySpecialties(specCat, nextSpecs);
    if (ok) {
      setCategories((c) => ({ ...c, [specCat]: nextSpecs }));
      setNewSpec("");
      toast("Especialidad agregada.");
    } else {
      toast("No se pudo agregar la especialidad.");
    }
  }

  async function deleteCategory(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat}" y todas sus especialidades?`)) return;
    const ok = await deleteCategoryApi(cat);
    if (ok) {
      setCategories((c) => {
        const next = { ...c };
        delete next[cat];
        return next;
      });
      toast("Categoría eliminada.");
    } else {
      toast("No se pudo eliminar la categoría.");
    }
  }

  async function deleteSpecialty(cat, name) {
    const nextSpecs = (categories[cat] || []).filter((s) => s !== name);
    const ok = await setCategorySpecialties(cat, nextSpecs);
    if (ok) {
      setCategories((c) => ({ ...c, [cat]: nextSpecs }));
      toast("Especialidad eliminada.");
    } else {
      toast("No se pudo eliminar la especialidad.");
    }
  }

  return (
    <>
      <div className="form-card">
        <h3 style={{ marginBottom: 14 }}>Agregar categoría</h3>
        <form onSubmit={addCategory} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Nombre de la nueva categoría"
            style={{ flex: 1, minWidth: 200 }}
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button type="submit" className="btn-secondary" style={{ flexShrink: 0 }}>
            Agregar categoría
          </button>
        </form>
      </div>

      <div className="form-card">
        <h3 style={{ marginBottom: 14 }}>Agregar especialidad</h3>
        <form onSubmit={addSpecialty} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            style={{ flex: 1, minWidth: 180 }}
            value={specCat}
            onChange={(e) => setSpecCat(e.target.value)}
          >
            {Object.keys(categories).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nombre de la especialidad"
            style={{ flex: 1, minWidth: 200 }}
            value={newSpec}
            onChange={(e) => setNewSpec(e.target.value)}
          />
          <button type="submit" className="btn-secondary" style={{ flexShrink: 0 }}>
            Agregar especialidad
          </button>
        </form>
      </div>

      {Object.entries(categories).map(([cat, specs]) => (
        <div className="form-card" key={cat}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ fontSize: 16 }}>{cat}</h3>
            <button className="btn-ghost" onClick={() => deleteCategory(cat)}>
              Eliminar categoría
            </button>
          </div>
          <div className="chip-select">
            {specs.length === 0 ? (
              <span className="small-note">Sin especialidades todavía.</span>
            ) : (
              specs.map((sp) => (
                <span
                  key={sp}
                  className="chip-option checked"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  {sp}
                  <button
                    onClick={() => deleteSpecialty(cat, sp)}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13 }}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </>
  );
}
