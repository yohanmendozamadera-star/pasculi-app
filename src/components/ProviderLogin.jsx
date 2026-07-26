import { useState } from "react";
import { ShieldIcon } from "./Icons.jsx";
import { supabase } from "../lib/supabaseClient.js";

export default function ProviderLogin({ onNavigate, toast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast("Correo o contraseña incorrectos.");
    }
  }

  return (
    <div className="login-box">
      <div className="icon-wrap">
        <ShieldIcon width="24" height="24" />
      </div>
      <h2 style={{ marginBottom: 6 }}>Mi perfil de proveedor</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 20 }}>
        Entra con el correo y la contraseña que usaste al registrarte.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo"
          style={{ textAlign: "center", marginBottom: 12 }}
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          style={{ textAlign: "center", marginBottom: 12 }}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="small-note" style={{ marginTop: 14 }}>
        ¿Aún no te has registrado?{" "}
        <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate("registerProvider")}>
          Regístrate como proveedor
        </button>
      </p>
    </div>
  );
}
