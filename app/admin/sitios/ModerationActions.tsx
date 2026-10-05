"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { moderateSiteAction } from "@/app/actions/admin-moderation"
import type { ModerationAction, SiteModerationState } from "@/lib/moderation/site-moderation"

const ACTION_COPY: Record<ModerationAction, { label: string; confirm: string; tone: string }> = {
  WARNING: { label: "Advertir", confirm: "Registrar advertencia y avisar al dueño", tone: "bg-amber-400/10 text-amber-300 hover:bg-amber-400/20" },
  SUSPEND: { label: "Suspender", confirm: "Confirmar suspensión", tone: "bg-orange-500/10 text-orange-300 hover:bg-orange-500/20" },
  REACTIVATE: { label: "Reactivar", confirm: "Confirmar reactivación", tone: "bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20" },
  TERMINATE: { label: "Terminar", confirm: "Confirmar terminación", tone: "bg-red-500/10 text-red-300 hover:bg-red-500/20" },
}

function availableActions(state: SiteModerationState): ModerationAction[] {
  if (state === "active") return ["WARNING", "SUSPEND", "TERMINATE"]
  if (state === "suspended") return ["WARNING", "REACTIVATE", "TERMINATE"]
  return ["WARNING", "REACTIVATE"]
}

/**
 * ADMIN MODERATION MINIMUM: one action at a time, always with a reason and an
 * explicit confirm; TERMINATE also needs the site id typed. The server
 * re-checks everything (role, id, reason, transition).
 */
export function ModerationActions({ siteId, state }: { siteId: string; state: SiteModerationState }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<ModerationAction | null>(null)
  const [reason, setReason] = useState("")
  const [confirmId, setConfirmId] = useState("")
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const close = () => {
    setAction(null)
    setReason("")
    setConfirmId("")
  }

  const submit = () => {
    if (!action) return
    startTransition(async () => {
      const result = await moderateSiteAction({ siteId, action, reason, confirmSiteId: confirmId })
      if (!("message" in result)) {
        const emailNote = result.email ? ` (email: ${result.email})` : ""
        setFeedback({ ok: true, text: `${ACTION_COPY[result.action].label}: listo${emailNote}.` })
        close()
        router.refresh()
      } else {
        setFeedback({ ok: false, text: result.message })
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {availableActions(state).map((candidate) => (
          <button
            key={candidate}
            type="button"
            disabled={pending}
            onClick={() => {
              setFeedback(null)
              setAction(candidate)
            }}
            className={`rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-50 ${ACTION_COPY[candidate].tone}`}
          >
            {ACTION_COPY[candidate].label}
          </button>
        ))}
      </div>

      {action && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/80 p-3">
          <label className="block text-xs font-bold text-slate-300">
            Motivo ({ACTION_COPY[action].label.toLowerCase()})
            <textarea
              value={reason}
              maxLength={500}
              rows={3}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-xs text-white"
              placeholder="Explica el motivo; el dueño lo verá."
            />
          </label>
          {action === "TERMINATE" && (
            <label className="block text-xs font-bold text-red-300">
              Escribe <span className="font-mono">{siteId}</span> para confirmar
              <input
                value={confirmId}
                onChange={(event) => setConfirmId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-red-500/30 bg-slate-950 p-2 font-mono text-xs text-white"
                autoComplete="off"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || reason.trim().length < 5 || (action === "TERMINATE" && confirmId !== siteId)}
              onClick={submit}
              className={`rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-40 ${ACTION_COPY[action].tone}`}
            >
              {pending ? "Aplicando..." : ACTION_COPY[action].confirm}
            </button>
            <button type="button" disabled={pending} onClick={close} className="rounded-lg bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {feedback && <p className={`text-xs ${feedback.ok ? "text-emerald-300" : "text-red-300"}`}>{feedback.text}</p>}
    </div>
  )
}
