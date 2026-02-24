import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Result from './pages/Result'
import FraudTest from './pages/FraudTest'
import ModelData from './pages/ModelData'
import CreditTest from './pages/CreditTest'

function AnimatedRoutes() {
    const location = useLocation()
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/result" element={<Result />} />
                <Route path="/fraud-test" element={<FraudTest />} />
                <Route path="/model-data" element={<ModelData />} />
                <Route path="/credit-test" element={<CreditTest />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AnimatedRoutes />
        </BrowserRouter>
    )
}
