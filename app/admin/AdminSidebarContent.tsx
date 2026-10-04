"use client";

import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { OrvenixBrand } from "@/components/OrvenixLogo";
import { AdminThemeToggle } from "./AdminThemeToggle";
import { AdminNavLinks } from "./AdminNavLinks";

interface AdminSidebarContentProps {
  initials: string;
  userName: string;
  userEmail?: string | null;
  onNavigate?: () => void;
}

export function AdminSidebarContent({ initials, userName, userEmail, onNavigate }: AdminSidebarContentProps) {
  return (
    <>
      <div className="border-b border-white/[0.07] px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--glass-border-hover)] bg-[color:rgba(0,181,246,0.10)] text-[color:var(--accent)]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href="/admin" className="block max-w-full overflow-hidden" onClick={onNavigate}>
              <OrvenixBrand iconSize={30} textSize="base" />
            </Link>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
              Control Admin
            </span>
          </div>
        </div>
        <div className="admin-theme-row mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Tema</span>
          <AdminThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-[20px] border border-[color:var(--glass-border-hover)] bg-[color:rgba(0,181,246,0.06)] p-4 shadow-xl shadow-black/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Orvenix Command
          </p>
          <p className="mt-2 text-sm leading-6 text-white/35">
            Monitorea usuarios, sitios, leads y operaciones desde un solo panel visual.
          </p>
        </div>
      </div>

      <AdminNavLinks onNavigate={onNavigate} />

      <div className="border-t border-white/[0.07] px-4 pb-5 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--glass-border-hover)] bg-[color:rgba(0,181,246,0.10)] text-xs font-bold text-[color:var(--accent)] shadow-[0_0_24px_rgba(0,181,246,0.12)]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white/80">{userName}</p>
            {userEmail ? <p className="truncate text-[10px] text-white/30">{userEmail}</p> : null}
          </div>
        </div>
        <Link
          href="/api/auth/signout"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/14 bg-red-400/[0.05] px-3 py-3 text-xs font-semibold text-red-200/80 transition-all hover:border-red-400/26 hover:bg-red-400/[0.09] hover:text-red-100"
          onClick={onNavigate}
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </Link>
      </div>
    </>
  );
}
