"use client"

import { useMemo } from "react"

interface ChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: ChartData[]
  title?: string
  height?: number
  showValues?: boolean
  animated?: boolean
}

interface DonutChartProps {
  data: ChartData[]
  title?: string
  size?: number
  showLegend?: boolean
}

interface LineChartProps {
  data: ChartData[]
  title?: string
  height?: number
  color?: string
  showPoints?: boolean
}

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  color?: string
  showPercentage?: boolean
  size?: "sm" | "md" | "lg"
}

const defaultColors = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
]

export function BarChart({
  data,
  title,
  height = 200,
  showValues = true,
  animated = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-400 mb-4">{title}</h4>
      )}
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100
          const color = item.color || defaultColors[index % defaultColors.length]

          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="relative w-full flex justify-center">
                {showValues && (
                  <span className="text-xs text-gray-400 mb-1">
                    {item.value}
                  </span>
                )}
              </div>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${
                  animated ? "animate-grow-up" : ""
                }`}
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: item.value > 0 ? 4 : 0,
                }}
              />
              <span className="text-xs text-gray-500 text-center truncate w-full px-1">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DonutChart({
  data,
  title,
  size = 160,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const getCoordinates = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent)
    const y = Math.sin(2 * Math.PI * percent)
    return [x, y]
  }

  const segments = useMemo(() => {
    const result: Array<{
      label: string
      value: number
      color: string
      pathData: string
      percent: number
    }> = []
    let cumulative = 0
    
    for (let index = 0; index < data.length; index++) {
      const item = data[index]
      const percent = total > 0 ? item.value / total : 0
      const startPercent = cumulative
      const endPercent = cumulative + percent
      cumulative = endPercent

      const [startX, startY] = getCoordinates(startPercent - 0.25)
      const [endX, endY] = getCoordinates(endPercent - 0.25)

      const largeArcFlag = percent > 0.5 ? 1 : 0
      const color = item.color || defaultColors[index % defaultColors.length]

      const pathData =
        percent === 1
          ? `M 0 -1 A 1 1 0 1 1 0 1 A 1 1 0 1 1 0 -1`
          : `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`

      result.push({
        ...item,
        pathData,
        color,
        percent,
      })
    }
    return result
  }, [data, total])

  return (
    <div className="flex flex-col items-center gap-4">
      {title && (
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="-1.1 -1.1 2.2 2.2"
          style={{ width: size, height: size, transform: "rotate(-90deg)" }}
        >
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            />
          ))}
          {/* Inner circle for donut effect */}
          <circle cx="0" cy="0" r="0.6" fill="#1f2937" />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-gray-400">Total</span>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3">
          {segments.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400">
                {item.label} ({item.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function LineChart({
  data,
  title,
  height = 150,
  color = "#3b82f6",
  showPoints = true,
}: LineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const minValue = Math.min(...data.map((d) => d.value), 0)
  const range = maxValue - minValue || 1

  const points = data.map((item, index) => ({
    x: (index / Math.max(data.length - 1, 1)) * 100,
    y: 100 - ((item.value - minValue) / range) * 100,
    ...item,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  const areaD = `${pathD} L 100 100 L 0 100 Z`

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-400 mb-4">{title}</h4>
      )}
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient fill under line */}
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#lineGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {showPoints &&
            points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="1.5"
                fill={color}
                className="transition-all hover:r-3"
              />
            ))}
        </svg>
      </div>
      <div className="flex justify-between mt-2">
        {data.map((item, i) => (
          <span
            key={i}
            className="text-xs text-gray-500 truncate"
            style={{ maxWidth: `${100 / data.length}%` }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ProgressBar({
  value,
  max = 100,
  label,
  color,
  showPercentage = true,
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const barColor = color || (percentage >= 75 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444")

  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size]

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  )
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon,
  color = "blue",
}: {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
  color?: "blue" | "purple" | "green" | "amber" | "red"
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
  }

  const changeColor = {
    positive: "text-green-400",
    negative: "text-red-400",
    neutral: "text-gray-400",
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {change && (
        <div className={`text-sm ${changeColor[changeType || "neutral"]}`}>
          {changeType === "positive" && "↑ "}
          {changeType === "negative" && "↓ "}
          {change}
        </div>
      )}
    </div>
  )
}

// CSS animation for bar chart
const styleSheet = `
@keyframes grow-up {
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
    transform-origin: bottom;
  }
}
.animate-grow-up {
  animation: grow-up 0.7s ease-out;
}
`

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = styleSheet
  document.head.appendChild(style)
}
