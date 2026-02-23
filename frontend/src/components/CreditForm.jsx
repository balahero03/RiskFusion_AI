// CreditForm.jsx – Controlled credit-related inputs
export default function CreditForm({ values, onChange }) {
    const fields = [
        { id: 'income', label: 'Annual Income ($)', placeholder: 'e.g. 60000', type: 'number' },
        { id: 'loanAmount', label: 'Loan Amount ($)', placeholder: 'e.g. 15000', type: 'number' },
        { id: 'loanDuration', label: 'Loan Duration (mo.)', placeholder: 'e.g. 36', type: 'number' },
        { id: 'age', label: 'Age (years)', placeholder: 'e.g. 34', type: 'number' },
        { id: 'employmentYears', label: 'Employment (years)', placeholder: 'e.g. 5', type: 'number' },
        { id: 'existingLoans', label: 'Existing Loans', placeholder: 'e.g. 2', type: 'number' },
    ]

    return (
        <div>
            <p className="section-title">Credit Inputs</p>
            <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                    <div key={f.id}>
                        <label htmlFor={f.id} className="label">{f.label}</label>
                        <input
                            id={f.id}
                            type={f.type}
                            min="0"
                            placeholder={f.placeholder}
                            value={values[f.id]}
                            onChange={(e) => onChange(f.id, e.target.value)}
                            className="input-field"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
