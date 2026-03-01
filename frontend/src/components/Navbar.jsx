import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DEV_ITEMS = [
    { label: 'Risk Dashboard', path: '/dashboard' },
    { label: 'Fraud Model Test', path: '/fraud-test' },
    { label: 'Credit Model Test', path: '/credit-test' },
    { label: 'Fusion API Test', path: '/fusion-test' },
]

const MAIN_NAV = [
    { key: 'demo', label: 'Risk Assessment', path: '/demo' },
    { key: 'model-data', label: 'Model Data', path: '/model-data' },
]

export default function Navbar({ currentPage = '' }) {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const dropRef = useRef(null)

    useEffect(() => {
        function close(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    return (
        <header className="border-b border-neutral-800 px-6 py-3.5 flex items-center justify-between sticky top-0 bg-black/97 backdrop-blur-md z-40">
            {/* Brand */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/')}>
                <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                </div>
                <div className="leading-none">
                    <span className="font-bold text-white text-[13px] tracking-tight">Risk<span className="text-neutral-400">Fusion</span></span>
                    <span className="block text-[9px] text-neutral-600 font-medium uppercase tracking-[0.15em] mt-0.5">Risk Intelligence Platform</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-1">
                {MAIN_NAV.map(n => (
                    <button
                        key={n.key}
                        onClick={() => navigate(n.path)}
                        className={`text-xs px-3.5 py-2 rounded-md font-medium transition-colors ${currentPage === n.key
                                ? 'bg-white/10 text-white'
                                : 'text-neutral-500 hover:text-white'
                            }`}
                    >{n.label}</button>
                ))}

                {/* Dev dropdown */}
                <div className="relative" ref={dropRef}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        className={`text-xs px-3.5 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${open ? 'bg-white/5 text-neutral-300' : 'text-neutral-600 hover:text-neutral-400'
                            }`}
                    >
                        Dev Tools
                        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {open && (
                        <div className="absolute right-0 top-full mt-1.5 bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 w-48 shadow-2xl z-50">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-600 px-3.5 pt-1 pb-2">Testing & Debug</p>
                            {DEV_ITEMS.map(d => (
                                <button
                                    key={d.path}
                                    onClick={() => { navigate(d.path); setOpen(false) }}
                                    className="w-full text-left text-xs text-neutral-400 hover:text-white hover:bg-white/5 px-3.5 py-2 transition-colors"
                                >{d.label}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Enter portal CTA */}
                {currentPage !== 'demo' && (
                    <button
                        onClick={() => navigate('/demo')}
                        className="text-xs font-bold text-black bg-white px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors ml-2"
                    >Enter Portal</button>
                )}
            </nav>
        </header>
    )
}
