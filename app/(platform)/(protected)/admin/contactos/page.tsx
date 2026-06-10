import AdminContactosPage from "@/app/admin/contactos/page.impl";

interface Props {
  searchParams?: Promise<{ q?: string; contactId?: string }>;
}

export default function ProtectedAdminContactosPage({ searchParams }: Props) {
  return <AdminContactosPage searchParams={searchParams} />;
}
