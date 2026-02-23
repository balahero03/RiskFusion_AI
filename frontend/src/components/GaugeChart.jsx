// GaugeChart.jsx – Animated SVG semi-circle gauge for Trust Score
import { useEffect, useState } from 'react'

export default function GaugeChart({ score = 0 }) {
    const target = Math.min(Math.max(score, 0), 1)
    const [animated, setAnimated] = useState(0)
    const [displayNum, setDisplayNum] = useState(0)

    useEffect(() => {
        let start = null
        const duration = 800

        function step(timestamp) {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / duration, 1)
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setAnimated(eased * target)
            setDisplayNum(Math.round(eased * target * 100))
            if (progress < 1) requestAnimationFrame(step)
        }

        const raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [target])

    const pct = animated
    const cx = 150, cy = 140, r = 110
    const startAngle = 180
    const totalSpan = 180
    const endAngle = startAngle + totalSpan * pct

    function polarToXY(cx, cy, r, angleDeg) {
        const rad = (angleDeg * Math.PI) / 180
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    }

    const startPt = polarToXY(cx, cy, r, startAngle)
    const endPt = polarToXY(cx, cy, r, endAngle)
    const largeArc = totalSpan * pct > 90 ? 1 : 0

    // Color based on final target score (not animated pct to avoid color flicker)
    const color = target < 0.3 ? '#22c55e' : target < 0.6 ? '#f59e0b' : '#ef4444'
    const gradId = 'gauge-grad'

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 300 165" className="w-full max-w-xs select-none">
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <path
                    d={`M ${polarToXY(cx, cy, r, 180).x} ${polarToXY(cx, cy, r, 180).y}
                        A ${r} ${r} 0 0 1 ${polarToXY(cx, cy, r, 360).x} ${polarToXY(cx, cy, r, 360).y}`}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="18"
                    strokeLinecap="round"
                />

                {/* Filled arc */}
                {pct > 0.002 && (
                    <path
                        d={`M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`}
                        fill="none"
                        stroke={`url(#${gradId})`}
                        strokeWidth="18"
                        strokeLinecap="round"
                    />
                )}

                {/* Needle dot at tip */}
                {pct > 0.002 && (
                    <circle cx={endPt.x} cy={endPt.y} r="7" fill={color} />
                )}

                {/* Center count-up number */}
                <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="Inter, sans-serif">
                    {displayNum}
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="Inter, sans-serif">
                    Trust Score %
                </text>
            </svg>
        </div>
    )
}
