import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Result from './pages/Result'
import FraudTest from './pages/FraudTest'
import ModelData from './pages/ModelData'
import CreditTest from './pages/CreditTest'
import FusionTest from './pages/FusionTest'
import DemoMode from './pages/DemoMode'
import CustomerClassification from './pages/CustomerClassification'

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
                <Route path="/fusion-test" element={<FusionTest />} />
                <Route path="/demo" element={<DemoMode />} />
                <Route path="/classify" element={<CustomerClassification />} />
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

