"use client";

import { useInsertionEffect } from "react";

function isNextDevtoolsSegmentError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() ?? "";

  return (
    message.includes("cannot read properties of undefined") &&
    message.includes("page.tsx") &&
    stack.includes("next-devtools") &&
    stack.includes("segmentexplorernodeadd")
  );
}

export function DevtoolsErrorSilencer() {
  useInsertionEffect(() => {
    const originalOnError = window.onerror;

    window.onerror = function handleWindowError(message, source, lineno, colno, error) {
      if (isNextDevtoolsSegmentError(error)) return true;
      return originalOnError?.call(window, message, source, lineno, colno, error) ?? false;
    };

    const handleError = (event: ErrorEvent) => {
      if (!isNextDevtoolsSegmentError(event.error)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (!isNextDevtoolsSegmentError(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection, true);

    return () => {
      window.onerror = originalOnError;
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection, true);
    };
  }, []);

  return null;
}
