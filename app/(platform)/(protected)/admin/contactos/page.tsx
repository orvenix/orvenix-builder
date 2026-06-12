import type { ReactNode } from "react";
import AdminContactosPageContentDefault from "@/app/admin/contactos/page.impl";

type AdminContactosSearchParams = { [key: string]: string | string[] | undefined };

type AdminContactosPageContentProps = {
  searchParams?: AdminContactosSearchParams;
};

const AdminContactosPageContent = AdminContactosPageContentDefault as (
  props: AdminContactosPageContentProps,
) => ReactNode | Promise<ReactNode>;

interface Props {
  searchParams?: Promise<AdminContactosSearchParams>;
}

export default async function ProtectedAdminContactosPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;

  return AdminContactosPageContent({ searchParams: resolvedSearchParams });
}
