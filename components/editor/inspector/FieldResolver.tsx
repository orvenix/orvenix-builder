"use client";

import Image from "next/image";
import { useId, useState } from "react";
import * as Icons from "lucide-react";
import type { AssetPickerTarget, NodeId, SettingsField } from "@/types/editor";

// ============================================================
// FieldResolver — mapea un SettingsField a su control
// ============================================================

interface FieldResolverProps {
  field: SettingsField;
  value: unknown;
  onChange: (value: unknown) => void;
  nodeId?: NodeId | null;
  propKey?: string;
  onOpenAssetPicker?: (target: AssetPickerTarget) => void;
}

export function FieldResolver({
  field,
  value,
  onChange,
  nodeId,
  propKey,
  onOpenAssetPicker,
}: FieldResolverProps) {
  switch (field.kind) {
    case "text":
      return (
        <TextField
          label={field.label}
          help={field.help}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      );
    case "textarea":
      return (
        <TextAreaField
          label={field.label}
          help={field.help}
          placeholder={field.placeholder}
          rows={field.rows}
          maxLength={field.maxLength}
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <NumberField
          label={field.label}
          help={field.help}
          min={field.min}
          max={field.max}
          step={field.step}
          suffix={field.suffix}
          value={(value as number) ?? field.min ?? 0}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <SelectField
          label={field.label}
          help={field.help}
          options={field.options}
          value={value as string | number}
          onChange={onChange}
        />
      );
    case "segmented":
      return (
        <SegmentedField
          label={field.label}
          help={field.help}
          options={(field.options ?? []).filter(
            (option): option is { value: string; label: string; icon?: string } =>
              typeof option.value === "string"
          )}
          value={value as string}
          onChange={onChange}
        />
      );
    case "color":
      return (
        <ColorField
          label={field.label}
          help={field.help}
          presets={field.presets}
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      );
    case "toggle":
      return (
        <ToggleField
          label={field.label}
          help={field.help}
          value={Boolean(value)}
          onChange={onChange}
        />
      );
    case "image":
      return (
        <ImageField
          label={field.label}
          help={field.help}
          value={(value as string) ?? ""}
          clearable={field.clearable}
          onChange={onChange}
          onPickFromLibrary={
            nodeId && propKey && onOpenAssetPicker
              ? () => onOpenAssetPicker({ nodeId, propKey, initialTab: "image" })
              : undefined
          }
        />
      );
    default:
      return null;
  }
}

// ============================================================
// Label compartido
// ============================================================

