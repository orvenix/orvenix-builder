"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

// Captura ?ref=CODE de la URL y lo persiste en cookie por 30 días
export function RefCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (!ref || !/^[A-Z0-9]{6,16}$/i.test(ref)) return
    // Solo setear si no hay uno ya guardado (first-touch attribution)
    if (document.cookie.includes("orvenix_ref=")) return
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `orvenix_ref=${ref.toUpperCase()}; expires=${expires}; path=/; SameSite=Lax`
  }, [searchParams])

  return null
}
