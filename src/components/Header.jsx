const CLIENT_VIEWS = ["clientOptions", "browseProviders", "topRated", "requestService", "registerClient"];

const LINKS = [
  { view: "home", label: "Inicio" },
  { view: "clientOptions", label: "Soy cliente" },
  { view: "registerProvider", label: "Registro proveedor" },
  { view: "admin", label: "Administrador" },
];

export default function Header({ view, onNavigate }) {
  return (
    <div className="topbar">
      <button className="logo" onClick={() => onNavigate("home")}>
        <div className="logo-mark">P</div>
        <span className="logo-word">Pasculi</span>
      </button>
      <nav className="nav-desktop">
        {LINKS.map((l) => (
          <button
            key={l.view}
            className={
              l.view === "clientOptions" ? (CLIENT_VIEWS.includes(view) ? "active" : "") : view === l.view ? "active" : ""
            }
            onClick={() => onNavigate(l.view)}
          >
            {l.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
