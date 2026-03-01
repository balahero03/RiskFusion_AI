import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const API = 'http://localhost:5000/api/credit'

// Risk colours matching the existing design system
const riskColor = (level) => {
    switch (level) {
        case 'Low': return 'text-emerald-400'
        case 'Low-Medium': return 'text-yellow-400'
        case 'Medium': return 'text-amber-400'
        case 'High': return 'text-red-400'
        case 'Very High': return 'text-red-500'
        default: return 'text-neutral-400'
    }
}

const barColor = (pct) => {
    if (pct > 69) return 'bg-red-500'
    if (pct > 40) return 'bg-amber-500'
    if (pct > 20) return 'bg-yellow-500'
    return 'bg-emerald-500'
}

const decisionStyle = (decision) => {
    if (decision === 'APPROVE') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
    if (decision === 'REVIEW') return 'bg-amber-500/15  border-amber-500/30  text-amber-400'
    return 'bg-red-500/15 border-red-500/30 text-red-400'
}

const decisionIcon = (decision) => {
    if (decision === 'APPROVE') return '✓'
    if (decision === 'REVIEW') return '⚑'
    return '✕'
}

export default function CreditTest() {
    const navigate = useNavigate()
    const [fields, setFields] = useState([])
    const [values, setValues] = useState({})
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fetching, setFetching] = useState(true)
    const [modelInfo, setModelInfo] = useState(null)

    useEffect(() => {
        fetch(`${API}/model-info`)
            .then(r => r.json())
            .then(data => {
                setFields(data.ui_fields || [])
                setModelInfo(data)
                const init = {}
                    ; (data.ui_fields || []).forEach(f => {
                        init[f.name] = f.type === 'select' ? (f.options?.[0]?.value ?? '') : ''
                    })
                setValues(init)
                setFetching(false)
            })
            .catch(() => {
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
            const body = {}
            for (const [k, v] of Object.entries(values)) {
                if (v !== '' && v !== null && v !== undefined) {
                    body[k] = Number(v)
                }
            }

            const res = await fetch(`${API}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
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

    // Group fields by their group property
    const groups = {}
    fields.forEach(f => {
        if (!groups[f.group]) groups[f.group] = []
        groups[f.group].push(f)
    })

    const metrics = modelInfo?.metrics || {}

    return (
        <PageWrapper>
            <div className="min-h-screen bg-black">
                {/* ── Header ─────────────────────────────────────── */}
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
                        <button onClick={() => navigate('/dashboard')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Dashboard</button>
                        <button onClick={() => navigate('/fraud-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fraud Test</button>
                        <button onClick={() => navigate('/fusion-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fusion Test</button>
                        <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Credit Test</span>
                    </nav>
                </header>

                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* ── Page title ─────────────────────────────── */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-white mb-1">Credit Default Risk Testing</h1>
                        <p className="text-neutral-500 text-sm">
                            Test the XGBoost credit scoring model trained on Home Credit Default Risk data (307K applicants).
                            Fields left empty are treated as unknown by the model.
                        </p>
                    </div>

                    {/* ── Model stats strip ──────────────────────── */}
                    {modelInfo && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'ROC-AUC', value: metrics.roc_auc?.toFixed(4) ?? '—' },
                                { label: 'Threshold', value: metrics.threshold ?? modelInfo.threshold },
                                { label: 'Precision', value: metrics.precision_class1?.toFixed(3) ?? '—' },
                                { label: 'Recall', value: metrics.recall_class1?.toFixed(3) ?? '—' },
                            ].map(s => (
                                <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1">
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{s.label}</p>
                                    <p className="text-xl font-extrabold text-white font-mono">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Main area ──────────────────────────────── */}
                    {fetching ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : error && !result ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* ── Left: Input groups ─────────── */}
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    {Object.entries(groups).map(([group, groupFields]) => (
                                        <div key={group} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">{group}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {groupFields.map(f => (
                                                    <div key={f.name}>
                                                        <label
                                                            htmlFor={`credit-${f.name}`}
                                                            className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide"
                                                        >
                                                            {f.label}
                                                        </label>
                                                        {f.type === 'select' ? (
                                                            <select
                                                                id={`credit-${f.name}`}
                                                                value={values[f.name] ?? ''}
                                                                onChange={e => handleChange(f.name, e.target.value)}
                                                                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 transition-colors appearance-none cursor-pointer"
                                                            >
                                                                {f.options.map(o => (
                                                                    <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                id={`credit-${f.name}`}
                                                                type="number"
                                                                step="any"
                                                                placeholder={f.placeholder}
                                                                value={values[f.name] ?? ''}
                                                                onChange={e => handleChange(f.name, e.target.value)}
                                                                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-lg px-3 py-2 placeholder-neutral-600 text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                                                Running prediction…
                                            </>
                                        ) : 'Run Credit Risk Prediction'}
                                    </button>
                                </div>

                                {/* ── Right: Result panel ────────── */}
                                <div className="flex flex-col gap-4">
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 sticky top-20">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Prediction Result</p>

                                        {result ? (
                                            <div className="flex flex-col gap-4">
                                                {/* Default probability */}
                                                <div>
                                                    <p className="text-neutral-500 text-xs mb-1">Default Probability</p>
                                                    <p className={`text-4xl font-extrabold ${riskColor(result.risk_level)}`}>
                                                        {result.default_percentage}
                                                        <span className="text-lg text-neutral-600">%</span>
                                                    </p>
                                                    <div className="mt-2 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${barColor(result.default_percentage)}`}
                                                            style={{ width: `${Math.min(result.default_percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Risk level */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-neutral-500">Risk Level</span>
                                                    <span className={`text-xs font-bold ${riskColor(result.risk_level)}`}>{result.risk_level}</span>
                                                </div>

                                                {/* Threshold */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-neutral-500">Threshold Used</span>
                                                    <span className="text-xs font-bold text-neutral-300 font-mono">{result.threshold_used}</span>
                                                </div>

                                                {/* Decision badge */}
                                                <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-bold text-sm ${decisionStyle(result.decision)}`}>
                                                    <span>{decisionIcon(result.decision)}</span>
                                                    <span>{result.decision}</span>
                                                </div>

                                                {/* Raw output */}
                                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-2">Raw Output</p>
                                                    <pre className="text-[11px] text-neutral-400 font-mono whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
                                                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-xs text-center">Fill in applicant fields and run prediction</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* About this model */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">About This Model</p>
                                        <div className="space-y-2 text-xs text-neutral-500">
                                            <p>XGBoost classifier trained on the <span className="text-neutral-300">Home Credit Default Risk</span> Kaggle dataset (~307K loan applications).</p>
                                            <p>The model uses <span className="text-neutral-300">{modelInfo?.feature_count ?? 146} engineered features</span> internally. Missing fields are handled as NaN.</p>
                                            <p>Tuned threshold <span className="text-neutral-300">{modelInfo?.threshold ?? 0.69}</span> was optimised via Optuna over 5 CV folds to maximise F1 for the minority default class.</p>
                                            <p>Key signals: <span className="text-neutral-300">EXT_SOURCE_1–3, AMT_CREDIT, bureau debt ratios, installment delays.</span></p>
                                        </div>
                                    </div>

                                    {/* Decision guide */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Decision Guide</p>
                                        <div className="space-y-2">
                                            {[
                                                { range: '0 – 20%', label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-400', decision: 'APPROVE' },
                                                { range: '20 – 40%', label: 'Low-Medium', color: 'bg-yellow-500', text: 'text-yellow-400', decision: 'REVIEW' },
                                                { range: '40 – 69%', label: 'Medium', color: 'bg-amber-500', text: 'text-amber-400', decision: 'REVIEW' },
                                                { range: '69 – 80%', label: 'High', color: 'bg-red-400', text: 'text-red-400', decision: 'DECLINE' },
                                                { range: '80 – 100%', label: 'Very High', color: 'bg-red-500', text: 'text-red-500', decision: 'DECLINE' },
                                            ].map(r => (
                                                <div key={r.label} className="flex items-center justify-between bg-neutral-900/50 rounded-lg px-3 py-2 border border-neutral-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${r.color}`} />
                                                        <span className={`text-xs font-semibold ${r.text}`}>{r.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                                                        <span>{r.range}</span>
                                                        <span className="text-neutral-700">→</span>
                                                        <span className="text-neutral-300 font-medium">{r.decision}</span>
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
