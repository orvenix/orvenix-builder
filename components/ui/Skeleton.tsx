import { cn } from "@/app/webs/_shared/lib/cn"

type SkeletonProps = {
  className?: string
  variant?: "block" | "text" | "circle"
}

export function Skeleton({ className, variant = "block" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer bg-slate-200/70 dark:bg-white/10",
        variant === "text" && "h-3 rounded-full",
        variant === "block" && "rounded-xl",
        variant === "circle" && "rounded-full",
        className
      )}
    />
  )
}
