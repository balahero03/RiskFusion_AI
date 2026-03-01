import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const API = 'http://localhost:5000/api/demo'

const CONTEXTS = [
    { key: 'loan', label: 'Loan Approval', icon: '🏠', desc: 'Evaluate creditworthiness for a new loan application' },
    { key: 'transaction', label: 'Transaction Authorization', icon: '💳', desc: 'Verify a high-value transaction for fraud signals' },
    { key: 'limit', label: 'Credit Limit Review', icon: '📊', desc: 'Assess eligibility for a credit limit increase' },
]

const RISK_COLORS = {
    Low: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
    'Low-Medium': { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', bar: 'bg-yellow-500', dot: 'bg-yellow-400' },
    Medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', bar: 'bg-amber-500', dot: 'bg-amber-400' },
    High: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', bar: 'bg-red-400', dot: 'bg-red-400' },
    'Very High': { text: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/30', bar: 'bg-red-500', dot: 'bg-red-500' },
}
const PROFILE_COLORS = {
    Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/20  text-amber-400  border-amber-500/30',
    High: 'bg-red-500/20    text-red-400    border-red-500/30',
}
const SEVERITY_COLORS = {
    low: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/5  border-emerald-500/20' },
    medium: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/5   border-amber-500/20' },
    high: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/5     border-red-500/20' },
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
function maskAcc(acc) { return acc.slice(0, 4) + '•'.repeat(Math.max(0, acc.length - 8)) + acc.slice(-4) }

function ScoreBar({ label, pct, color }) {
    const [w, setW] = useState(0)
    useEffect(() => { const t = setTimeout(() => setW(pct), 80); return () => clearTimeout(t) }, [pct])
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-neutral-400">{label}</span>
                <span className={`text-xs font-bold font-mono ${color}`}>{pct}%</span>
            </div>
            <div className="bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${pct > 65 ? 'bg-red-500' : pct > 45 ? 'bg-amber-500' : pct > 25 ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`} style={{ width: `${w}%` }} />
            </div>
        </div>
    )
}

export default function DemoMode() {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState([])
    const [selected, setSelected] = useState(null)
    const [context, setContext] = useState('loan')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetch(`${API}/customers`)
            .then(r => r.json())
            .then(d => { setCustomers(d); setFetching(false) })
            .catch(() => { setError('Cannot connect to backend.'); setFetching(false) })
    }, [])

    async function runAssessment() {
        if (!selected) return
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch(`${API}/assess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: selected.customer_id, context }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.account_number.toLowerCase().includes(search.toLowerCase()) ||
        c.bank_name.toLowerCase().includes(search.toLowerCase())
    )

    const rc = result ? (RISK_COLORS[result.risk_level] ?? RISK_COLORS['Medium']) : null

    return (
        <PageWrapper>
            <div className="min-h-screen bg-black">
                {/* Header */}
                <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-md z-30">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-white text-sm tracking-tight">Risk<span className="text-neutral-400">Fusion</span></span>
                            <span className="ml-2 text-[10px] text-neutral-600 font-medium uppercase tracking-wider">Internal Risk Portal</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">⚠ Internal Use Only</span>
                        <nav className="flex items-center gap-1 ml-3">
                            <button onClick={() => navigate('/fraud-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fraud</button>
                            <button onClick={() => navigate('/credit-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Credit</button>
                            <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Models</button>
                            <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Demo</span>
                        </nav>
                    </div>
                </header>

                {/* Banner */}
                <div className="bg-neutral-950 border-b border-neutral-800/60 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-neutral-400">RiskFusion AI Engine <span className="text-neutral-600">·</span> XGBoost Fusion Model <span className="text-neutral-600">·</span> 20 customer profiles loaded</span>
                    </div>
                    <span className="text-[10px] text-neutral-600 font-mono">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* ── LEFT: Customer selector + Context ── */}
                    <div className="xl:col-span-2 flex flex-col gap-5">

                        {/* Step 1 */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                                <p className="text-sm font-semibold text-white">Select Account Holder</p>
                                {selected && <span className="ml-auto text-[10px] text-emerald-400 font-semibold">✓ Selected</span>}
                            </div>
                            {/* Search */}
                            <input
                                type="text"
                                placeholder="Search by name, account or bank…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full mb-3 bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                            />
                            {fetching ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scroll">
                                    {filtered.map(c => {
                                        const isSelected = selected?.customer_id === c.customer_id
                                        const profileCls = PROFILE_COLORS[c.risk_profile] ?? PROFILE_COLORS.Medium
                                        return (
                                            <button
                                                key={c.customer_id}
                                                onClick={() => { setSelected(c); setResult(null) }}
                                                className={`text-left rounded-xl border p-4 transition-all duration-200 ${isSelected
                                                        ? 'bg-white/[0.06] border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]'
                                                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/60'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Avatar */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${c.risk_profile === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            c.risk_profile === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {initials(c.name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                                                            <span className={`shrink-0 text-[9px] font-bold border rounded-full px-2 py-0.5 ${profileCls}`}>{c.risk_profile}</span>
                                                        </div>
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">{c.bank_name} · {maskAcc(c.account_number)}</p>
                                                        <p className="text-[10px] text-neutral-600 mt-1">{c.account_type} · {c.occupation} · {c.age}y</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="text-[10px] text-neutral-400 font-mono">{fmt(c.income)}/yr</span>
                                                            <span className="text-[10px] text-neutral-600">|</span>
                                                            <span className="text-[10px] text-neutral-400 font-mono">Loan: {fmt(c.loan_amount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 2 */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                                <p className="text-sm font-semibold text-white">Assessment Reason</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {CONTEXTS.map(c => (
                                    <button
                                        key={c.key}
                                        onClick={() => { setContext(c.key); setResult(null) }}
                                        className={`text-left rounded-xl border p-4 transition-all ${context === c.key
                                                ? 'bg-white/[0.06] border-white/30'
                                                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600'
                                            }`}
                                    >
                                        <span className="text-xl">{c.icon}</span>
                                        <p className={`text-xs font-semibold mt-2 ${context === c.key ? 'text-white' : 'text-neutral-300'}`}>{c.label}</p>
                                        <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">{c.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Run button */}
                        <button
                            id="demo-assess-btn"
                            onClick={runAssessment}
                            disabled={!selected || loading}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />Running AI Risk Assessment…</>
                            ) : !selected ? '← Select an account holder to continue' : `⚡ Run Risk Assessment · ${CONTEXTS.find(c => c.key === context)?.label}`}
                        </button>
                    </div>

                    {/* ── RIGHT: Profile + Results ── */}
                    <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">

                        {/* Customer profile card */}
                        {selected ? (
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Account Profile</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${selected.risk_profile === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                                            selected.risk_profile === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                        }`}>{initials(selected.name)}</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selected.name}</p>
                                        <p className="text-[11px] text-neutral-500">{selected.bank_name}</p>
                                        <p className="text-[10px] text-neutral-600 font-mono mt-0.5">{maskAcc(selected.account_number)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        ['Age', `${selected.age} years, ${selected.gender}`],
                                        ['Income', fmt(selected.income) + '/yr'],
                                        ['Loan Req.', fmt(selected.loan_amount)],
                                        ['Employment', `${selected.employment_years}y`],
                                        ['Education', selected.education],
                                        ['Occupation', selected.occupation],
                                        ['Avg Score', selected.ext_score_avg.toFixed(2)],
                                        ['Late Pmts', selected.late_installments],
                                        ['Overdue', `${selected.bureau_max_overdue}d max`],
                                        ['CC Util.', `${Math.round(selected.cc_utilization * 100)}%`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="bg-neutral-900 rounded-lg p-2.5">
                                            <p className="text-[9px] text-neutral-600 uppercase tracking-wide mb-0.5">{k}</p>
                                            <p className="text-neutral-200 font-medium truncate">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-neutral-950 border border-neutral-800 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-neutral-700">
                                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-xs text-center">No account selected</p>
                            </div>
                        )}

                        {/* Results panel */}
                        {result && rc && (
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Assessment Report</p>
                                    <span className="text-[10px] text-neutral-600 font-mono">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Fusion score hero */}
                                <div className={`rounded-xl p-4 border ${rc.bg} ${rc.border} text-center`}>
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Fusion Risk Score</p>
                                    <p className={`text-5xl font-black ${rc.text}`}>{result.fusion_percentage}<span className="text-2xl opacity-50">%</span></p>
                                    <div className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider ${rc.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                                        {result.risk_level} Risk
                                    </div>
                                </div>

                                {/* Decision badge */}
                                <div id="demo-decision" className={`flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-base border ${result.decision === 'APPROVE' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                                        result.decision === 'REVIEW' ? 'bg-amber-500/15  border-amber-500/30  text-amber-400' :
                                            'bg-red-500/15    border-red-500/30    text-red-400'
                                    }`}>
                                    <span className="text-lg">{result.decision === 'APPROVE' ? '✓' : result.decision === 'REVIEW' ? '⚑' : '✕'}</span>
                                    {result.decision}
                                </div>

                                {/* Score breakdown */}
                                <div className="space-y-3">
                                    <ScoreBar label={`Fraud Risk (${Math.round(result.fraud_weight * 100)}% weight)`} pct={result.fraud_percentage} color={rc.text} />
                                    <ScoreBar label={`Credit Default Risk (${Math.round(result.credit_weight * 100)}% weight)`} pct={result.credit_percentage} color={rc.text} />
                                    <ScoreBar label="Weighted Fusion Score" pct={result.fusion_percentage} color={rc.text} />
                                </div>

                                {/* Risk factors */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Key Risk Factors</p>
                                    <div className="space-y-1.5">
                                        {result.risk_factors.map((f, i) => {
                                            const sc = SEVERITY_COLORS[f.severity] ?? SEVERITY_COLORS.medium
                                            return (
                                                <div key={i} className={`flex items-start gap-2.5 rounded-lg p-3 border ${sc.bg}`}>
                                                    <span className={`w-2 h-2 rounded-full ${sc.dot} shrink-0 mt-0.5`} />
                                                    <div>
                                                        <p className={`text-[11px] font-semibold ${sc.text}`}>{f.label}</p>
                                                        <p className="text-[10px] text-neutral-500 mt-0.5">{f.detail}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Context info */}
                                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-600">
                                    <span>Assessment: {CONTEXTS.find(c => c.key === result.context)?.label}</span>
                                    <span>Credit {Math.round(result.credit_weight * 100)}% · Fraud {Math.round(result.fraud_weight * 100)}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}
