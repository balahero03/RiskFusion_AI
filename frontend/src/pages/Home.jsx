import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

export default function Home() {
    const navigate = useNavigate()

    return (
        <PageWrapper>
            <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
                {/* Subtle ambient glow */}
                <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

                {/* Navbar */}
                <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-neutral-800/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">Risk<span className="text-neutral-400">Fusion</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => navigate('/fraud-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fraud Test</button>
                        <button onClick={() => navigate('/credit-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Credit Test</button>
                        <button onClick={() => navigate('/fusion-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fusion Test</button>
                        <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <button onClick={() => navigate('/fusion-test')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Fusion Test</button>
                        <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <button onClick={() => navigate('/dashboard')} className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Dashboard</button>
                        <button onClick={() => navigate('/demo')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Demo</button>
                        <button onClick={() => navigate('/classify')} className="text-xs text-black bg-violet-400 px-3 py-1.5 rounded-md font-bold ml-1">🔬 Classify</button>
                    </div>
                </nav>


                {/* Hero */}
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs font-semibold px-4 py-2 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        AI-Powered Risk Intelligence
                    </div>

                    {/* Heading */}
                    <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-5 leading-none">
                        <span className="text-white">Risk</span>
                        <span className="text-neutral-500">Fusion</span>
                    </h1>

                    {/* Description */}
                    <p className="max-w-xl text-neutral-500 text-lg leading-relaxed mb-4">
                        Multi-dimensional risk evaluation that fuses <span className="text-neutral-200 font-medium">credit intelligence</span> with{' '}
                        <span className="text-neutral-200 font-medium">fraud detection</span> into a single unified trust score.
                    </p>
                    <p className="max-w-md text-neutral-600 text-sm leading-relaxed mb-12">
                        Engineered for real-time financial decisions — loan approvals, transaction authorization, and credit limit management.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            id="demo-btn"
                            onClick={() => navigate('/demo')}
                            className="bg-white text-black font-bold text-base px-8 py-4 rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2"
                        >
                            🎯 Bank Demo
                            <span className="text-xs font-normal bg-black/10 px-2 py-0.5 rounded-full">20 profiles</span>
                        </button>
                        <button
                            id="start-btn"
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary text-base px-8 py-4 group"
                        >
                            Risk Dashboard
                            <span className="inline-block ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                        </button>
                        <button
                            onClick={() => navigate('/fraud-test')}
                            className="btn-secondary text-base px-6 py-4"
                        >
                            Test Fraud Model
                        </button>
                        <button
                            id="classify-btn"
                            onClick={() => navigate('/classify')}
                            className="text-sm font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff' }}
                        >
                            🔬 Customer Classification
                            <span className="text-xs font-normal opacity-80 bg-white/10 px-2 py-0.5 rounded-full">+ SHAP</span>
                        </button>
                    </div>

                    {/* Feature pills */}
                    <div className="mt-16 flex flex-wrap justify-center gap-2">
                        {[
                            'Credit Scoring',
                            'Fraud Detection',
                            'Real-Time Fusion',
                            'XGBoost ML',
                            'Model Analytics',
                        ].map((label) => (
                            <div
                                key={label}
                                className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-full px-4 py-2 text-xs text-neutral-500 font-medium"
                            >
                                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                                {label}
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 text-center py-6 text-xs text-neutral-700 border-t border-neutral-800/40">
                    RiskFusion © 2026 · AI-Powered Financial Risk Intelligence
                </footer>
            </div>
        </PageWrapper>
    )
}
