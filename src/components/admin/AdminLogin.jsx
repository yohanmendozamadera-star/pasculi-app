import { useState } from "react";
import { ShieldIcon } from "../Icons.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import PasswordInput from "../PasswordInput.jsx";

export default function AdminLogin({ toast }) {
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
      <h2 style={{ marginBottom: 6 }}>Panel del administrador</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 20 }}>
        Acceso restringido. Ingresa con tu cuenta de administrador.
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
        <div style={{ marginBottom: 12 }}>
          <PasswordInput
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar al panel"}
        </button>
      </form>
    </div>
  );
}
