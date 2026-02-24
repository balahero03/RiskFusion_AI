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

function computeCreditScore(credit) {
    const income = Math.max(parseFloat(credit.income) || 0, 1)
    const loanAmount = parseFloat(credit.loanAmount) || 0
    const loanDuration = Math.max(parseFloat(credit.loanDuration) || 12, 1)
    const age = parseFloat(credit.age) || 30
    const employmentYears = parseFloat(credit.employmentYears) || 0
    const existingLoans = parseFloat(credit.existingLoans) || 0

    const monthlyPayment = loanAmount / loanDuration
    const dti = Math.min(monthlyPayment / income, 1)
    const dtiRisk = dti * 0.40
    const empRisk = Math.max(0, 1 - employmentYears / 10) * 0.25
    const debtRisk = Math.min(existingLoans / 5, 1) * 0.20
    const ageFactor = (age < 25 || age > 60) ? 0.15 : age < 30 ? 0.07 : 0
    const ageRisk = ageFactor * 0.15

    return Math.min(1, Math.max(0, dtiRisk + empRisk + debtRisk + ageRisk))
}

function computeFraudScore(fraud) {
    const amount = parseFloat(fraud.txAmount) || 0
    const velocity = parseFloat(fraud.txVelocity) || 0
    const amountRisk = Math.min(amount / 5000, 1) * 0.30
    const velocityNorm = velocity <= 3 ? 0 : Math.min((velocity - 3) / 7, 1)
    const velocityRisk = velocityNorm * 0.35
    const geoRisk = fraud.geoMismatch ? 0.25 : 0
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
                    credit_score, fraud_score, final_trust_score,
                    credit_contribution, fraud_contribution,
                    risk_level, decision, context,
                },
            })
        }, 1200)
    }

    const hasErrors = Object.values(errors).some(Boolean)

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
                        <button onClick={() => navigate('/fraud-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fraud Test</button>
                        <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Dashboard</span>
                    </nav>
                </header>

                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Risk Evaluation</h1>
                        <p className="text-neutral-500 text-sm">Fill in the details below to compute a fused trust score.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                            {/* Input panel */}
                            <div className="lg:col-span-3 flex flex-col gap-5">
                                <div className="card p-5">
                                    <ContextSelector value={context} onChange={setContext} />
                                </div>

                                <div className="card p-5">
                                    <CreditForm values={credit} onChange={handleCreditChange} />
                                    {hasErrors && (
                                        <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                                            Please fill in all required fields with valid numbers.
                                        </div>
                                    )}
                                </div>

                                <div className="card p-5">
                                    <FraudForm values={fraud} onChange={handleFraudChange} onToggle={handleFraudToggle} />
                                </div>

                                <button
                                    type="submit"
                                    id="evaluate-btn"
                                    disabled={loading}
                                    className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                                            Computing fusion score…
                                        </>
                                    ) : (
                                        'Evaluate Risk'
                                    )}
                                </button>
                            </div>

                            {/* Info panel */}
                            <div className="lg:col-span-2 flex flex-col gap-5">
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
                                                <span className="shrink-0 w-6 h-6 rounded-full bg-white/5 border border-neutral-700 text-neutral-400 text-xs font-bold flex items-center justify-center">
                                                    {s.step}
                                                </span>
                                                <span className="text-sm text-neutral-500 leading-snug pt-0.5">{s.text}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                <div className="card p-5">
                                    <p className="section-title">Fusion Weight Matrix</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Loan Approval', credit: 70, fraud: 30 },
                                            { label: 'Transaction Auth.', credit: 40, fraud: 60 },
                                            { label: 'Credit Limit', credit: 50, fraud: 50 },
                                        ].map((r) => (
                                            <div key={r.label} className="bg-neutral-900/60 rounded-lg p-3 border border-neutral-800">
                                                <p className="text-xs font-semibold text-neutral-300 mb-2">{r.label}</p>
                                                <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                                                    <div className="rounded-l-full bg-white" style={{ width: `${r.credit}%` }} />
                                                    <div className="rounded-r-full bg-neutral-600" style={{ width: `${r.fraud}%` }} />
                                                </div>
                                                <div className="flex justify-between mt-1.5 text-[10px] text-neutral-600">
                                                    <span className="text-neutral-400 font-medium">{r.credit}% Credit</span>
                                                    <span className="text-neutral-500 font-medium">{r.fraud}% Fraud</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card p-5">
                                    <p className="section-title">Risk Thresholds</p>
                                    <div className="space-y-2">
                                        {[
                                            { range: '0 – 30', label: 'Low Risk', color: 'bg-emerald-500', text: 'text-emerald-400', decision: 'Approve' },
                                            { range: '30 – 60', label: 'Medium Risk', color: 'bg-amber-500', text: 'text-amber-400', decision: 'Review' },
                                            { range: '60 – 100', label: 'High Risk', color: 'bg-red-500', text: 'text-red-400', decision: 'Reject' },
                                        ].map((r) => (
                                            <div key={r.label} className="flex items-center justify-between bg-neutral-900/50 rounded-lg px-3 py-2.5 border border-neutral-800">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-2 h-2 rounded-full ${r.color}`} />
                                                    <span className={`text-xs font-semibold ${r.text}`}>{r.label}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-neutral-600">
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
                </div>
            </div>
        </PageWrapper>
    )
}
