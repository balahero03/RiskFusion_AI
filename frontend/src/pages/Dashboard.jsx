import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreditForm from '../components/CreditForm'
import FraudForm from '../components/FraudForm'
import ContextSelector from '../components/ContextSelector'
import PageWrapper from '../components/PageWrapper'

const WEIGHTS = {
    loan: { credit: 0.7, fraud: 0.3 },
    transaction: { credit: 0.4, fraud: 0.6 },
    limit: { credit: 0.5, fraud: 0.5 },
}

const INITIAL_CREDIT = {
    income: '', loanAmount: '', loanDuration: '',
    age: '', employmentYears: '', existingLoans: '',
}
const INITIAL_FRAUD = {
    txAmount: '', txVelocity: '',
    geoMismatch: false, deviceMismatch: false,
}

function getRiskLevel(score) {
    if (score < 0.3) return 'Low'
    if (score < 0.6) return 'Medium'
    return 'High'
}
function getDecision(level) {
    return { Low: 'Approve', Medium: 'Review', High: 'Reject' }[level]
}

/**
 * Real-world Credit Risk Score (0–1, higher = riskier)
 *
 * Factors:
 *  - Debt-to-Income Ratio (DTI): primary signal. High loan vs income = risky.
 *  - Loan Duration: short duration with large loan = higher monthly strain.
 *  - Employment Stability: fewer years employed = higher risk.
 *  - Existing Debt Burden: more existing loans = higher risk.
 *  - Age: very young (<25) or near retirement (>60) carries marginally higher risk.
 */
function computeCreditScore(credit) {
    const income = Math.max(parseFloat(credit.income) || 0, 1)
    const loanAmount = parseFloat(credit.loanAmount) || 0
    const loanDuration = Math.max(parseFloat(credit.loanDuration) || 12, 1)  // months
    const age = parseFloat(credit.age) || 30
    const employmentYears = parseFloat(credit.employmentYears) || 0
    const existingLoans = parseFloat(credit.existingLoans) || 0

    // 1. DTI — monthly loan repayment vs monthly income (weight: 40%)
    const monthlyPayment = loanAmount / loanDuration
    const dti = Math.min(monthlyPayment / income, 1)
    const dtiRisk = dti * 0.40

    // 2. Employment stability — 0 yrs = 25% risk, 10+ yrs = 0% risk (weight: 25%)
    const empRisk = Math.max(0, 1 - employmentYears / 10) * 0.25

    // 3. Existing debt burden — each extra loan adds risk, max 5 loans (weight: 20%)
    const debtRisk = Math.min(existingLoans / 5, 1) * 0.20

    // 4. Age factor: <25 or >60 = mild risk bump (weight: 15%)
    const ageFactor = (age < 25 || age > 60) ? 0.15 : age < 30 ? 0.07 : 0
    const ageRisk = ageFactor * 0.15

    return Math.min(1, Math.max(0, dtiRisk + empRisk + debtRisk + ageRisk))
}

/**
 * Real-world Fraud Risk Score (0–1, higher = riskier)
 *
 * Factors:
 *  - Transaction Amount: unusually large amounts are higher risk.
 *    (Threshold: <$500 = low, $500–$5,000 = moderate, >$5,000 = high)
 *  - Transaction Velocity: frequency of recent transactions.
 *    (Threshold: <3/hr = normal, 3–10/hr = elevated, >10/hr = high)
 *  - Geographic Mismatch: strong fraud indicator when location doesn't match.
 *  - Device Mismatch: secondary fraud indicator when device is unrecognized.
 */
