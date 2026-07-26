import { useEffect, useState, useCallback, useRef } from "react";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Home from "./components/Home.jsx";
import ClientOptions from "./components/ClientOptions.jsx";
import BrowseProviders from "./components/BrowseProviders.jsx";
import ComingSoon from "./components/ComingSoon.jsx";
import RegisterClient from "./components/RegisterClient.jsx";
import RegisterProvider from "./components/RegisterProvider.jsx";
import ProviderSuccess from "./components/ProviderSuccess.jsx";
import AdminLogin from "./components/admin/AdminLogin.jsx";
import AdminPanel from "./components/admin/AdminPanel.jsx";
import { StarIcon, ClipboardIcon } from "./components/Icons.jsx";
import { getProviders, getClients, getCategories } from "./lib/storage.js";
import { supabase } from "./lib/supabaseClient.js";

// En celular, abrir la cámara (para la selfie o la foto de cédula) puede
// hacer que el navegador recargue la página al volver (por falta de
// memoria). Guardamos en qué pantalla estabas para no mandarte al inicio.
function initialView() {
  try {
    return sessionStorage.getItem("pasculi:view") || "home";
  } catch {
    return "home";
  }
}

export default function App() {
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState({});
  const [session, setSession] = useState(null);
  const [lastProvider, setLastProvider] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const [p, c, cat] = await Promise.all([getProviders(), getClients(), getCategories()]);
      setProviders(p);
      setClients(c);
      setCategories(cat);
      setLoading(false);
    })();

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => subscription.unsubscribe();
  }, []);

  // Las sesiones anónimas (las que usan los proveedores solo para subir sus
  // fotos) NO son admin: is_anonymous distingue una de otra. Solo cuando
  // entra el admin real recargamos proveedores/clientes completos (RLS lo
  // permite); hasta entonces solo se cargaron los proveedores aprobados.
  const isAdmin = !!session && !session.user.is_anonymous;

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [p, c] = await Promise.all([getProviders(), getClients()]);
      setProviders(p);
      setClients(c);
    })();
  }, [isAdmin]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  function navigate(next) {
    setView(next);
    try {
      sessionStorage.setItem("pasculi:view", next);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Si la página se recargó justo en la pantalla de éxito, lastProvider ya
  // no existe en memoria: no tiene caso mostrarla, volvemos al inicio.
  useEffect(() => {
    if (view === "providerSuccess" && !lastProvider) {
      navigate("home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, lastProvider]);

  if (loading) {
    return (
      <>
        <Header view={view} onNavigate={navigate} />
        <main className="wrap">
          <div className="empty-state">Cargando Pasculi…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header view={view} onNavigate={navigate} />
      <main className="wrap">
        {view === "home" && <Home providers={providers} categories={categories} onNavigate={navigate} />}

        {view === "clientOptions" && <ClientOptions onNavigate={navigate} />}

        {view === "browseProviders" && (
          <BrowseProviders providers={providers} categories={categories} onNavigate={navigate} />
        )}

        {view === "topRated" && (
          <ComingSoon
            icon={StarIcon}
            iconTone="mango"
            title="Mejor calificados"
            description="Muy pronto podrás ver a los proveedores con mejor puntuación de otros clientes, con reseñas y calificación de 1 a 5 estrellas."
            onNavigate={navigate}
          />
        )}

        {view === "requestService" && (
          <ComingSoon
            icon={ClipboardIcon}
            iconTone="coral"
            title="Solicitar un servicio"
            description="Muy pronto podrás publicar exactamente lo que necesitas para que los proveedores interesados te contacten directamente."
            onNavigate={navigate}
          />
        )}

        {view === "registerClient" && (
          <RegisterClient setClients={setClients} onNavigate={navigate} toast={toast} />
        )}

        {view === "registerProvider" && (
          <RegisterProvider
            setProviders={setProviders}
            categories={categories}
            onNavigate={navigate}
            toast={toast}
            setLastProvider={setLastProvider}
          />
        )}

        {view === "providerSuccess" && <ProviderSuccess provider={lastProvider} onNavigate={navigate} />}

        {view === "admin" &&
          (isAdmin ? (
            <AdminPanel
              providers={providers}
              setProviders={setProviders}
              clients={clients}
              categories={categories}
              setCategories={setCategories}
              toast={toast}
              onLogout={() => supabase.auth.signOut()}
            />
          ) : (
            <AdminLogin toast={toast} />
          ))}
      </main>
      <BottomNav view={view} onNavigate={navigate} />
      <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
    </>
  );
}
