import { colorHex, type ColorKey } from "@/app/webs/_shared/lib/colors"

interface SparklineProps {
  data: number[]
  colorKey: ColorKey
  width?: number
  height?: number
  filled?: boolean
}

export function Sparkline({ data, colorKey, width = 80, height = 28, filled = true }: SparklineProps) {
  if (data.length < 2) return null

  const hex = colorHex[colorKey]
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${height} L 0,${height} Z`
  const lastPt = pts[pts.length - 1]
  const gradId = `spark-${colorKey}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {filled && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hex} stopOpacity="0.3" />
            <stop offset="100%" stopColor={hex} stopOpacity="0.02" />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path
        d={linePath}
        fill="none"
        stroke={hex}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={hex} />
    </svg>
  )
}
