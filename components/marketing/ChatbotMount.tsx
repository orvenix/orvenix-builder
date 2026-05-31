"use client";

import { usePathname } from "next/navigation";
import { Chatbot } from "@/components/marketing/Chatbot";

const EXCLUDED_PREFIXES = [
  "/templates",
  "/webs",
  "/editor",
  "/dashboard",
  "/login",
  "/register",
  "/checkout",
  "/admin",
  "/constructor",
  "/preview",
  "/p/",
];

const EXCLUDED_EXACT = ["/estado"];

const CHATBOT_HIDE_CSS =
  ".cb-fab,.cb-bubble,.cb-panel,.cb-backdrop{display:none!important;width:0!important;height:0!important;overflow:hidden!important;position:fixed!important;pointer-events:none!important}";

function shouldShowChatbot(pathname: string) {
  if (EXCLUDED_EXACT.includes(pathname)) return false;
  return !EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function ChatbotMount() {
  const pathname = usePathname() ?? "/";

  if (!shouldShowChatbot(pathname)) {
    // El script puede haber persistido de una navegación anterior.
    // Mantenemos position:fixed para que no rompa el flujo del documento
    // y lo ocultamos completamente.
    return <style dangerouslySetInnerHTML={{ __html: CHATBOT_HIDE_CSS }} />;
  }

  return <Chatbot />;
}
