import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components"

interface DifmUpdatedEmailProps {
  userName: string
  ticketId: string
  siteName: string
  newStatus: "in_progress" | "done" | "cancelled"
  dashboardUrl: string
}

const statusConfig = {
  in_progress: {
    label: "En progreso",
    emoji: "🔧",
    color: "#f59e0b",
    message: "Nuestro equipo ya está trabajando en los ajustes que solicitaste. Te avisaremos cuando estén listos.",
    preview: "Tu solicitud está en progreso",
  },
  done: {
    label: "Completado",
    emoji: "✅",
    color: "#10b981",
    message: "Los ajustes en tu sitio han sido completados. Revisa tu sitio para confirmar que todo está como lo pediste.",
    preview: "¡Tus ajustes están listos!",
  },
  cancelled: {
    label: "Cancelado",
    emoji: "❌",
    color: "#ef4444",
    message: "Tu solicitud fue cancelada. Si crees que esto es un error o necesitas asistencia, contáctanos directamente.",
    preview: "Tu solicitud fue cancelada",
  },
}

export default function DifmUpdatedEmail({
  userName,
  ticketId,
  siteName,
  newStatus,
  dashboardUrl,
}: DifmUpdatedEmailProps) {
  const { label, emoji, color, message, preview } = statusConfig[newStatus]

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview} — {siteName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Orvenix</Text>
            <Text style={logoSub}>Actualización de tu solicitud</Text>
          </Section>

          <Section style={body}>
            <Section style={{ textAlign: "center" as const, margin: "0 0 24px" }}>
              <Text style={{ fontSize: "48px", margin: "0" }}>{emoji}</Text>
            </Section>

            <Heading style={h1}>
              Solicitud {label.toLowerCase()}, {userName}
            </Heading>

            <Section style={{ ...statusBadge, borderColor: color }}>
              <Text style={{ ...statusText, color }}>
                Estado actualizado → <strong>{label}</strong>
              </Text>
            </Section>

            <Text style={paragraph}>{message}</Text>

            <Section style={infoBox}>
              <Text style={infoRow}><span style={infoLabel}>Ticket:</span> <span style={infoValue}>#{ticketId.slice(-8).toUpperCase()}</span></Text>
              <Text style={infoRow}><span style={infoLabel}>Sitio:</span> <span style={infoValue}>{siteName}</span></Text>
              <Text style={infoRow}><span style={infoLabel}>Nuevo estado:</span> <span style={{ ...infoValue, color }}>{label}</span></Text>
            </Section>

            <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
              <Link href={dashboardUrl} style={button}>
                Ver en mi dashboard →
              </Link>
            </Section>

            <Text style={paragraph}>
              ¿Preguntas? Responde a este correo o escríbenos a{" "}
              <Link href="mailto:hola@orvenix.com.mx" style={link}>hola@orvenix.com.mx</Link>.
            </Text>
          </Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>© {new Date().getFullYear()} Orvenix · CDMX, México</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

DifmUpdatedEmail.PreviewProps = {
  userName: "Ana Martínez",
  ticketId: "ticket_abc123def",
  siteName: "Mi Restaurante Gourmet",
  newStatus: "done",
  dashboardUrl: "https://orvenix.com.mx/dashboard",
} satisfies DifmUpdatedEmailProps

const main = { backgroundColor: "#0a0d14", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "40px auto", backgroundColor: "#0f1219", borderRadius: "16px", overflow: "hidden" }
const header = { backgroundColor: "#111827", padding: "28px 40px", borderBottom: "1px solid #1f2937" }
const logo = { margin: "0", fontSize: "22px", fontWeight: "900", color: "#ffffff" }
const logoSub = { margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }
const body = { padding: "36px 40px" }
const h1 = { fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: "0 0 20px" }
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#9ca3af", margin: "0 0 16px" }
const statusBadge = { borderLeft: "3px solid", borderRadius: "0 8px 8px 0", padding: "12px 16px", margin: "0 0 20px", backgroundColor: "#161b27" }
const statusText = { fontSize: "14px", fontWeight: "600" as const, margin: "0" }
const infoBox = { backgroundColor: "#161b27", borderRadius: "12px", padding: "20px 24px", margin: "20px 0" }
const infoRow = { fontSize: "14px", margin: "8px 0" }
const infoLabel = { color: "#6b7280", marginRight: "8px" }
const infoValue = { color: "#e5e7eb", fontWeight: "600" as const }
const button = { display: "inline-block", backgroundColor: "#3b82f6", color: "#ffffff", fontWeight: "700", fontSize: "15px", padding: "14px 32px", borderRadius: "10px", textDecoration: "none" }
const link = { color: "#60a5fa", textDecoration: "none" }
const hr = { borderColor: "#1f2937", margin: "0" }
const footer = { padding: "24px 40px", textAlign: "center" as const }
const footerText = { fontSize: "12px", color: "#4b5563", margin: "4px 0" }
