import Link from "next/link"
import type { ProviderAttribution } from "@/lib/orvenix-ai/assets/attribution"

export type SiteOwnership = "rented" | "purchased" | "unknown"

/**
 * Determina el tipo de propiedad del sitio a partir del campo `description`.
 * Formatos almacenados:
 *   paid:buy:{paymentId}:{timestamp}   → comprado
 *   paid:rent:{paymentId}:{timestamp}  → rentado
 *   checkout_pending:buy:...           → pago pendiente (compra)
 *   checkout_pending:rent:...          → pago pendiente (renta)
 *   Cualquier otro                     → desconocido
 */
export function parseSiteOwnership(description: string | null | undefined): SiteOwnership {
  if (!description) return "unknown"
  if (description.startsWith("paid:buy:") || description.includes(":buy:")) return "purchased"
  if (description.startsWith("paid:rent:") || description.includes(":rent:")) return "rented"
  return "unknown"
}

interface SiteCopyrightBarProps {
  siteName: string
  ownership: SiteOwnership
  /** Provider credits this specific page's tree actually needs -- see resolveTreeAttributions. Omitted/empty renders nothing extra. */
  attributions?: ProviderAttribution[]
}

/** Small inline addition to the existing bar, never a second footer element -- renders nothing when there is nothing to credit. */
function AttributionCredits({ attributions }: { attributions?: ProviderAttribution[] }) {
  if (!attributions?.length) return null

  return (
    <>
      {" "}
      ·{" "}
      {attributions.map((attribution, index) => (
        <span key={attribution.provider}>
          {index > 0 ? ", " : ""}
          <Link
            href={attribution.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-current opacity-80 hover:opacity-100 transition-opacity"
          >
            {attribution.label}
          </Link>
        </span>
      ))}
    </>
  )
}

/**
 * Barra de copyright inyectada al final de cada sitio publicado.
 *
 * Renta   → "Sitio profesional por Orvenix" (el cliente usa la plataforma mensualmente)
 * Compra  → "© 2025 {siteName} · Todos los derechos reservados" (el cliente es dueño)
 * Unknown → "Potenciado por Orvenix" (estado indeterminado — demo o sin pago)
 */
export function SiteCopyrightBar({ siteName, ownership, attributions }: SiteCopyrightBarProps) {
  const year = new Date().getFullYear()

  if (ownership === "purchased") {
    return (
      <footer
        className="w-full border-t border-black/10 bg-white py-3 px-4 text-center text-[11px] text-gray-400"
        aria-label="Copyright"
      >
        © {year} {siteName} · Todos los derechos reservados
        <AttributionCredits attributions={attributions} />
      </footer>
    )
  }

  if (ownership === "rented") {
    return (
      <footer
        className="w-full border-t border-white/[0.06] bg-[#040408] py-3 px-4 text-center text-[11px] text-white/20"
        aria-label="Powered by"
      >
        Sitio profesional por{" "}
        <Link
          href="https://orvenix.com.mx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/35 hover:text-white/60 font-semibold transition-colors"
        >
          Orvenix
        </Link>
        {" "}· © {year}
        <AttributionCredits attributions={attributions} />
      </footer>
    )
  }

  // Estado unknown — en demo o sin pago confirmado
  return (
    <footer
      className="w-full border-t border-white/[0.06] bg-[#040408] py-3 px-4 text-center text-[11px] text-white/20"
      aria-label="Powered by"
    >
      Potenciado por{" "}
      <Link
        href="https://orvenix.com.mx"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/35 hover:text-white/60 font-semibold transition-colors"
      >
        Orvenix
      </Link>
      <AttributionCredits attributions={attributions} />
    </footer>
  )
}
