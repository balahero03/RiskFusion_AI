import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const API_FRAUD  = 'http://localhost:5000/api/fraud'
const API_CREDIT = 'http://localhost:5000/api/credit'
const API_FUSION = 'http://localhost:5000/api/fusion'

const CONTEXTS = [
    { key: 'loan',        label: 'Loan Approval',        creditW: 70, fraudW: 30 },
    { key: 'transaction', label: 'Transaction Auth.',     creditW: 40, fraudW: 60 },
    { key: 'limit',       label: 'Credit Limit Increase', creditW: 50, fraudW: 50 },
]

const riskColor = (level) => ({
    Low:          'text-emerald-400',
    'Low-Medium': 'text-yellow-400',
    Medium:       'text-amber-400',
    High:         'text-red-400',
    'Very High':  'text-red-500',
}[level] ?? 'text-neutral-400')

const barColor = (pct) => {
    if (pct > 65) return 'bg-red-500'
    if (pct > 45) return 'bg-amber-500'
    if (pct > 25) return 'bg-yellow-500'
    return 'bg-emerald-500'
}

const decisionStyle = (d) => ({
    APPROVE: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    REVIEW:  'bg-amber-500/15  border-amber-500/30  text-amber-400',
    DECLINE: 'bg-red-500/15   border-red-500/30   text-red-400',
}[d] ?? 'bg-neutral-800 border-neutral-700 text-neutral-300')

const decisionIcon = (d) => ({ APPROVE: '✓', REVIEW: '⚑', DECLINE: '✕' }[d] ?? '?')

function ScoreGauge({ label, pct, color }) {
    const angle = -140 + (pct / 100) * 280
    const r = 52
    const cx = 70, cy = 70
    const toRad = (deg) => (deg * Math.PI) / 180
    const arcFrom = (deg) => ({
        x: cx + r * Math.cos(toRad(deg - 90)),
        y: cy + r * Math.sin(toRad(deg - 90)),
    })
    const p1 = arcFrom(-140), p2 = arcFrom(-140 + (pct / 100) * 280)
    const large = (pct / 100) * 280 > 180 ? 1 : 0
    return (
        <div className="flex flex-col items-center gap-1">
            <svg viewBox="0 0 140 100" className="w-28 h-20 overflow-visible">
                <path d={`M ${arcFrom(-140).x} ${arcFrom(-140).y} A ${r} ${r} 0 1 1 ${arcFrom(140).x} ${arcFrom(140).y}`}
                    fill="none" stroke="#262626" strokeWidth="10" strokeLinecap="round" />
                {pct > 0 && (
                    <path d={`M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`}
                        fill="none" stroke="currentColor"
                        className={color.replace('text-', 'text-').includes('emerald') ? 'stroke-emerald-400' :
                            color.includes('amber') ? 'stroke-amber-400' :
                            color.includes('yellow') ? 'stroke-yellow-400' :
                            color.includes('red-4') ? 'stroke-red-400' : 'stroke-red-500'}
                        strokeWidth="10" strokeLinecap="round" />
                )}
                <text x={cx} y={cy + 18} textAnchor="middle" className="fill-white font-bold" fontSize="22">{pct}%</text>
            </svg>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">{label}</span>
        </div>
    )
}