function computeFraudScore(fraud) {
    const amount = parseFloat(fraud.txAmount) || 0
    const velocity = parseFloat(fraud.txVelocity) || 0

    // 1. Transaction amount risk (weight: 30%)
    //    <500 → ~0, 500-5000 → linear, >5000 → max
    const amountRisk = Math.min(amount / 5000, 1) * 0.30

    // 2. Velocity risk (weight: 35%)
    //    <3 → ~0, 3–10 → linear, >10 → max
    const velocityNorm = velocity <= 3 ? 0 : Math.min((velocity - 3) / 7, 1)
    const velocityRisk = velocityNorm * 0.35

    // 3. Geographic mismatch (weight: 25%) — strong signal
    const geoRisk = fraud.geoMismatch ? 0.25 : 0

    // 4. Device mismatch (weight: 10%) — secondary signal
    const deviceRisk = fraud.deviceMismatch ? 0.10 : 0

    return Math.min(1, Math.max(0, amountRisk + velocityRisk + geoRisk + deviceRisk))
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [credit, setCredit] = useState(INITIAL_CREDIT)
    const [fraud, setFraud] = useState(INITIAL_FRAUD)
    const [context, setContext] = useState('loan')
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    function handleCreditChange(id, val) {
        setCredit((prev) => ({ ...prev, [id]: val }))
        setErrors((prev) => ({ ...prev, [id]: false }))
    }
    function handleFraudChange(id, val) {
        setFraud((prev) => ({ ...prev, [id]: val }))
        setErrors((prev) => ({ ...prev, [id]: false }))
    }
    function handleFraudToggle(id, val) {
        setFraud((prev) => ({ ...prev, [id]: val }))
    }

    function validate() {
        const required = ['income', 'loanAmount', 'loanDuration', 'age', 'employmentYears', 'existingLoans', 'txAmount', 'txVelocity']
        const newErrors = {}
        required.forEach((k) => {
            const v = k in credit ? credit[k] : fraud[k]
            if (!v || isNaN(Number(v))) newErrors[k] = true
        })
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        setTimeout(() => {
            const credit_score = computeCreditScore(credit)
            const fraud_score = computeFraudScore(fraud)
            const w = WEIGHTS[context]
            const final_trust_score = w.credit * credit_score + w.fraud * fraud_score
            const credit_contribution = Math.round(w.credit * 100)
            const fraud_contribution = Math.round(w.fraud * 100)
            const risk_level = getRiskLevel(final_trust_score)
            const decision = getDecision(risk_level)

            setLoading(false)
            navigate('/result', {
                state: {
                    credit_score,
                    fraud_score,
                    final_trust_score,
                    credit_contribution,
                    fraud_contribution,
                    risk_level,
                    decision,
                    context,
                },
            })
        }, 1200)
    }

    const hasErrors = Object.values(errors).some(Boolean)

    return (
        <PageWrapper>
            <div className="min-h-screen bg-slate-950">
                {/* Top bar */}
                <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-base tracking-tight">Risk<span className="text-blue-400">Nexus</span></span>
                    </div>

                </header>

                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Risk Evaluation</h1>
                        <p className="text-slate-400 text-sm">Fill in the details below to compute a fused trust score.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                            {/* ── LEFT: Input Panel ── */}
                            <div className="lg:col-span-3 flex flex-col gap-5">

                                {/* Context */}
                                <div className="card p-5">
                                    <ContextSelector value={context} onChange={setContext} />
                                </div>

                                {/* Credit */}
                                <div className="card p-5">
                                    <CreditForm values={credit} onChange={handleCreditChange} />
                                    {hasErrors && (
                                        <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                                            ⚠ Please fill in all required fields with valid numbers.
                                        </div>
                                    )}
                                </div>

                                {/* Fraud */}
                                <div className="card p-5">
                                    <FraudForm values={fraud} onChange={handleFraudChange} onToggle={handleFraudToggle} />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    id="evaluate-btn"
                                    disabled={loading}
                                    className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Computing fusion score…
                                        </>
                                    ) : (
                                        'Evaluate Risk'
                                    )}
                                </button>
                            </div>

                            {/* ── RIGHT: Info Panel ── */}
                            <div className="lg:col-span-2 flex flex-col gap-5">

                                {/* How it works */}
                                <div className="card p-5">
                                    <p className="section-title">How It Works</p>
                                    <ol className="space-y-3">
                                        {[
                                            { step: '01', text: 'Input credit & fraud signals' },
                                            { step: '02', text: 'Select evaluation context' },
                                            { step: '03', text: 'AI computes weighted trust score' },
                                            { step: '04', text: 'Receive instant risk decision' },
                                        ].map((s) => (
                                            <li key={s.step} className="flex items-start gap-3">
                                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center">
                                                    {s.step}
                                                </span>
                                                <span className="text-sm text-slate-400 leading-snug pt-0.5">{s.text}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Weight matrix */}
                                <div className="card p-5">
                                    <p className="section-title">Fusion Weight Matrix</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Loan Approval', credit: 70, fraud: 30 },
                                            { label: 'Transaction Auth.', credit: 40, fraud: 60 },
                                            { label: 'Credit Limit', credit: 50, fraud: 50 },
                                        ].map((r) => (
                                            <div key={r.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                                                <p className="text-xs font-semibold text-slate-300 mb-2">{r.label}</p>
                                                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                                                    <div className="rounded-l-full bg-blue-500" style={{ width: `${r.credit}%` }} />
                                                    <div className="rounded-r-full bg-rose-500" style={{ width: `${r.fraud}%` }} />
                                                </div>
                                                <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                                                    <span className="text-blue-400 font-medium">{r.credit}% Credit</span>
                                                    <span className="text-rose-400 font-medium">{r.fraud}% Fraud</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Risk legend */}
                                <div className="card p-5">
                                    <p className="section-title">Risk Thresholds</p>
                                    <div className="space-y-2">
                                        {[
                                            { range: '0 – 30', label: 'Low Risk', color: 'bg-emerald-500', text: 'text-emerald-400', decision: 'Approve' },
                                            { range: '30 – 60', label: 'Medium Risk', color: 'bg-amber-500', text: 'text-amber-400', decision: 'Review' },
                                            { range: '60 – 100', label: 'High Risk', color: 'bg-red-500', text: 'text-red-400', decision: 'Reject' },
                                        ].map((r) => (
                                            <div key={r.label} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                                                    <span className={`text-xs font-semibold ${r.text}`}>{r.label}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                    <span>{r.range}</span>
                                                    <span className="text-slate-600">→</span>
                                                    <span className="text-slate-300 font-medium">{r.decision}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </PageWrapper>
    )
}
