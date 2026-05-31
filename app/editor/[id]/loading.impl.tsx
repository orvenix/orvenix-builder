import { Skeleton } from "@/components/ui/Skeleton"

export default function EditorLoading() {
  return (
    <div className="editor-shell-page relative flex h-screen flex-col overflow-hidden bg-[#070b12] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_84%_0%,rgba(99,102,241,0.10),transparent_24%),linear-gradient(180deg,#040816_0%,#070b12_100%)]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.88) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      </div>

      <header className="editor-topbar relative z-10 flex min-h-[58px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#08101b]/88 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Skeleton variant="text" className="h-3 w-20 bg-white/10" />
          <Skeleton variant="text" className="hidden h-3 w-36 bg-white/10 sm:block" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full bg-white/10" />
        <Skeleton variant="text" className="h-3 w-16 bg-white/10" />
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 bg-transparent">
        <aside className="flex shrink-0">
          <div className="w-11 border-r border-white/[0.05] bg-[#0b0f1c] p-2">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-8 rounded-lg bg-white/10" />
              ))}
            </div>
          </div>
          <div className="w-56 border-r border-white/[0.05] bg-[#09101a] p-3">
            <Skeleton variant="text" className="mb-4 h-3 w-24 bg-white/10" />
            <Skeleton className="mb-4 h-9 bg-white/10" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-24 bg-white/10" />
              ))}
            </div>
          </div>
        </aside>

        <main className="flex flex-1 items-start justify-center overflow-hidden p-8">
          <Skeleton className="h-[70vh] w-full max-w-4xl rounded-[28px] bg-white/80 shadow-2xl shadow-black/20" />
        </main>

        <aside className="w-72 border-l border-white/[0.05] bg-[#09101a] p-4">
          <Skeleton variant="text" className="mb-4 h-3 w-32 bg-white/10" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 bg-white/10" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
