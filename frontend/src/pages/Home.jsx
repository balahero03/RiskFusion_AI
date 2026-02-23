import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

export default function Home() {
    const navigate = useNavigate()

    return (
        <PageWrapper>
            <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden">
                {/* Ambient background blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                {/* Subtle radial center glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />

                {/* Navbar */}
                <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">Risk<span className="text-blue-400">Nexus</span></span>
                    </div>

                </nav>

                {/* Hero */}
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        AI-Powered Risk Intelligence
                    </div>

                    {/* Heading */}
                    <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-5 leading-none">
                        <span className="text-white">Risk</span>
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Nexus</span>
                    </h1>

                    {/* Description */}
                    <p className="max-w-xl text-slate-400 text-lg leading-relaxed mb-4">
                        Multi-dimensional risk evaluation that fuses <span className="text-slate-200 font-medium">credit intelligence</span> with{' '}
                        <span className="text-slate-200 font-medium">fraud detection</span> into a single unified trust score.
                    </p>
                    <p className="max-w-md text-slate-500 text-sm leading-relaxed mb-12">
                        Engineered for real-time financial decisions — loan approvals, transaction authorization, and credit limit management.
                    </p>

                    {/* CTA */}
                    <button
                        id="start-btn"
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary text-base px-8 py-4 group"
                    >
                        Start Risk Evaluation
                        <span className="inline-block ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </button>

                    {/* Feature pills */}
                    <div className="mt-16 flex flex-wrap justify-center gap-3">
                        {[
                            { icon: '🏦', label: 'Credit Scoring' },
                            { icon: '🔍', label: 'Fraud Detection' },
                            { icon: '⚡', label: 'Real-Time Fusion' },
                            { icon: '🎯', label: 'Smart Decisions' },
                        ].map((f) => (
                            <div
                                key={f.label}
                                className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-xs text-slate-400 font-medium"
                            >
                                <span>{f.icon}</span>
                                {f.label}
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 text-center py-6 text-xs text-slate-600 border-t border-slate-800/40">
                    RiskNexus © 2026 · AI-Powered Financial Risk Intelligence
                </footer>
            </div>
        </PageWrapper>
    )
}
