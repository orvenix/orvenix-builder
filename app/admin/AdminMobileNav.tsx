"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { OrvenixBrand } from "@/components/OrvenixLogo";
import { AdminSidebarContent } from "./AdminSidebarContent";

interface AdminMobileNavProps {
  initials: string;
  userName: string;
  userEmail?: string | null;
}

export function AdminMobileNav({ initials, userName, userEmail }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const trigger = openButtonRef.current;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="admin-mobile-header admin-sidebar sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          ref={openButtonRef}
          type="button"
          aria-label="Abrir menú de administración"
          aria-controls={drawerId}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[color:var(--text)] transition-colors hover:border-[rgba(0,181,246,0.25)] hover:bg-[rgba(0,181,246,0.08)]"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <OrvenixBrand iconSize={28} textSize="sm" />
          <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
            Control Admin
          </span>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Cerrar menú de administración"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            id={drawerId}
            aria-label="Menú de administración"
            className="admin-sidebar relative flex h-dvh w-[84vw] max-w-[22rem] flex-col overflow-y-auto border-r border-white/[0.07] shadow-2xl shadow-black/40"
          >
            <div className="flex justify-end px-4 pt-4">
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Cerrar menú de administración"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[color:var(--text)] transition-colors hover:border-[rgba(0,181,246,0.25)] hover:bg-[rgba(0,181,246,0.08)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <AdminSidebarContent
              initials={initials}
              userName={userName}
              userEmail={userEmail}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
