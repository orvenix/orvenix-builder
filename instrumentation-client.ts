function isNextDevtoolsSegmentError(value: unknown) {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : "";
  const stack = value instanceof Error ? value.stack ?? "" : "";
  const text = `${message}\n${stack}`.toLowerCase();

  return (
    text.includes("cannot read properties of undefined") &&
    text.includes("page.tsx") &&
    (text.includes("next-devtools") || text.includes("segmentexplorernodeadd"))
  );
}

const originalOnError = window.onerror;

window.onerror = function handleNextDevtoolsError(message, source, lineno, colno, error) {
  if (isNextDevtoolsSegmentError(error) || isNextDevtoolsSegmentError(String(message))) {
    return true;
  }

  return originalOnError?.call(window, message, source, lineno, colno, error) ?? false;
};

window.addEventListener(
  "error",
  (event) => {
    if (!isNextDevtoolsSegmentError(event.error) && !isNextDevtoolsSegmentError(event.message)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  },
  true,
);

window.addEventListener(
  "unhandledrejection",
  (event) => {
    if (!isNextDevtoolsSegmentError(event.reason)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  },
  true,
);
