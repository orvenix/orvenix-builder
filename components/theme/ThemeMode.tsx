"use client";

import { useEffect, useState } from "react";

function applyTheme(lightMode: boolean) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("light-mode", lightMode);
  document.documentElement.style.colorScheme = lightMode ? "light" : "dark";
}

export function useThemeMode() {
  const [lightMode, setLightMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("theme") === "light";
  });

  useEffect(() => {
    applyTheme(lightMode);
    window.localStorage.setItem("theme", lightMode ? "light" : "dark");
  }, [lightMode]);

  return {
    lightMode,
    toggleTheme: () => setLightMode((current) => !current),
  };
}

export function ThemeModeSync() {
  useThemeMode();
  return null;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggleTheme } = useThemeMode();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className={`theme-toggle ${className}`.trim()}
    >
      <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
