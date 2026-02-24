import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

export default function CreditTest() {
    const navigate = useNavigate()

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
                        <button onClick={() => navigate('/model-data')} className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-md transition-colors">Model Data</button>
                        <span className="text-xs text-white bg-white/10 px-3 py-1.5 rounded-md font-medium">Credit Test</span>
                    </nav>
                </header>

                <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">Credit Model Testing</h1>
                        <p className="text-neutral-500 text-sm">Test the credit scoring model with applicant parameters.</p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-12 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                            <svg className="w-9 h-9 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-white font-semibold text-lg mb-2">Coming Soon</p>
                        <p className="text-neutral-500 text-sm text-center max-w-md mb-6">
                            The credit scoring model has not been trained yet. Once the model is ready, you'll be able to test credit risk predictions with applicant data like income, loan amount, employment history, and more.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/fraud-test')}
                                className="bg-white text-black font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
                            >
                                Try Fraud Model Instead
                            </button>
                            <button
                                onClick={() => navigate('/model-data')}
                                className="bg-neutral-900 text-neutral-300 font-semibold px-5 py-2.5 rounded-lg text-sm border border-neutral-800 hover:border-neutral-700 transition-colors"
                            >
                                View Model Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}
