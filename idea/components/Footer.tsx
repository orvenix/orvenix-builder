import Link from "next/link";
import { Layers } from "lucide-react";
import { BRAND, FOOTER_COLUMNS, FOOTER_BOTTOM_NOTE } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)", background: "var(--paper-alt)" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="font-display font-semibold text-lg flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--coral)" }}>
              <Layers size={16} color="#fff8f5" />
            </span>
            {BRAND.name}
          </Link>
          <p className="text-sm text-muted leading-relaxed">{BRAND.tagline}</p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">{column.heading}</p>
            <ul className="space-y-2 text-sm text-muted">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:opacity-80 transition-opacity">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="max-w-6xl mx-auto px-5 sm:px-8 py-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderColor: "var(--border)" }}
      >
        <p className="text-xs text-faint">
          © {new Date().getFullYear()} {BRAND.name}. {FOOTER_BOTTOM_NOTE}.
        </p>
      </div>
    </footer>
  );
}