function FieldLabel({
  label,
  help,
  htmlFor,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
}) {
  return (
    <div className="mb-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium text-slate-300"
      >
        {label}
      </label>
      {help && (
        <div className="mt-0.5 text-[10px] leading-tight text-slate-500">
          {help}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TextField
// ============================================================

function TextField({
  label,
  help,
  placeholder,
  maxLength,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  placeholder?: string;
  maxLength?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel label={label} help={help} htmlFor={id} />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none"
      />
    </div>
  );
}

// ============================================================
// TextAreaField
// ============================================================

function TextAreaField({
  label,
  help,
  placeholder,
  rows = 3,
  maxLength,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel label={label} help={help} htmlFor={id} />
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none"
      />
      {maxLength && (
        <div className="mt-1 text-right text-[10px] text-slate-600">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NumberField
// ============================================================

function NumberField({
  label,
  help,
  min,
  max,
  step = 1,
  suffix,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel label={label} help={help} htmlFor={id} />
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SelectField
// ============================================================

function SelectField({
  label,
  help,
  options,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  options: ReadonlyArray<{ value: string | number; label: string }>;
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel label={label} help={help} htmlFor={id} />
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const numeric = Number(raw);
            const isNumericOption =
              options.length > 0 && typeof options[0].value === "number";
            onChange(isNumericOption ? numeric : raw);
          }}
          className="w-full appearance-none rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 pr-8 text-xs text-slate-100 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none"
        >
          {options.map((opt) => (
            <option
              key={String(opt.value)}
              value={opt.value}
              className="bg-slate-900"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <Icons.ChevronDown
          size={12}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
    </div>
  );
}

// ============================================================
// SegmentedField — pill selector
// ============================================================

function SegmentedField({
  label,
  help,
  options,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  options: ReadonlyArray<{ value: string; label: string; icon?: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} help={help} />
      <div className="flex flex-wrap gap-1 rounded-lg border border-white/5 bg-white/[0.02] p-1">
        {options.map((opt) => {
          const isActive = value === opt.value;
          const Icon = opt.icon
            ? (Icons as unknown as Record<
                string,
                React.ComponentType<{ size?: number }>
              >)[opt.icon]
            : null;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              className={`flex min-w-[4.5rem] flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-500/30"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              {Icon ? <Icon size={12} /> : null}
              <span className={Icon ? "sr-only sm:not-sr-only" : ""}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ColorField — input + presets + limpiar
// ============================================================

function ColorField({
  label,
  help,
  presets,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  presets?: ReadonlyArray<string>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasValue = value && value.length > 0;

  // Si value es un gradiente/variable CSS, no lo mandamos al input type=color
  const isSolidHex = /^#[0-9a-fA-F]{3,8}$/.test(value);

  return (
    <div>
      <FieldLabel label={label} help={help} />
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={value}
            placeholder="#0f172a, rgb(…), linear-gradient(…)"
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-white/5 bg-white/[0.03] py-2 pl-9 pr-3 font-mono text-[11px] text-slate-100 placeholder:text-slate-600 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none"
          />
          {/* Swatch a la izquierda */}
          <div
            className="pointer-events-none absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-md ring-1 ring-white/10"
            style={{
              background: hasValue
                ? value
                : "repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 8px 8px",
            }}
          />
        </div>

        {/* Picker nativo para colores sólidos */}
        <label className="relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200">
          <Icons.Pipette size={13} />
          <input
            type="color"
            value={isSolidHex ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Quitar color"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Icons.X size={13} />
          </button>
        )}
      </div>

      {presets && presets.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-300"
          >
            Paleta
            <Icons.ChevronDown
              size={10}
              className={`transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded && (
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange(preset)}
                  title={preset}
                  className={`h-6 w-full rounded-md ring-1 transition-transform hover:scale-110 ${
                    value === preset
                      ? "ring-2 ring-indigo-400"
                      : "ring-white/10"
                  }`}
                  style={{ background: preset }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ImageField — URL + selector local
// ============================================================

function ImageField({
  label,
  help,
  value,
  clearable,
  onChange,
  onPickFromLibrary,
}: {
  label: string;
  help?: string;
  value: string;
  clearable?: boolean;
  onChange: (v: string) => void;
  onPickFromLibrary?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const hasValue = value.trim().length > 0;

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/editor/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? "Error al subir la imagen.");
      } else {
        onChange(data.url);
      }
    } catch {
      setUploadError("Error de conexión al subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <FieldLabel label={label} help={help} />

      {hasValue && (
        <div className="mb-2 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.025]">
          <div className="relative h-28 w-full">
            <Image src={value} alt="" fill unoptimized className="object-cover" />
          </div>
        </div>
      )}

      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Icons.Link size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={value}
            placeholder="https://... o sube una imagen →"
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-white/5 bg-white/[0.03] py-2 pl-8 pr-3 font-mono text-[11px] text-slate-100 placeholder:text-slate-600 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none"
          />
        </div>

        {/* Botón de upload — sube al servidor, devuelve URL permanente */}
        <label
          title="Subir imagen desde tu dispositivo (máx 5 MB)"
          className={`relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300 ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? <Icons.Loader2 size={13} className="animate-spin" /> : <Icons.Upload size={13} />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {onPickFromLibrary && (
          <button
            type="button"
            onClick={onPickFromLibrary}
            title="Abrir Media Center"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300"
          >
            <Icons.Images size={13} />
          </button>
        )}

        {clearable && hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Quitar imagen"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/5 bg-white/[0.03] text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Icons.X size={13} />
          </button>
        )}
      </div>

      {uploading && (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-400">
          <Icons.Loader2 size={10} className="animate-spin" /> Subiendo imagen...
        </p>
      )}
      {uploadError && (
        <p className="mt-1.5 text-[10px] text-red-400">{uploadError}</p>
      )}
    </div>
  );
}

// ============================================================
// ToggleField
// ============================================================

function ToggleField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-slate-300">{label}</div>
        {help && (
          <div className="mt-0.5 text-[10px] leading-tight text-slate-500">
            {help}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-indigo-600" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            value ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
