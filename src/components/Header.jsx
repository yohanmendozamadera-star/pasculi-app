const CLIENT_VIEWS = [
  "clientOptions",
  "browseProviders",
  "providerProfile",
  "topRated",
  "requestService",
  "registerClient",
];

const PROVIDER_VIEWS = ["providerOptions", "registerProvider", "providerDashboard"];

const LINKS = [
  { view: "home", label: "Inicio" },
  { view: "clientOptions", label: "Soy cliente" },
  { view: "providerOptions", label: "Soy proveedor" },
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
        {LINKS.map((l) => {
          let active = view === l.view;
          if (l.view === "clientOptions") active = CLIENT_VIEWS.includes(view);
          if (l.view === "providerOptions") active = PROVIDER_VIEWS.includes(view);
          return (
            <button key={l.view} className={active ? "active" : ""} onClick={() => onNavigate(l.view)}>
              {l.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
