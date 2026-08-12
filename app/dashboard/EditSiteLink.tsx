"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

type EditSiteLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function EditSiteLink({ href, onClick, children, className, ...props }: EditSiteLinkProps) {
  const router = useRouter();
  const fallbackRef = useRef<number | null>(null);
  const [pending, setPending] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank"
    ) {
      return;
    }

    event.preventDefault();
    setPending(true);
    router.push(href);

    if (fallbackRef.current) {
      window.clearTimeout(fallbackRef.current);
    }

    fallbackRef.current = window.setTimeout(() => {
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== href) {
        window.location.assign(href);
      }
    }, 650);
  }

  return (
    <a
      {...props}
      href={href}
      aria-busy={pending || undefined}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
