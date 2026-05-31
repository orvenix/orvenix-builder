"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, XCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme/ThemeMode"

type TokenState = "validating" | "valid" | "invalid"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [tokenState, setTokenState] = useState<TokenState>("validating")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      const timer = window.setTimeout(() => setTokenState("invalid"), 0)
      return () => window.clearTimeout(timer)
    }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then((data: { valid: boolean }) => setTokenState(data.valid ? "valid" : "invalid"))
      .catch(() => setTokenState("invalid"))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar la contraseña.")
      } else {
        setDone(true)
        setTimeout(() => router.push("/login"), 3000)
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
            <Link href="/login" className="login-link login-link-strong">Iniciar sesión</Link>
          </div>
        </div>
      </nav>

      <section className="login-layout">
        <div className="login-copy editor-anim-fade-up">
          <div className="login-eyebrow">
            <Lock size={13} />
            Nueva contraseña
          </div>
          <h1 className="login-title">
            Crea una contraseña <span>segura y nueva</span> para tu cuenta.
          </h1>
          <p className="login-subtitle">
            Elige una contraseña que no hayas usado antes. Debe tener al menos 8 caracteres.
          </p>
        </div>

        <div className="login-panel-wrap editor-anim-scale-in">
          <div className="login-panel">
            <div className="login-panel-header">
              <Image src="/img/logo-main.png" alt="Orvenix" width={200} height={64} className="logo-image" priority />
              <div>
                <h2>Restablecer contraseña</h2>
                <p>Ingresa tu nueva contraseña.</p>
              </div>
            </div>

            {/* Validating */}
            {tokenState === "validating" && (
              <div className="login-form" style={{ textAlign: "center", padding: "32px 0" }}>
                <Loader2 size={32} className="animate-spin" style={{ color: "#3b82f6", margin: "0 auto" }} />
                <p style={{ color: "#6b7280", marginTop: "16px", fontSize: "14px" }}>Verificando enlace...</p>
              </div>
            )}

            {/* Token inválido */}
            {tokenState === "invalid" && (
              <div className="login-form" style={{ textAlign: "center", padding: "20px 0" }}>
                <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 16px", display: "block" }} />
                <p style={{ fontSize: "15px", color: "#9ca3af", margin: "0 0 20px", lineHeight: 1.6 }}>
                  Este enlace no es válido o ya expiró. Los enlaces de recuperación son válidos por 30 minutos y un solo uso.
                </p>
                <Link href="/forgot-password" className="login-submit" style={{ display: "flex", justifyContent: "center", textDecoration: "none" }}>
                  <ArrowRight size={17} />
                  <span>Solicitar nuevo enlace</span>
                </Link>
              </div>
            )}

            {/* Formulario */}
            {tokenState === "valid" && !done && (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-field">
                  <label>Nueva contraseña</label>
                  <div className="login-password-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      autoFocus
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="login-ghost-icon" aria-label="Toggle contraseña">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label>Confirmar contraseña</label>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="Repite tu contraseña"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <Lock size={17} />}
                  <span>{loading ? "Guardando..." : "Guardar nueva contraseña"}</span>
                </button>
              </form>
            )}

            {/* Éxito */}
            {done && (
              <div className="login-form" style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={48} style={{ color: "#10b981", margin: "0 auto 16px", display: "block" }} />
                <p style={{ fontSize: "15px", color: "#9ca3af", margin: "0 0 4px", lineHeight: 1.6 }}>
                  ¡Contraseña actualizada! Redirigiendo al login...
                </p>
                <p style={{ fontSize: "12px", color: "#4b5563" }}>Serás redirigido automáticamente en 3 segundos.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
