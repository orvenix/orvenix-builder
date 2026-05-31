"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CreditCard, LayoutDashboard, Users, Globe, MessageSquare, Wrench, Share2 } from "lucide-react";

const navItems = [
  { href: "/admin",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/difm",       label: "DIFM",       icon: Wrench },
  { href: "/admin/contactos",  label: "Contactos",  icon: MessageSquare },
  { href: "/admin/afiliados",  label: "Afiliados",  icon: Share2 },
  { href: "/admin/billing",     label: "Billing",    icon: CreditCard },
  { href: "/admin/webhooks",    label: "Webhooks",   icon: Activity },
  { href: "/admin/usuarios",   label: "Usuarios",   icon: Users },
  { href: "/admin/sitios",     label: "Sitios",     icon: Globe },
];

export function AdminNavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex-1 space-y-1.5 px-4 py-4">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`admin-nav-item group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              active
                ? "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] text-[color:var(--accent)] shadow-lg shadow-[rgba(0,81,111,0.20)]"
                : "border-transparent bg-white/2.5 text-[color:var(--text-secondary)] hover:-translate-y-0.5 hover:border-[rgba(0,181,246,0.20)] hover:bg-[rgba(0,181,246,0.07)] hover:text-[color:var(--accent)]"
            }`}
          >
            {/* Left accent bar */}
            <span
              className={`absolute left-0 top-3 bottom-3 w-0.75 rounded-full bg-[color:var(--accent)] transition-all duration-400 ease-out ${
                active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
              }`}
              style={{ transformOrigin: "center" }}
            />

            {/* Icon */}
            <span className={`admin-nav-icon flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
              active
                ? "border-[rgba(0,181,246,0.28)] bg-[rgba(0,181,246,0.12)] shadow-[0_0_16px_rgba(0,181,246,0.18)]"
                : "border-white/8 bg-white/3 group-hover:border-[rgba(0,181,246,0.20)] group-hover:bg-[rgba(0,181,246,0.08)]"
            }`}>
              <Icon className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                active
                  ? "text-[color:var(--accent)] drop-shadow-[0_0_6px_rgba(0,181,246,0.45)]"
                  : "text-white/25 group-hover:text-[color:var(--accent)] group-hover:rotate-[8deg] group-hover:scale-110"
              }`} />
            </span>

            {label}

            {active && (
              <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_6px_rgba(0,181,246,0.8)] animate-pulse" />
            )}

            {/* Ripple hover */}
            <span className="absolute inset-0 -z-10 -translate-x-full bg-linear-to-r from-transparent via-[rgba(0,181,246,0.08)] to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100" />
          </Link>
        );
      })}
    </nav>
  );
}
