import { createPrisma } from "./_client.mjs";

const prisma = createPrisma();

try {
  const total = await prisma.contact.count();
  console.log(`[migrate-contacts] Conexion OK. Contactos disponibles: ${total}`);
  console.log("[migrate-contacts] El modelo Contact ya vive en prisma/editor.prisma.");
  console.log("[migrate-contacts] Si necesitas cambios estructurales, usa prisma migrate deploy con el schema actual.");
} finally {
  await prisma.$disconnect();
}
