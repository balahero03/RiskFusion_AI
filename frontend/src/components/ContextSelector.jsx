// ContextSelector.jsx – Decision context dropdown
const CONTEXTS = [
    { value: 'loan', label: 'Loan Approval' },
    { value: 'transaction', label: 'Transaction Authorization' },
    { value: 'limit', label: 'Credit Limit Increase' },
]

export default function ContextSelector({ value, onChange }) {
    return (
        <div>
            <p className="section-title">Evaluation Context</p>
            <div>
                <label htmlFor="context" className="label">Decision Scenario</label>
                <select
                    id="context"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="input-field appearance-none cursor-pointer"
                >
                    {CONTEXTS.map((c) => (
                        <option key={c.value} value={c.value} className="bg-neutral-900">
                            {c.label}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-neutral-600 mt-1.5">
                    {value === 'loan' && 'Weights: 70% Credit · 30% Fraud'}
                    {value === 'transaction' && 'Weights: 40% Credit · 60% Fraud'}
                    {value === 'limit' && 'Weights: 50% Credit · 50% Fraud'}
                </p>
            </div>
        </div>
    )
}
