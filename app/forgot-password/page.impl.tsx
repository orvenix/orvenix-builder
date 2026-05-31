"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react"
import { ThemeToggle } from "@/components/theme/ThemeMode"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Error al procesar la solicitud.")
      } else {
        setDone(true)
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <nav className="login-nav">
        <div className="login-nav-inner">
          <Link href="/" className="login-brand-link">
            <Image src="/img/logo-main.png" alt="Orvenix" width={200} height={64} className="logo-image" priority />
          </Link>
          <div className="login-nav-actions">
            <ThemeToggle />
            <Link href="/login" className="login-link login-link-muted">Iniciar sesión</Link>
            <Link href="/register" className="login-link login-link-strong">Crear cuenta</Link>
          </div>
        </div>
      </nav>

      <section className="login-layout">
        <div className="login-copy editor-anim-fade-up">
          <div className="login-eyebrow">
            <Mail size={13} />
            Recuperar acceso
          </div>
          <h1 className="login-title">
            Te enviamos un enlace para <span>restablecer tu contraseña</span>.
          </h1>
          <p className="login-subtitle">
            Ingresa el correo asociado a tu cuenta. Si existe en nuestra plataforma, recibirás un enlace de acceso válido por 30 minutos.
          </p>
        </div>

        <div className="login-panel-wrap editor-anim-scale-in">
          <div className="login-panel">
            <div className="login-panel-header">
              <Image src="/img/logo-main.png" alt="Orvenix" width={200} height={64} className="logo-image" priority />
              <div>
                <h2>Recuperar contraseña</h2>
                <p>Te enviamos el enlace por correo.</p>
              </div>
            </div>

            {done ? (
              <div className="login-form">
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <CheckCircle2 size={48} style={{ color: "#10b981", margin: "0 auto 16px", display: "block" }} />
                  <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text-secondary, #9ca3af)", margin: "0 0 20px" }}>
                    Si ese correo está registrado, recibirás el enlace en unos minutos. Revisa también tu carpeta de spam.
                  </p>
                  <Link href="/login" className="login-submit" style={{ display: "flex", justifyContent: "center", textDecoration: "none" }}>
                    <ArrowRight size={17} />
                    <span>Volver al login</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                  <span>{loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}</span>
                </button>

                <div className="login-secondary-actions" style={{ marginTop: "16px" }}>
                  <Link href="/login">← Volver al login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
