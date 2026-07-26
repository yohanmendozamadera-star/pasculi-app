import { HomeIcon, ClientIcon, ProviderIcon, ShieldIcon } from "./Icons.jsx";

const CLIENT_VIEWS = [
  "clientOptions",
  "browseProviders",
  "providerProfile",
  "topRated",
  "requestService",
  "registerClient",
];

const TABS = [
  { view: "home", label: "Inicio", Icon: HomeIcon },
  { view: "clientOptions", label: "Cliente", Icon: ClientIcon },
  { view: "registerProvider", label: "Proveedor", Icon: ProviderIcon },
  { view: "admin", label: "Admin", Icon: ShieldIcon },
];

export default function BottomNav({ view, onNavigate }) {
  return (
    <nav className="nav-bottom">
      {TABS.map(({ view: v, label, Icon }) => {
        const active = v === "clientOptions" ? CLIENT_VIEWS.includes(view) : view === v;
        return (
          <button key={v} className={active ? "active" : ""} onClick={() => onNavigate(v)}>
            <Icon width="20" height="20" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
