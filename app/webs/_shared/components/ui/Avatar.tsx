import { cn } from "@/app/webs/_shared/lib/cn"

const sizeMap = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-[11px]",
  md: "w-9 h-9 text-xs",
  lg: "w-11 h-11 text-sm",
  xl: "w-14 h-14 text-base",
}

interface AvatarProps {
  initials: string
  color?: string
  size?: keyof typeof sizeMap
  className?: string
  title?: string
}

export function Avatar({ initials, color = "#6366f1", size = "md", className, title }: AvatarProps) {
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-bold text-white shrink-0", sizeMap[size], className)}
      style={{ backgroundColor: color }}
      title={title}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ─── Avatar group ──────────────────────────────────────────────────────────────

interface AvatarGroupProps {
  avatars: Array<{ initials: string; color: string; title?: string }>
  max?: number
  size?: keyof typeof sizeMap
  overlap?: boolean
}

export function AvatarGroup({ avatars, max = 4, size = "sm", overlap = true }: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn("flex items-center", overlap && "-space-x-2")}>
      {visible.map((av, i) => (
        <Avatar
          key={i}
          initials={av.initials}
          color={av.color}
          size={size}
          title={av.title}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-white/60 bg-white/10 ring-2 ring-white shrink-0",
            sizeMap[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
