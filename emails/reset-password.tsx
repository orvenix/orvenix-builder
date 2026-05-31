import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components"

interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
  expiresInMinutes: number
}

export default function ResetPasswordEmail({ name, resetUrl, expiresInMinutes }: ResetPasswordEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Restablece tu contraseña de Orvenix</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Orvenix</Text>
            <Text style={logoSub}>Recuperación de contraseña</Text>
          </Section>

          <Section style={body}>
            <Section style={{ textAlign: "center" as const, margin: "0 0 24px" }}>
              <Text style={{ fontSize: "48px", margin: "0" }}>🔐</Text>
            </Section>

            <Heading style={h1}>Restablecer contraseña</Heading>

            <Text style={paragraph}>
              Hola {name}, recibimos una solicitud para restablecer la contraseña de tu cuenta en Orvenix.
            </Text>

            <Text style={paragraph}>
              Haz clic en el botón para crear una nueva contraseña. El enlace es válido por{" "}
              <strong style={{ color: "#e5e7eb" }}>{expiresInMinutes} minutos</strong>.
            </Text>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Link href={resetUrl} style={button}>
                Crear nueva contraseña →
              </Link>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta no sufrirá cambios.
              </Text>
            </Section>

            <Text style={paragraph}>
              Por seguridad, el enlace solo puede usarse una vez y expira automáticamente.
            </Text>

            <Text style={smallText}>
              Si el botón no funciona, copia y pega esta URL en tu navegador:
            </Text>
            <Text style={urlText}>{resetUrl}</Text>
          </Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Este correo fue enviado porque se solicitó un restablecimiento de contraseña para la cuenta asociada a este email.
            </Text>
            <Text style={footerText}>© {new Date().getFullYear()} Orvenix · CDMX, México</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

ResetPasswordEmail.PreviewProps = {
  name: "Carlos López",
  resetUrl: "https://orvenix.com.mx/reset-password?token=abc123def456",
  expiresInMinutes: 30,
} satisfies ResetPasswordEmailProps

const main = { backgroundColor: "#0a0d14", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "40px auto", backgroundColor: "#0f1219", borderRadius: "16px", overflow: "hidden" }
const header = { backgroundColor: "#111827", padding: "28px 40px", borderBottom: "1px solid #1f2937" }
const logo = { margin: "0", fontSize: "22px", fontWeight: "900", color: "#ffffff" }
const logoSub = { margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }
const body = { padding: "36px 40px" }
const h1 = { fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: "0 0 16px" }
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#9ca3af", margin: "0 0 16px" }
const button = { display: "inline-block", backgroundColor: "#3b82f6", color: "#ffffff", fontWeight: "700", fontSize: "15px", padding: "14px 32px", borderRadius: "10px", textDecoration: "none" }
const warningBox = { backgroundColor: "#1c1208", border: "1px solid #3d2000", borderRadius: "10px", padding: "16px 20px", margin: "20px 0" }
const warningText = { fontSize: "13px", color: "#d97706", margin: "0", lineHeight: "1.5" }
const smallText = { fontSize: "12px", color: "#4b5563", margin: "20px 0 4px" }
const urlText = { fontSize: "11px", color: "#374151", wordBreak: "break-all" as const, backgroundColor: "#161b27", padding: "10px 14px", borderRadius: "8px", margin: "0" }
const hr = { borderColor: "#1f2937", margin: "0" }
const footer = { padding: "24px 40px", textAlign: "center" as const }
const footerText = { fontSize: "12px", color: "#4b5563", margin: "4px 0", lineHeight: "1.5" }
