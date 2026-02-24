import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import GaugeChart from '../components/GaugeChart'
import ContributionPie from '../components/ContributionPie'
import PageWrapper from '../components/PageWrapper'

const RISK_CONFIG = {
    Low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', glow: 'risk-glow-low' },
    Medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400', glow: 'risk-glow-medium' },
    High: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400', glow: 'risk-glow-high' },
}
const DECISION_CONFIG = {
    Approve: { bg: 'bg-emerald-600', icon: '✓', label: 'Approve' },
    Review: { bg: 'bg-amber-500', icon: '⚑', label: 'Review' },
    Reject: { bg: 'bg-red-600', icon: '✕', label: 'Reject' },
}
const CONTEXT_LABEL = {
    loan: 'Loan Approval',
    transaction: 'Transaction Authorization',
    limit: 'Credit Limit Increase',
}

export default function Result() {
    const navigate = useNavigate()
    const { state } = useLocation()

    const [barWidths, setBarWidths] = useState({
        trust: 0, credit: 0, fraud: 0, creditWeight: 0, fraudWeight: 0,
    })

    useEffect(() => {
        if (!state) return
        const timer = setTimeout(() => {
            setBarWidths({
                trust: Math.round(state.final_trust_score * 100),
                credit: Math.round(state.credit_score * 100),
                fraud: Math.round(state.fraud_score * 100),
                creditWeight: state.credit_contribution,
                fraudWeight: state.fraud_contribution,
            })
        }, 120)
        return () => clearTimeout(timer)
    }, [state])

    if (!state) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
                <p className="text-neutral-500">No result data found.</p>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </div>
        )
    }

    const {
        credit_score, fraud_score, final_trust_score,
        credit_contribution, fraud_contribution,
        risk_level, decision, context,
    } = state

    const riskCfg = RISK_CONFIG[risk_level]
    const decisionCfg = DECISION_CONFIG[decision]
    const trustPct = Math.round(final_trust_score * 100)
    const trustBarColor = risk_level === 'Low' ? 'bg-emerald-500' : risk_level === 'Medium' ? 'bg-amber-500' : 'bg-red-500'

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
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-md font-medium">
                            {CONTEXT_LABEL[context]}
                        </span>
                        <button
                            id="recalculate-btn"
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary text-sm px-4 py-2"
                        >
                            ← Recalculate
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Risk Evaluation Result</h1>
                            <p className="text-neutral-500 text-sm">Analysis complete · Fusion model applied</p>
                        </div>
                        <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg ${decisionCfg.bg}`}>
                            <span className="text-base">{decisionCfg.icon}</span>
                            Decision: {decisionCfg.label}
                        </div>
                    </div>

                    {/* Top row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        {/* Gauge */}
                        <div className="md:col-span-1 card p-6 flex flex-col items-center justify-center">
                            <p className="section-title text-center w-full mb-4">Trust Score</p>
                            <GaugeChart score={final_trust_score} />
                            <div className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold ${riskCfg.bg} ${riskCfg.border} ${riskCfg.text} ${riskCfg.glow}`}>
                                <span className={`w-2 h-2 rounded-full ${riskCfg.dot}`} />
                                {risk_level} Risk
                            </div>
                        </div>

                        {/* Score cards */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="card p-5 flex flex-col justify-between">
                                <p className="section-title">Final Trust Score</p>
                                <div>
                                    <p className={`text-5xl font-extrabold ${riskCfg.text}`}>{trustPct}<span className="text-2xl font-bold text-neutral-600">%</span></p>
                                    <p className="text-xs text-neutral-600 mt-1">Fused risk index</p>
                                </div>
                                <div className="mt-4 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full progress-bar ${trustBarColor}`} style={{ width: `${barWidths.trust}%` }} />
                                </div>
                            </div>

                            <div className="card p-5">
                                <p className="section-title">Credit Score</p>
                                <p className="text-4xl font-extrabold text-white">
                                    {Math.round(credit_score * 100)}<span className="text-xl font-bold text-neutral-600">%</span>
                                </p>
                                <p className="text-xs text-neutral-600 mt-1 mb-3">Raw credit signal</p>
                                <div className="bg-neutral-800 rounded-full h-1 overflow-hidden">
                                    <div className="h-full rounded-full bg-white/70 progress-bar" style={{ width: `${barWidths.credit}%` }} />
                                </div>
                            </div>

                            <div className="card p-5">
                                <p className="section-title">Fraud Score</p>
                                <p className="text-4xl font-extrabold text-white">
                                    {Math.round(fraud_score * 100)}<span className="text-xl font-bold text-neutral-600">%</span>
                                </p>
                                <p className="text-xs text-neutral-600 mt-1 mb-3">Raw fraud signal</p>
                                <div className="bg-neutral-800 rounded-full h-1 overflow-hidden">
                                    <div className="h-full rounded-full bg-neutral-400 progress-bar" style={{ width: `${barWidths.fraud}%` }} />
                                </div>
                            </div>

                            <div className="card p-5">
                                <p className="section-title">Applied Weights</p>
                                <div className="flex flex-col gap-2 mt-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-neutral-400 font-semibold">Credit</span>
                                        <span className="text-xs text-neutral-300 font-bold">{credit_contribution}%</span>
                                    </div>
                                    <div className="bg-neutral-800 rounded-full h-1 overflow-hidden">
                                        <div className="h-full rounded-full bg-white progress-bar" style={{ width: `${barWidths.creditWeight}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-neutral-500 font-semibold">Fraud</span>
                                        <span className="text-xs text-neutral-400 font-bold">{fraud_contribution}%</span>
                                    </div>
                                    <div className="bg-neutral-800 rounded-full h-1 overflow-hidden">
                                        <div className="h-full rounded-full bg-neutral-500 progress-bar" style={{ width: `${barWidths.fraudWeight}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                        <div className="md:col-span-2 card p-6">
                            <p className="section-title mb-4">Score Contribution</p>
                            <ContributionPie creditPct={credit_contribution} fraudPct={fraud_contribution} />
                        </div>

                        <div className="md:col-span-3 card p-6 flex flex-col justify-between">
                            <div>
                                <p className="section-title mb-4">Decision Rationale</p>
                                <div className={`flex items-start gap-4 p-4 rounded-lg border ${riskCfg.bg} ${riskCfg.border}`}>
                                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl ${decisionCfg.bg} text-white`}>
                                        {decisionCfg.icon}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-lg ${riskCfg.text}`}>{decision}</p>
                                        <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">
                                            {decision === 'Approve' && 'Trust score is within acceptable thresholds. Risk profile is low. Proceed with confidence.'}
                                            {decision === 'Review' && 'Moderate risk detected. Additional verification or manual review is recommended before proceeding.'}
                                            {decision === 'Reject' && 'Risk score exceeds acceptable limits. High-risk signals detected across credit or fraud dimensions.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Trust Score', val: `${trustPct}%`, sub: 'Fused index' },
                                    { label: 'Risk Level', val: risk_level, sub: 'Classification' },
                                    { label: 'Context', val: CONTEXT_LABEL[context].split(' ')[0], sub: CONTEXT_LABEL[context].split(' ').slice(1).join(' ') || '' },
                                ].map((m) => (
                                    <div key={m.label} className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 text-center">
                                        <p className="text-[10px] text-neutral-600 mb-1">{m.label}</p>
                                        <p className="font-bold text-white text-sm">{m.val}</p>
                                        {m.sub && <p className="text-[10px] text-neutral-700 mt-0.5">{m.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            <button
                                id="recalculate-bottom-btn"
                                onClick={() => navigate('/dashboard')}
                                className="btn-primary mt-6 w-full flex items-center justify-center gap-2"
                            >
                                ← Recalculate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}
