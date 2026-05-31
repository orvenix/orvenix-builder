import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "@/app/providers";
import { DevtoolsErrorSilencer } from "@/components/DevtoolsErrorSilencer";
import { ChatbotMount } from "@/components/marketing/ChatbotMount";
import { ThemeModeSync } from "@/components/theme/ThemeMode";
import { RefCapture } from "@/components/marketing/RefCapture";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://orvenix.com.mx'),
  title: "Orvenix",
  description: "Desarrollo web profesional",
  icons: {
    icon: "/img/logo-main.png?v=4",
    shortcut: "/img/logo-main.png?v=4",
    apple: "/img/logo-main.png?v=4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DevtoolsErrorSilencer />
        <ThemeModeSync />
        <Suspense><RefCapture /></Suspense>
        <Providers>{children}</Providers>
        <ChatbotMount />
      </body>
    </html>
  );
}
