import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const API = 'http://localhost:5000/api/fraud'

export default function FraudTest() {
    const navigate = useNavigate()
    const [fields, setFields] = useState([])
    const [values, setValues] = useState({})
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        fetch(`${API}/model-info`)
            .then(r => r.json())
            .then(data => {
                setFields(data.ui_fields || [])
                const init = {}
                ;(data.ui_fields || []).forEach(f => {
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

    // Group fields
    const groups = {}
    fields.forEach(f => {
        if (!groups[f.group]) groups[f.group] = []
        groups[f.group].push(f)
    })

    const riskColor = result
        ? result.risk_level === 'Low' ? 'text-emerald-400'
        : result.risk_level === 'Low-Medium' ? 'text-yellow-400'
        : result.risk_level === 'Medium' ? 'text-amber-400'
        : result.risk_level === 'High' ? 'text-red-400'
        : 'text-red-500'
        : ''

    const decisionBg = result
        ? result.decision === 'APPROVE' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
        : result.decision === 'REVIEW' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
        : 'bg-red-500/15 border-red-500/30 text-red-400'
        : ''

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
                        <button onClick={() => navigate('/dashboard')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Dashboard</button>
                        <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Fraud Test</span>
                    </nav>
                </header>

                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Fraud Model Testing</h1>
                        <p className="text-neutral-500 text-sm">Test the XGBoost fraud detection model with transaction parameters. Fields left empty default to the model's missing value.</p>
                    </div>

                    {fetching ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : error && !result ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Input groups */}
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    {Object.entries(groups).map(([group, groupFields]) => (
                                        <div key={group} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">{group}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {groupFields.map(f => (
                                                    <div key={f.name}>
                                                        <label htmlFor={`fraud-${f.name}`} className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                                                        {f.type === 'select' ? (
                                                            <select
                                                                id={`fraud-${f.name}`}
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
                                                                id={`fraud-${f.name}`}
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
                                        ) : 'Run Fraud Prediction'}
                                    </button>
                                </div>

                                {/* Result panel */}
                                <div className="flex flex-col gap-4">
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 sticky top-20">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Prediction Result</p>

                                        {result ? (
                                            <div className="flex flex-col gap-4">
                                                {/* Fraud probability */}
                                                <div>
                                                    <p className="text-neutral-500 text-xs mb-1">Fraud Probability</p>
                                                    <p className={`text-4xl font-extrabold ${riskColor}`}>
                                                        {result.fraud_percentage}
                                                        <span className="text-lg text-neutral-600">%</span>
                                                    </p>
                                                    <div className="mt-2 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${
                                                                result.fraud_percentage > 50 ? 'bg-red-500' :
                                                                result.fraud_percentage > 30 ? 'bg-amber-500' :
                                                                result.fraud_percentage > 10 ? 'bg-yellow-500' : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min(result.fraud_percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Risk level */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-neutral-500">Risk Level</span>
                                                    <span className={`text-xs font-bold ${riskColor}`}>{result.risk_level}</span>
                                                </div>

                                                {/* Decision badge */}
                                                <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-bold text-sm ${decisionBg}`}>
                                                    {result.decision === 'APPROVE' && '✓'}
                                                    {result.decision === 'REVIEW' && '⚑'}
                                                    {result.decision === 'DECLINE' && '✕'}
                                                    <span>{result.decision}</span>
                                                </div>

                                                {/* Raw prediction */}
                                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-2">Raw Output</p>
                                                    <pre className="text-[11px] text-neutral-400 font-mono whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
                                                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-xs">Fill in parameters and run prediction</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">About This Model</p>
                                        <div className="space-y-2 text-xs text-neutral-500">
                                            <p>XGBoost classifier trained on the IEEE CIS Fraud Detection dataset (100K transactions).</p>
                                            <p>The model uses <span className="text-neutral-300">431 features</span> internally. Fields you leave empty are treated as unknown by the model.</p>
                                            <p>Key predictors: C4, C8, V187, V197, C12, M4, V258.</p>
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
