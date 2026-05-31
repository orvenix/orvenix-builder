"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeMode";
import { useCurrentSearch } from "@/hooks/useCurrentSearch";
import { consumePendingDesignDraft, readPendingDesignDraft } from "@/lib/pendingDesignClient";

const PERKS = [
  "Sin tarjeta de credito",
  "Editor visual completo",
  "9 plantillas incluidas",
  "Publicacion instantanea",
];

const REGISTER_FEATURES = [
  "Panel privado listo para clientes, sitios y publicaciones",
  "Flujo continuo desde plantilla hasta checkout interno",
  "Editor visual con IA y publicacion desde una sola plataforma",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"name" | "email" | "password" | null>(null);
  const currentSearch = useCurrentSearch();
  const loginHref = currentSearch ? `/login${currentSearch}` : "/login";

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Debil", "Buena", "Fuerte"][passwordStrength];
  const strengthBarClass = ["", "bg-rose-400", "bg-amber-400", "bg-emerald-400"][passwordStrength];
  const strengthTextClass = ["", "text-rose-300", "text-amber-300", "text-emerald-300"][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "No se pudo crear la cuenta.");
      return;
    }
    await signIn("credentials", { email, password, redirect: false });

    const nextRoute = await claimPendingDesignAfterRegister();
    router.push(nextRoute);
  };

  return (
    <main className="login-screen register-screen">
      <nav className="login-nav">
        <div className="login-nav-inner">
          <Link href="/" className="login-brand-link">
            <Image src="/img/logo-main.png" alt="Orvenix" width={200} height={64} className="logo-image" priority />
          </Link>
          <div className="login-nav-actions">
            <ThemeToggle />
            <Link href="/plataforma" className="login-link login-link-muted">
              Plataforma
            </Link>
            <Link href={loginHref} className="login-link login-link-strong">
              Iniciar sesion
            </Link>
          </div>
        </div>
      </nav>

      <section className="login-layout">
        <div className="login-copy editor-anim-fade-up">
          <div className="login-eyebrow">
            <Sparkles size={13} />
            Alta privada Orvenix
          </div>

          <h1 className="login-title">
            Activa tu espacio Orvenix y empieza con <span>claridad visual</span>.
          </h1>
          <p className="login-subtitle">
            Crea tu acceso privado para editar, publicar y continuar cualquier flujo de plantilla desde una experiencia consistente en tema claro y oscuro.
          </p>

          <div className="login-feature-list">
            {REGISTER_FEATURES.map((feature) => (
              <div key={feature} className="login-feature">
                <CheckCircle2 size={16} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="register-highlight-grid">
            <div className="register-highlight-card">
              <div className="register-highlight-icon">
                <Wand2 size={20} />
              </div>
              <div>
                <h3>Acceso inmediato</h3>
                <p>Crea la cuenta, entra al panel y continua el flujo sin saltos visuales.</p>
              </div>
            </div>
            <div className="register-highlight-card">
              <div className="register-highlight-icon register-highlight-icon-secure">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3>Base segura</h3>
                <p>Sesiones protegidas y separacion de datos desde el primer guardado.</p>
              </div>
            </div>
          </div>

          <div className="register-perks">
            {PERKS.map((perk) => (
              <div key={perk} className="register-perk">
                <span>
                  <Check size={11} />
                </span>
                {perk}
              </div>
            ))}
          </div>
        </div>

        <div className="login-panel-wrap editor-anim-scale-in">
          <div className="login-panel">
            <div className="login-panel-header">
              <Image src="/img/logo-main.png" alt="Orvenix" width={200} height={64} className="logo-image" priority />
              <div>
                <h2>Crear cuenta</h2>
                <p>Gratis para siempre y lista para usar.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field" data-active={focusedField === "name"}>
                <label>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField((current) => (current === "name" ? null : current))}
                  required
                  autoFocus
                  placeholder="Tu nombre"
                />
              </div>

              <div className="login-field" data-active={focusedField === "email"}>
                <label>
                  Correo electronico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField((current) => (current === "email" ? null : current))}
                  required
                  placeholder="tu@correo.com"
                />
              </div>

              <div className="login-field" data-active={focusedField === "password"}>
                <div className="login-field-row">
                  <label>
                    Contrasena
                  </label>
                  <span>Minimo 8 caracteres</span>
                </div>
                <div className="login-password-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField((current) => (current === "password" ? null : current))}
                    required
                    placeholder="Crea una contrasena segura"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="login-ghost-icon"
                    aria-label={showPass ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="register-strength editor-anim-fade-in">
                    <div className="register-strength-bars">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`register-strength-bar ${level <= passwordStrength ? strengthBarClass : ""}`}
                        />
                      ))}
                    </div>
                    <div className={`register-strength-label ${strengthTextClass || ""}`}>
                      Seguridad: {strengthLabel || "Pendiente"}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="login-submit"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                <span>{loading ? "Creando cuenta" : "Crear cuenta gratis"}</span>
              </button>

              <p className="register-terms">
                Al registrarte aceptas nuestros terminos de servicio y la politica de manejo de datos de la plataforma.
              </p>
            </form>

            <div className="login-secondary-actions">
              <Link href="/dashboard">
                <LayoutDashboard size={14} />
                Ver panel
              </Link>
              <Link href="/webs">
                <Wand2 size={14} />
                Ver demos
              </Link>
            </div>

            <div className="login-security-note">
              <ShieldCheck size={16} />
              Registro asistido, sincronizacion de diseno pendiente y acceso inmediato al espacio privado.
            </div>

            <p className="login-register-copy">
              Ya tienes cuenta?{" "}
              <Link href={loginHref}>
                Inicia sesion
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

async function claimPendingDesignAfterRegister() {
  if (typeof window === "undefined") return "/dashboard";

  const params = new URLSearchParams(window.location.search);
  const pendingDesignKey = params.get("pendingDesignKey");
  const callbackUrl = params.get("callbackUrl");
  const returnTo = params.get("returnTo");

  if (!pendingDesignKey) {
    if (callbackUrl?.startsWith("/")) return callbackUrl;
    return returnTo && returnTo !== "/editor/pending" ? returnTo : "/dashboard";
  }

  const draft = readPendingDesignDraft(pendingDesignKey);
  if (!draft) return "/dashboard";

  try {
    const response = await fetch("/api/editor/claim-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftKey: draft.key,
        action: draft.action,
        sourceSiteId: draft.sourceSiteId,
        tree: draft.tree,
      }),
    });

    const payload = (await response.json()) as {
      nextRoute?: string;
      redirectUrl?: string;
      error?: string;
    };

    if (!response.ok || (!payload.nextRoute && !payload.redirectUrl)) {
      throw new Error(payload.error ?? "No se pudo recuperar el diseno.");
    }

    consumePendingDesignDraft(pendingDesignKey, draft);
    return payload.redirectUrl ?? payload.nextRoute ?? "/dashboard";
  } catch {
    return "/dashboard";
  }
}