function FieldGroup({ group, fields, values, prefix, onChange }) {
    return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">{group}</p>
            <div className="grid grid-cols-2 gap-2.5">
                {fields.map(f => (
                    <div key={f.name}>
                        <label htmlFor={`${prefix}-${f.name}`} className="block text-[11px] font-semibold text-neutral-400 mb-1 uppercase tracking-wide">
                            {f.label}
                        </label>
                        {f.type === 'select' ? (
                            <select
                                id={`${prefix}-${f.name}`}
                                value={values[f.name] ?? ''}
                                onChange={e => onChange(f.name, e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neutral-500 transition-colors appearance-none cursor-pointer"
                            >
                                {f.options.map(o => (
                                    <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={`${prefix}-${f.name}`}
                                type="number"
                                step="any"
                                placeholder={f.placeholder}
                                value={values[f.name] ?? ''}
                                onChange={e => onChange(f.name, e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-1.5 placeholder-neutral-600 text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function FusionTest() {
    const navigate = useNavigate()
    const [fraudFields, setFraudFields]   = useState([])
    const [creditFields, setCreditFields] = useState([])
    const [values, setValues]             = useState({})
    const [context, setContext]           = useState('loan')
    const [result, setResult]             = useState(null)
    const [loading, setLoading]           = useState(false)
    const [error, setError]               = useState(null)
    const [fetching, setFetching]         = useState(true)
    const [activeModel, setActiveModel]   = useState('fraud')

    useEffect(() => {
        Promise.all([
            fetch(`${API_FRAUD}/model-info`).then(r => r.json()),
            fetch(`${API_CREDIT}/model-info`).then(r => r.json()),
        ]).then(([fraudData, creditData]) => {
            const ff = fraudData.ui_fields || []
            const cf = creditData.ui_fields || []
            setFraudFields(ff)
            setCreditFields(cf)
            const init = {}
            ff.forEach(f => { init[f.name] = f.type === 'select' ? (f.options?.[0]?.value ?? '') : '' })
            cf.forEach(f => { init[f.name] = f.type === 'select' ? (f.options?.[0]?.value ?? '') : '' })
            setValues(init)
            setFetching(false)
        }).catch(() => {
            setError('Cannot connect to backend. Make sure Flask server is running on port 5000.')
            setFetching(false)
        })
    }, [])

    function handleChange(name, val) {
        setValues(prev => ({ ...prev, [name]: val }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setResult(null)
        setError(null)
        try {
            const body = { context }
            for (const [k, v] of Object.entries(values)) {
                if (v !== '' && v !== null && v !== undefined) body[k] = Number(v)
            }
            const res  = await fetch(`${API_FUSION}/predict`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setResult(data)
        } catch (err) {
            setError(err.message || 'Prediction failed')
        } finally {
            setLoading(false)
        }
    }

    // Group fields
    const fraudGroups  = {}
    fraudFields.forEach(f => { if (!fraudGroups[f.group])  fraudGroups[f.group]  = []; fraudGroups[f.group].push(f) })
    const creditGroups = {}
    creditFields.forEach(f => { if (!creditGroups[f.group]) creditGroups[f.group] = []; creditGroups[f.group].push(f) })

    const selectedCtx = CONTEXTS.find(c => c.key === context) ?? CONTEXTS[0]

    return (
        <PageWrapper>
            <div className="min-h-screen bg-black">
                {/* Header */}
                <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-md z-20">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-base tracking-tight">Risk<span className="text-neutral-400">Fusion</span></span>
                    </div>
                    <nav className="flex items-center gap-1">
                        <button onClick={() => navigate('/dashboard')}   className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Dashboard</button>
                        <button onClick={() => navigate('/fraud-test')}  className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fraud Test</button>
                        <button onClick={() => navigate('/credit-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Credit Test</button>
                        <button onClick={() => navigate('/model-data')}  className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Fusion Test</span>
                    </nav>
                </header>

                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Title */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Live Fusion
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Fusion Risk Analysis</h1>
                        <p className="text-neutral-500 text-sm">
                            Runs both XGBoost models simultaneously and fuses their outputs into a single weighted risk score.
                        </p>
                    </div>

                    {/* Context selector */}
                    <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Evaluation Context</p>
                        <div className="flex flex-wrap gap-2">
                            {CONTEXTS.map(c => (
                                <button
                                    key={c.key}
                                    onClick={() => setContext(c.key)}
                                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                        context === c.key
                                            ? 'bg-white text-black border-white'
                                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200'
                                    }`}
                                >
                                    {c.label}
                                    <span className={`ml-2 text-[10px] font-normal ${context === c.key ? 'text-neutral-600' : 'text-neutral-600'}`}>
                                        {c.creditW}% credit · {c.fraudW}% fraud
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {fetching ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : error && !result ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                                {/* Left: inputs */}
                                <div className="xl:col-span-2 flex flex-col gap-4">
                                    {/* Model tabs */}
                                    <div className="flex gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1 w-fit">
                                        <button type="button" onClick={() => setActiveModel('fraud')}
                                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeModel === 'fraud' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
                                            Fraud Signals
                                        </button>
                                        <button type="button" onClick={() => setActiveModel('credit')}
                                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeModel === 'credit' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
                                            Credit Signals
                                        </button>
                                    </div>

                                    {activeModel === 'fraud'
                                        ? Object.entries(fraudGroups).map(([group, fields]) => (
                                            <FieldGroup key={group} group={group} fields={fields} values={values} prefix="f" onChange={handleChange} />
                                        ))
                                        : Object.entries(creditGroups).map(([group, fields]) => (
                                            <FieldGroup key={group} group={group} fields={fields} values={values} prefix="c" onChange={handleChange} />
                                        ))
                                    }

                                    <button
                                        id="fusion-predict-btn"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                                                Running Fusion Analysis…
                                            </>
                                        ) : '⚡ Run Fusion Analysis'}
                                    </button>
                                </div>

                                {/* Right: results */}
                                <div className="flex flex-col gap-4">
                                    {/* Fusion score card */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 sticky top-20">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Fusion Result</p>

                                        {result ? (
                                            <div className="flex flex-col gap-5">
                                                {/* Gauges row */}
                                                <div className="flex justify-around gap-2">
                                                    <ScoreGauge label="Fraud" pct={Math.round(result.fraud_percentage)} color={riskColor(result.risk_level)} />
                                                    <ScoreGauge label="Credit" pct={Math.round(result.credit_percentage)} color={riskColor(result.risk_level)} />
                                                </div>

                                                {/* Fusion score hero */}
                                                <div className="text-center py-2 border-y border-neutral-800">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Fusion Risk Score</p>
                                                    <p className={`text-5xl font-extrabold ${riskColor(result.risk_level)}`}>
                                                        {result.fusion_percentage}<span className="text-2xl text-neutral-600">%</span>
                                                    </p>
                                                    <div className="mt-3 mx-4 bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${barColor(result.fusion_percentage)}`}
                                                            style={{ width: `${Math.min(result.fusion_percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Risk level */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-neutral-500">Risk Level</span>
                                                    <span className={`text-xs font-bold ${riskColor(result.risk_level)}`}>{result.risk_level}</span>
                                                </div>

                                                {/* Weight breakdown */}
                                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2">
                                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-1">Applied Weights</p>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-neutral-400">Credit</span>
                                                        <span className="text-neutral-200 font-bold font-mono">{Math.round(result.credit_weight * 100)}%</span>
                                                    </div>
                                                    <div className="flex h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-white rounded-l-full" style={{ width: `${result.credit_weight * 100}%` }} />
                                                        <div className="bg-neutral-600 rounded-r-full" style={{ width: `${result.fraud_weight * 100}%` }} />
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-neutral-500">Fraud</span>
                                                        <span className="text-neutral-400 font-bold font-mono">{Math.round(result.fraud_weight * 100)}%</span>
                                                    </div>
                                                </div>

                                                {/* Decision badge */}
                                                <div id="fusion-decision-badge" className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border font-bold text-sm ${decisionStyle(result.decision)}`}>
                                                    <span className="text-base">{decisionIcon(result.decision)}</span>
                                                    <span>{result.decision}</span>
                                                </div>

                                                {/* Individual scores */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
                                                        <p className="text-[10px] text-neutral-600 uppercase mb-1">Fraud Prob</p>
                                                        <p className="text-sm font-bold text-white font-mono">{result.fraud_percentage}%</p>
                                                    </div>
                                                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
                                                        <p className="text-[10px] text-neutral-600 uppercase mb-1">Credit Prob</p>
                                                        <p className="text-sm font-bold text-white font-mono">{result.credit_percentage}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-neutral-700">
                                                <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                                                </svg>
                                                <p className="text-xs text-center">Fill in fraud &amp; credit signals, then run analysis</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Weight matrix info */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Fusion Weight Matrix</p>
                                        <div className="space-y-2">
                                            {CONTEXTS.map(c => (
                                                <div key={c.key} className={`bg-neutral-900/60 rounded-lg p-3 border transition-colors ${context === c.key ? 'border-white/20' : 'border-neutral-800'}`}>
                                                    <p className={`text-xs font-semibold mb-2 ${context === c.key ? 'text-white' : 'text-neutral-400'}`}>{c.label}</p>
                                                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                                                        <div className="rounded-l-full bg-white" style={{ width: `${c.creditW}%` }} />
                                                        <div className="rounded-r-full bg-neutral-600" style={{ width: `${c.fraudW}%` }} />
                                                    </div>
                                                    <div className="flex justify-between mt-1.5 text-[10px] text-neutral-500">
                                                        <span className="text-neutral-400 font-medium">{c.creditW}% Credit</span>
                                                        <span>{c.fraudW}% Fraud</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </PageWrapper>
    )
}
