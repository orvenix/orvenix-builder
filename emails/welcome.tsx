import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components"

interface WelcomeEmailProps {
  name: string
  email: string
  dashboardUrl: string
}

export default function WelcomeEmail({ name, email, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Bienvenido a Orvenix — tu sitio web profesional te espera</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Orvenix</Text>
            <Text style={logoSub}>Desarrollo web profesional</Text>
          </Section>

          {/* Body */}
          <Section style={body}>
            <Heading style={h1}>¡Bienvenido, {name}! 👋</Heading>
            <Text style={paragraph}>
              Tu cuenta está lista. Ahora puedes crear, personalizar y publicar tu sitio web profesional desde nuestro editor visual, sin necesidad de saber programar.
            </Text>

            <Section style={featureBox}>
              <Text style={featureItem}>✓ Editor visual drag & drop</Text>
              <Text style={featureItem}>✓ +21 templates profesionales</Text>
              <Text style={featureItem}>✓ Publicación con un clic</Text>
              <Text style={featureItem}>✓ Soporte de nuestro equipo incluido</Text>
            </Section>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Link href={dashboardUrl} style={button}>
                Ir a mi dashboard →
              </Link>
            </Section>

            <Text style={paragraph}>
              Tu correo registrado es: <strong>{email}</strong>
            </Text>
            <Text style={paragraph}>
              Si tienes dudas, responde a este correo o escríbenos a{" "}
              <Link href="mailto:hola@orvenix.com.mx" style={link}>hola@orvenix.com.mx</Link>.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Orvenix · CDMX, México
            </Text>
            <Text style={footerText}>
              <Link href="https://orvenix.com.mx/legal/privacidad" style={footerLink}>Privacidad</Link>
              {" · "}
              <Link href="https://orvenix.com.mx/legal/terminos" style={footerLink}>Términos</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  name: "Carlos López",
  email: "carlos@ejemplo.com",
  dashboardUrl: "https://orvenix.com.mx/dashboard",
} satisfies WelcomeEmailProps

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = { backgroundColor: "#0a0d14", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "40px auto", backgroundColor: "#0f1219", borderRadius: "16px", overflow: "hidden" }
const header = { backgroundColor: "#111827", padding: "28px 40px", borderBottom: "1px solid #1f2937" }
const logo = { margin: "0", fontSize: "22px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.5px" }
const logoSub = { margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }
const body = { padding: "36px 40px" }
const h1 = { fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: "0 0 16px" }
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#9ca3af", margin: "0 0 16px" }
const featureBox = { backgroundColor: "#161b27", borderRadius: "12px", padding: "20px 24px", margin: "20px 0" }
const featureItem = { fontSize: "14px", color: "#d1d5db", margin: "6px 0", lineHeight: "1.5" }
const button = {
  display: "inline-block", backgroundColor: "#3b82f6", color: "#ffffff", fontWeight: "700",
  fontSize: "15px", padding: "14px 32px", borderRadius: "10px", textDecoration: "none",
}
const link = { color: "#60a5fa", textDecoration: "none" }
const hr = { borderColor: "#1f2937", margin: "0" }
const footer = { padding: "24px 40px", textAlign: "center" as const }
const footerText = { fontSize: "12px", color: "#4b5563", margin: "4px 0" }
const footerLink = { color: "#6b7280", textDecoration: "none" }
