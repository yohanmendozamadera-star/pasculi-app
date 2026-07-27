import { HomeIcon, ClientIcon, ProviderIcon, ShieldIcon } from "./Icons.jsx";

const CLIENT_VIEWS = [
  "clientOptions",
  "browseProviders",
  "providerProfile",
  "topRated",
  "requestService",
  "registerClient",
];

const PROVIDER_VIEWS = ["providerOptions", "registerProvider", "providerDashboard"];

const TABS = [
  { view: "home", label: "Inicio", Icon: HomeIcon },
  { view: "clientOptions", label: "Cliente", Icon: ClientIcon },
  { view: "providerOptions", label: "Proveedor", Icon: ProviderIcon },
  { view: "admin", label: "Admin", Icon: ShieldIcon },
];

export default function BottomNav({ view, onNavigate }) {
  return (
    <nav className="nav-bottom">
      {TABS.map(({ view: v, label, Icon }) => {
        let active = view === v;
        if (v === "clientOptions") active = CLIENT_VIEWS.includes(view);
        if (v === "providerOptions") active = PROVIDER_VIEWS.includes(view);
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
