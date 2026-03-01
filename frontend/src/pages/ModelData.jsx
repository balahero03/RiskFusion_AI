import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const API = 'http://localhost:5000/api/fraud'

export default function ModelData() {
    const navigate = useNavigate()
    const [info, setInfo] = useState(null)
    const [metrics, setMetrics] = useState(null)
    const [loadingInfo, setLoadingInfo] = useState(true)
    const [loadingMetrics, setLoadingMetrics] = useState(false)
    const [error, setError] = useState(null)
    const [tab, setTab] = useState('fraud')

    useEffect(() => {
        fetch(`${API}/model-info`)
            .then(r => r.json())
            .then(data => { setInfo(data); setLoadingInfo(false) })
            .catch(() => { setError('Cannot connect to backend'); setLoadingInfo(false) })
    }, [])

    function loadMetrics() {
        setLoadingMetrics(true)
        fetch(`${API}/evaluate`)
            .then(r => r.json())
            .then(data => { setMetrics(data); setLoadingMetrics(false) })
            .catch(() => { setLoadingMetrics(false) })
    }

    const maxImp = info?.top_features?.[0]?.importance || 1

    return (
        <PageWrapper>
            <div className="min-h-screen bg-black">
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
                        <button onClick={() => navigate('/credit-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Credit Test</button>
                        <button onClick={() => navigate('/fusion-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fusion Test</button>
                        <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Model Data</span>
                    </nav>
                </header>

                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-white mb-1">Model Data</h1>
                        <p className="text-neutral-500 text-sm">Architecture, parameters, accuracy, and feature analysis.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-neutral-950 border border-neutral-800 rounded-lg p-1 w-fit">
                        <button
                            onClick={() => setTab('fraud')}
                            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${tab === 'fraud' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >Fraud Model</button>
                        <button
                            onClick={() => setTab('credit')}
                            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${tab === 'credit' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >Credit Model</button>
                        <button
                            onClick={() => setTab('fusion')}
                            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${tab === 'fusion' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >Fusion Engine</button>
                    </div>

                    {tab === 'fusion' ? (
                        <FusionModelPanel navigate={navigate} />
                    ) : tab === 'credit' ? (
                        <CreditModelPanel navigate={navigate} />
                    ) : loadingInfo ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
                    ) : info ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                            {/* Left column: Model info + Hyperparameters */}
                            <div className="flex flex-col gap-5">
                                {/* Model overview */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Model Overview</p>
                                    <div className="space-y-3">
                                        {[
                                            ['Type', info.model_type],
                                            ['Features', `${info.feature_count} columns`],
                                            ['Training Data', info.training_data],
                                            ['Dataset', 'IEEE CIS Fraud Detection'],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center">
                                                <span className="text-xs text-neutral-500">{k}</span>
                                                <span className="text-xs text-neutral-200 font-medium">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Hyperparameters */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Hyperparameters</p>
                                    <div className="space-y-2">
                                        {info.hyperparameters && Object.entries(info.hyperparameters).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center py-1 border-b border-neutral-900 last:border-0">
                                                <span className="text-xs text-neutral-500 font-mono">{k}</span>
                                                <span className="text-xs text-white font-mono font-bold">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Evaluate button */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Model Evaluation</p>
                                    {!metrics ? (
                                        <div>
                                            <p className="text-xs text-neutral-600 mb-3">Run evaluation on the test set to compute accuracy, precision, recall, F1, and AUC metrics.</p>
                                            <button
                                                onClick={loadMetrics}
                                                disabled={loadingMetrics}
                                                className="w-full bg-white text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {loadingMetrics ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                                                        Evaluating…
                                                    </>
                                                ) : 'Run Evaluation'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    ['Accuracy', (metrics.accuracy * 100).toFixed(2) + '%'],
                                                    ['ROC-AUC', metrics.roc_auc.toFixed(4)],
                                                    ['Test Size', metrics.test_size.toLocaleString()],
                                                    ['Fraud Cases', metrics.fraud_count_test],
                                                ].map(([k, v]) => (
                                                    <div key={k} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
                                                        <p className="text-[10px] text-neutral-600 uppercase mb-1">{k}</p>
                                                        <p className="text-sm font-bold text-white">{v}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Classification report */}
                                            {metrics.classification_report && (
                                                <div className="mt-3">
                                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-2">Per-Class Metrics</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-neutral-600">
                                                                    <th className="text-left py-1.5 pr-2 font-medium">Class</th>
                                                                    <th className="text-right py-1.5 px-2 font-medium">Precision</th>
                                                                    <th className="text-right py-1.5 px-2 font-medium">Recall</th>
                                                                    <th className="text-right py-1.5 px-2 font-medium">F1</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {Object.entries(metrics.classification_report).map(([cls, m]) => (
                                                                    <tr key={cls} className="border-t border-neutral-900">
                                                                        <td className="py-1.5 pr-2 text-neutral-400 font-mono">{cls === '0' ? 'Legit (0)' : cls === '1' ? 'Fraud (1)' : cls}</td>
                                                                        <td className="py-1.5 px-2 text-right text-white font-mono">{m.precision?.toFixed(4)}</td>
                                                                        <td className="py-1.5 px-2 text-right text-white font-mono">{m.recall?.toFixed(4)}</td>
                                                                        <td className="py-1.5 px-2 text-right text-white font-mono">{(m['f1-score'] || m.f1)?.toFixed(4)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Confusion matrix */}
                                            {metrics.confusion_matrix && (
                                                <div className="mt-3">
                                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-2">Confusion Matrix</p>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {[
                                                            { v: metrics.confusion_matrix[0][0], l: 'TN', c: 'bg-neutral-900 text-emerald-400' },
                                                            { v: metrics.confusion_matrix[0][1], l: 'FP', c: 'bg-neutral-900 text-red-400' },
                                                            { v: metrics.confusion_matrix[1][0], l: 'FN', c: 'bg-neutral-900 text-red-400' },
                                                            { v: metrics.confusion_matrix[1][1], l: 'TP', c: 'bg-neutral-900 text-emerald-400' },
                                                        ].map((cell, i) => (
                                                            <div key={i} className={`${cell.c} border border-neutral-800 rounded-lg p-3 text-center`}>
                                                                <p className="text-[10px] text-neutral-600 mb-0.5">{cell.l}</p>
                                                                <p className="text-sm font-bold font-mono">{cell.v.toLocaleString()}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right column: Feature importances */}
                            <div className="lg:col-span-2">
                                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Top 25 Features by Importance</p>
                                    <div className="space-y-1.5">
                                        {info.top_features?.map((f, i) => (
                                            <div key={f.name} className="flex items-center gap-3 group">
                                                <span className="text-[10px] text-neutral-600 font-mono w-5 text-right shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-xs text-white font-mono font-semibold truncate">{f.name}</span>
                                                            {f.label !== f.name && (
                                                                <span className="text-[10px] text-neutral-600 truncate hidden sm:inline">{f.label}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2">{(f.importance * 100).toFixed(2)}%</span>
                                                    </div>
                                                    <div className="bg-neutral-900 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-white transition-all duration-500"
                                                            style={{ width: `${(f.importance / maxImp) * 100}%`, opacity: 1 - (i * 0.025) }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Feature groups legend */}
                                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 mt-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Feature Group Legend</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {[
                                            { prefix: 'C1–C14', desc: 'Counting features', count: 14 },
                                            { prefix: 'D1–D15', desc: 'Timedelta features', count: 15 },
                                            { prefix: 'M1–M9', desc: 'Match features', count: 9 },
                                            { prefix: 'V1–V339', desc: 'Vesta engineered', count: 339 },
                                            { prefix: 'id_01–38', desc: 'Identity features', count: 38 },
                                            { prefix: 'card1–6', desc: 'Card metadata', count: 6 },
                                        ].map(g => (
                                            <div key={g.prefix} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5">
                                                <p className="text-xs text-white font-mono font-semibold">{g.prefix}</p>
                                                <p className="text-[10px] text-neutral-600">{g.desc} ({g.count})</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </PageWrapper>
    )
}

function CreditModelPanel({ navigate }) {
    const [info, setInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('http://localhost:5000/api/credit/model-info')
            .then(r => r.json())
            .then(data => { setInfo(data); setLoading(false) })
            .catch(() => { setError('Failed to fetch credit model details.'); setLoading(false) })
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    if (error) {
        return <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
    }

    if (!info) return null
    const { metrics } = info

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 flex flex-col gap-5">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Architecture</p>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Algorithm</span>
                            <span className="text-xs text-white font-mono font-semibold">XGBoost Classifier</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Feature Dimensions</span>
                            <span className="text-xs text-white font-mono">{info.feature_count} features</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Class Target</span>
                            <span className="text-xs text-white font-mono">1 = Defaulted</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Training Metric</span>
                            <span className="text-xs text-white font-mono">Max F1-Score via Optuna</span>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Test Set Performance</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            { label: 'ROC-AUC', value: metrics?.roc_auc?.toFixed(4) || 'N/A' },
                            { label: 'Opt Threshold', value: metrics?.threshold || info.threshold || 'N/A' },
                            { label: 'Precision', value: metrics?.precision_class1?.toFixed(3) || 'N/A' },
                            { label: 'Recall', value: metrics?.recall_class1?.toFixed(3) || 'N/A' },
                        ].map(s => (
                            <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-tight">{s.label}</p>
                                <p className="text-base font-extrabold text-white font-mono">{s.value}</p>
                            </div>
                        ))}
                    </div>
                    {metrics?.confusion_matrix && (
                        <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 border-b border-neutral-800 pb-2">Confusion Matrix (Threshold: {info.threshold})</p>
                            <div className="grid grid-cols-2 gap-1 text-center text-xs font-mono">
                                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-tl-lg">TN: {metrics.confusion_matrix[0][0]}</div>
                                <div className="bg-red-500/10 text-red-500 p-2 rounded-tr-lg">FP: {metrics.confusion_matrix[0][1]}</div>
                                <div className="bg-red-500/10 text-red-500 p-2 rounded-bl-lg">FN: {metrics.confusion_matrix[1][0]}</div>
                                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-br-lg">TP: {metrics.confusion_matrix[1][1]}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 h-full flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">Home Credit Default Risk Model</h3>
                    <p className="text-sm text-neutral-400 mb-6">
                        This XGBoost model was trained on ~307,000 application records to predict applicants' abilities to repay loans. It leverages
                        <span className="text-white font-mono"> {info.feature_count} </span> features, spanning an extreme imbalance (only ~8% defaults).
                        To counteract this, probability thresholds were dynamically shifted using Optuna over 5-fold cross-validation,
                        maximising the F1 score for the minority "Default" class.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-auto">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Feature Strategy</p>
                            <ul className="text-sm text-neutral-400 space-y-2 list-disc pl-4 marker:text-neutral-700">
                                <li>Heavy reliance on <code className="text-white bg-black px-1 rounded">EXT_SOURCE_1-3</code> normalised external bureau scores.</li>
                                <li>Custom polynomial and ratio combinations (e.g. Credit-to-Income, Annuity-to-Income).</li>
                                <li>Historical installment ratios and delays aggregated over time.</li>
                            </ul>
                        </div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Imbalance Treatment</p>
                            <ul className="text-sm text-neutral-400 space-y-2 list-disc pl-4 marker:text-neutral-700">
                                <li>Scale_pos_weight is bypassed in favor of raw probability tuning via a dynamic threshold (<code className="text-white bg-black px-1 rounded">{info.threshold}</code>).</li>
                                <li>Missing fields are retained optimally as native NaNs handled by XGBoost splitting directions.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-neutral-800 pt-6">
                        <button
                            onClick={() => navigate('/credit-test')}
                            className="bg-white text-black font-semibold py-3 px-6 rounded-lg text-sm hover:bg-neutral-200 transition-colors w-full sm:w-auto"
                        >
                            Test Credit Model Live
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FusionModelPanel({ navigate }) {
    const WEIGHTS_TABLE = [
        { label: 'Loan Approval', creditW: 70, fraudW: 30, key: 'loan' },
        { label: 'Transaction Auth.', creditW: 40, fraudW: 60, key: 'transaction' },
        { label: 'Credit Limit Increase', creditW: 50, fraudW: 50, key: 'limit' },
    ]
    const TIERS = [
        { range: '0 – 25%', level: 'Low', decision: 'APPROVE', color: 'bg-emerald-500', text: 'text-emerald-400' },
        { range: '25 – 45%', level: 'Low-Medium', decision: 'REVIEW', color: 'bg-yellow-500', text: 'text-yellow-400' },
        { range: '45 – 65%', level: 'Medium', decision: 'REVIEW', color: 'bg-amber-500', text: 'text-amber-400' },
        { range: '65 – 80%', level: 'High', decision: 'DECLINE', color: 'bg-red-400', text: 'text-red-400' },
        { range: '80 – 100%', level: 'Very High', decision: 'DECLINE', color: 'bg-red-500', text: 'text-red-500' },
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 flex flex-col gap-5">
                {/* Weight Matrix */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">Fusion Weight Matrix</p>
                    <div className="space-y-3">
                        {WEIGHTS_TABLE.map(w => (
                            <div key={w.key} className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
                                <p className="text-xs font-semibold text-neutral-300 mb-2">{w.label}</p>
                                <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-1.5">
                                    <div className="rounded-l-full bg-white" style={{ width: `${w.creditW}%` }} />
                                    <div className="rounded-r-full bg-neutral-600" style={{ width: `${w.fraudW}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-neutral-500">
                                    <span className="text-neutral-400 font-medium">{w.creditW}% Credit</span>
                                    <span>{w.fraudW}% Fraud</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decision Tiers */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Decision Tiers</p>
                    <div className="space-y-2">
                        {TIERS.map(t => (
                            <div key={t.level} className="flex items-center justify-between bg-neutral-900/50 rounded-lg px-3 py-2 border border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${t.color}`} />
                                    <span className={`text-xs font-semibold ${t.text}`}>{t.level}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                                    <span>{t.range}</span>
                                    <span className="text-neutral-700">→</span>
                                    <span className="text-neutral-300 font-medium">{t.decision}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 h-full flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">RiskFusion Engine</h3>
                    <p className="text-sm text-neutral-400 mb-6">
                        The Fusion Engine is the core of RiskFusion AI. It simultaneously invokes two independent XGBoost models —
                        Fraud Detection (431 features, IEEE CIS) and Credit Default Risk (146 features, Home Credit) — and combines
                        their raw probabilities into a single <span className="text-white font-mono">Fusion Risk Score</span> using a
                        context-driven weighted average.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-auto">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Formula</p>
                            <code className="block bg-black rounded-lg px-4 py-3 text-xs text-emerald-400 font-mono leading-relaxed">
                                fusion = fraud_prob × w_fraud<br />
                                {'      '}+ credit_prob × w_credit
                            </code>
                            <p className="text-xs text-neutral-600 mt-3">
                                Weights <code className="text-neutral-400">w_fraud</code> and <code className="text-neutral-400">w_credit</code> sum
                                to 1.0 and vary by evaluation context.
                            </p>
                        </div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Models Fused</p>
                            <ul className="text-sm text-neutral-400 space-y-2 list-disc pl-4 marker:text-neutral-700">
                                <li><span className="text-white">XGBoost Fraud</span> — 431 features, IEEE CIS dataset, 100K transactions</li>
                                <li><span className="text-white">XGBoost Credit</span> — 146 features, Home Credit dataset, 307K applicants</li>
                                <li>Unknown fields default to <code className="text-neutral-300">−999</code> (fraud) or <code className="text-neutral-300">NaN</code> (credit)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-neutral-800 pt-6">
                        <button
                            onClick={() => navigate('/fusion-test')}
                            className="bg-white text-black font-semibold py-3 px-6 rounded-lg text-sm hover:bg-neutral-200 transition-colors w-full sm:w-auto"
                        >
                            ⚡ Launch Fusion Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
