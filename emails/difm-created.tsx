import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components"

interface DifmCreatedEmailProps {
  userName: string
  userEmail: string
  ticketId: string
  siteName: string
  message: string
  timeline: string | null
  dashboardUrl: string
  isAdmin?: boolean
}

export default function DifmCreatedEmail({
  userName,
  userEmail,
  ticketId,
  siteName,
  message,
  timeline,
  dashboardUrl,
  isAdmin = false,
}: DifmCreatedEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>
        {isAdmin
          ? `Nueva solicitud DIFM de ${userName} — ${siteName}`
          : `Tu solicitud de ajustes fue recibida — ${siteName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Orvenix</Text>
            <Text style={logoSub}>Solicitud de ajustes recibida</Text>
          </Section>

          <Section style={body}>
            {isAdmin ? (
              <>
                <Heading style={h1}>Nueva solicitud DIFM 🔔</Heading>
                <Text style={paragraph}>
                  El cliente <strong style={{ color: "#fff" }}>{userName}</strong> ({userEmail}) ha enviado una solicitud de ajustes manuales.
                </Text>
              </>
            ) : (
              <>
                <Heading style={h1}>¡Solicitud recibida, {userName}!</Heading>
                <Text style={paragraph}>
                  Hemos recibido tu solicitud de ajustes. Nuestro equipo la revisará y comenzará a trabajar en ella dentro de las próximas 24 horas hábiles.
                </Text>
              </>
            )}

            <Section style={infoBox}>
              <Text style={infoRow}><span style={infoLabel}>Ticket ID:</span> <span style={infoValue}>#{ticketId.slice(-8).toUpperCase()}</span></Text>
              <Text style={infoRow}><span style={infoLabel}>Sitio:</span> <span style={infoValue}>{siteName}</span></Text>
              {timeline && <Text style={infoRow}><span style={infoLabel}>Plazo solicitado:</span> <span style={infoValue}>{timeline}</span></Text>}
            </Section>

            <Section style={messageBox}>
              <Text style={messageLabel}>Descripción de los ajustes</Text>
              <Text style={messageText}>{message}</Text>
            </Section>

            <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
              <Link href={dashboardUrl} style={button}>
                {isAdmin ? "Ver en el panel admin →" : "Ver estado en mi dashboard →"}
              </Link>
            </Section>

            {!isAdmin && (
              <Text style={paragraph}>
                Te notificaremos por correo cuando haya actualizaciones en tu solicitud. Puedes responder a este email para agregar información adicional.
              </Text>
            )}
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

DifmCreatedEmail.PreviewProps = {
  userName: "Ana Martínez",
  userEmail: "ana@empresa.com",
  ticketId: "ticket_abc123",
  siteName: "Mi Restaurante Gourmet",
  message: "Necesito cambiar el número de teléfono en el footer y agregar una sección de galería de fotos después del menú.",
  timeline: "Esta semana si es posible",
  dashboardUrl: "https://orvenix.com.mx/dashboard",
  isAdmin: false,
} satisfies DifmCreatedEmailProps

const main = { backgroundColor: "#0a0d14", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "40px auto", backgroundColor: "#0f1219", borderRadius: "16px", overflow: "hidden" }
const header = { backgroundColor: "#111827", padding: "28px 40px", borderBottom: "1px solid #1f2937" }
const logo = { margin: "0", fontSize: "22px", fontWeight: "900", color: "#ffffff" }
const logoSub = { margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }
const body = { padding: "36px 40px" }
const h1 = { fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: "0 0 16px" }
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#9ca3af", margin: "0 0 16px" }
const infoBox = { backgroundColor: "#161b27", borderRadius: "12px", padding: "20px 24px", margin: "20px 0" }
const infoRow = { fontSize: "14px", margin: "8px 0", lineHeight: "1.5" }
const infoLabel = { color: "#6b7280", marginRight: "8px" }
const infoValue = { color: "#e5e7eb", fontWeight: "600" as const }
const messageBox = { backgroundColor: "#1a1f2e", borderLeft: "3px solid #3b82f6", borderRadius: "0 8px 8px 0", padding: "16px 20px", margin: "16px 0" }
const messageLabel = { fontSize: "11px", fontWeight: "700" as const, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 8px" }
const messageText = { fontSize: "14px", color: "#d1d5db", lineHeight: "1.6", margin: "0", fontStyle: "italic" as const }
const button = { display: "inline-block", backgroundColor: "#3b82f6", color: "#ffffff", fontWeight: "700", fontSize: "15px", padding: "14px 32px", borderRadius: "10px", textDecoration: "none" }
const hr = { borderColor: "#1f2937", margin: "0" }
const footer = { padding: "24px 40px", textAlign: "center" as const }
const footerText = { fontSize: "12px", color: "#4b5563", margin: "4px 0" }
