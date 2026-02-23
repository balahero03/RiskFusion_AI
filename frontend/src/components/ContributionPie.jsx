// ContributionPie.jsx – Recharts donut showing credit vs fraud contribution
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#f43f5e']

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm shadow-xl">
                <p className="font-semibold text-white">{payload[0].name}</p>
                <p className="text-slate-300">{payload[0].value.toFixed(1)}%</p>
            </div>
        )
    }
    return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            fontSize={13} fontWeight={700} fontFamily="Inter, sans-serif">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

export default function ContributionPie({ creditPct, fraudPct }) {
    const data = [
        { name: 'Credit Score', value: creditPct },
        { name: 'Fraud Score', value: fraudPct },
    ]

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={<CustomLabel />}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} stroke="transparent" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    formatter={(val) => (
                        <span className="text-xs text-slate-300 font-medium">{val}</span>
                    )}
                    iconType="circle"
                    iconSize={8}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
