import { Skeleton } from "@/components/ui/Skeleton"

export default function WebsLoading() {
  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      <div className="border-b border-white/[0.08] bg-[#06060f]/80 px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="h-7 w-7 bg-white/10" />
            <Skeleton variant="text" className="h-3 w-28 bg-white/10" />
          </div>
          <Skeleton variant="text" className="h-3 w-24 bg-white/10" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 space-y-3">
          <Skeleton variant="text" className="h-4 w-40 bg-white/10" />
          <Skeleton variant="text" className="h-8 w-72 max-w-full bg-white/10" />
          <Skeleton variant="text" className="h-3 w-96 max-w-full bg-white/10" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="motion-glass rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <div className="mb-5 flex items-start justify-between">
                <Skeleton variant="circle" className="h-9 w-9 bg-white/10" />
                <Skeleton variant="text" className="h-3 w-16 bg-white/10" />
              </div>
              <Skeleton variant="text" className="mb-3 h-7 w-28 bg-white/10" />
              <Skeleton variant="text" className="h-3 w-36 bg-white/10" />
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Skeleton className="h-72 bg-white/10 xl:col-span-2" />
          <Skeleton className="h-72 bg-white/10" />
        </div>
      </main>
    </div>
  )
}
