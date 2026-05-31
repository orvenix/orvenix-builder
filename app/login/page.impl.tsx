"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeMode";
import { useCurrentSearch } from "@/hooks/useCurrentSearch";
import { consumePendingDesignDraft, readPendingDesignDraft } from "@/lib/pendingDesignClient";

const FEATURES = [
  "Templates inteligentes con flujo de editar, comprar o rentar",
  "Panel privado con sitios, publicaciones y clientes",
  "Editor visual, IA y despliegue en un solo entorno",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const currentSearch = useCurrentSearch();
  const registerHref = currentSearch ? `/register${currentSearch}` : "/register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Correo o contraseña incorrectos.");
    } else {
      const nextRoute = await resolvePostLoginRedirect();
      router.push(nextRoute);
    }
  };

  return (
    <main className="login-screen">
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
            <Link href={registerHref} className="login-link login-link-strong">
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <section className="login-layout">
        <div className="login-copy editor-anim-fade-up">
          <div className="login-eyebrow">
            <Sparkles size={13} />
            Acceso privado Orvenix
          </div>

          <h1 className="login-title">
            Tu centro de mando digital, con la <span>estética Orvenix</span> intacta.
          </h1>
          <p className="login-subtitle">
            Entra a un entorno privado diseñado para moverte con calma y precisión: edita sitios, continúa flujos de plantillas y administra publicaciones desde una experiencia visual pulida en claro y oscuro.
          </p>

          <div className="login-feature-list">
            {FEATURES.map((feature) => (
              <div key={feature} className="login-feature">
                <CheckCircle2 size={16} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="login-metrics" aria-label="Resumen de plataforma">
            {[
              ["9", "templates"],
              ["3", "flujos"],
              ["1", "sistema"],
            ].map(([value, label]) => (
              <div key={label} className="login-metric">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-panel-wrap editor-anim-scale-in">
          <div className="login-panel">
            <div className="login-panel-header">
              <Image src="/img/logo-main.png" alt="Orvenix" width={200} height={64} className="logo-image" priority />
              <div>
                <h2>Iniciar sesión</h2>
                <p>Entra a tu espacio privado.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field" data-active={focusedField === "email"}>
                <label>
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField((current) => (current === "email" ? null : current))}
                  required
                  autoFocus
                  placeholder="tu@empresa.com"
                />
              </div>

              <div className="login-field" data-active={focusedField === "password"}>
                <div className="login-field-row">
                  <label>
                    Contraseña
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: "12px", color: "var(--text-muted, #6b7280)", textDecoration: "none" }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="login-password-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField((current) => (current === "password" ? null : current))}
                    required
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="login-ghost-icon"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
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
                <span>{loading ? "Validando acceso" : "Entrar al panel"}</span>
              </button>
            </form>

            <div className="login-secondary-actions">
              <Link href="/webs">
                <Globe2 size={14} />
                Ver demos
              </Link>
              <Link href="/plataforma">
                <LayoutDashboard size={14} />
                Plataforma
              </Link>
            </div>

            <div className="login-security-note">
              <ShieldCheck size={16} />
              Sesiones protegidas, datos separados por usuario y guardado persistente.
            </div>

            <p className="login-register-copy">
              ¿No tienes cuenta?{" "}
              <Link href={registerHref}>
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

async function resolvePostLoginRedirect() {
  if (typeof window === "undefined") return "/dashboard";

  const params = new URLSearchParams(window.location.search);
  const pendingDesignKey = params.get("pendingDesignKey");
  const callbackUrl = params.get("callbackUrl");
  const returnTo = params.get("returnTo");

  if (pendingDesignKey) {
    const draft = readPendingDesignDraft(pendingDesignKey);
    if (draft) {
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
        const payload = (await response.json()) as { nextRoute?: string; redirectUrl?: string };
        if (response.ok && (payload.redirectUrl || payload.nextRoute)) {
          consumePendingDesignDraft(pendingDesignKey, draft);
          return payload.redirectUrl ?? payload.nextRoute ?? "/dashboard";
        }
      } catch {
        return "/dashboard";
      }
    }
  }

  if (callbackUrl?.startsWith("/")) return callbackUrl;
  if (returnTo?.startsWith("/") && returnTo !== "/editor/pending") return returnTo;
  return "/dashboard";
}
