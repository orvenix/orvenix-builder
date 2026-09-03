"use client";

import { Component, type ReactNode } from "react";

interface EditorRuntimeBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface EditorRuntimeBoundaryState {
  error: Error | null;
}

export class EditorRuntimeBoundary extends Component<
  EditorRuntimeBoundaryProps,
  EditorRuntimeBoundaryState
> {
  state: EditorRuntimeBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(previousProps: EditorRuntimeBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ConstructorRecoveryScreen
        message={this.state.error.message}
        resetKey={this.props.resetKey}
      />
    );
  }
}

function clearConstructorDraft(resetKey: string) {
  if (typeof window === "undefined") return;
  const source = resetKey.replace(/^draft:constructor:/, "");
  const encodedSource = encodeURIComponent(source);
  const storageKeys = [
    "orvenix_editor_tree:v2:" + resetKey + ":home",
    "orvenix_editor_tree:v2:draft:constructor:" + encodedSource + ":home",
    "orvenix_assets_" + resetKey,
  ];

  storageKeys.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures.
    }
  });
}

function ConstructorRecoveryScreen({
  message,
  resetKey,
}: {
  message: string;
  resetKey: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
          Constructor
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          No se pudo abrir el editor
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Detectamos un error al iniciar el constructor. Puedes reintentar con un borrador limpio.
        </p>
        <pre className="mt-4 max-h-32 overflow-auto rounded-xl border border-white/[0.08] bg-black/30 p-3 text-xs text-slate-300">
          {message}
        </pre>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950"
            onClick={() => {
              clearConstructorDraft(resetKey);
              window.location.reload();
            }}
          >
            Reiniciar constructor
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-semibold text-slate-200"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}
