// FraudForm.jsx – Fraud-related inputs including toggles
function Toggle({ id, label, checked, onToggle }) {
    return (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="label mb-0 cursor-pointer">{label}</label>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onToggle(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-black ${checked ? 'bg-white' : 'bg-neutral-700'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6 bg-black' : 'translate-x-1 bg-neutral-400'
                        }`}
                />
            </button>
        </div>
    )
}

export default function FraudForm({ values, onChange, onToggle }) {
    return (
        <div>
            <p className="section-title">Fraud Inputs</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label htmlFor="txAmount" className="label">Transaction Amount ($)</label>
                    <input
                        id="txAmount"
                        type="number"
                        min="0"
                        placeholder="e.g. 2500"
                        value={values.txAmount}
                        onChange={(e) => onChange('txAmount', e.target.value)}
                        className="input-field"
                    />
                </div>
                <div>
                    <label htmlFor="txVelocity" className="label">Transaction Velocity</label>
                    <input
                        id="txVelocity"
                        type="number"
                        min="0"
                        placeholder="e.g. 5 per day"
                        value={values.txVelocity}
                        onChange={(e) => onChange('txVelocity', e.target.value)}
                        className="input-field"
                    />
                </div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4 flex flex-col gap-3">
                <Toggle
                    id="geoMismatch"
                    label="Geo Location Mismatch"
                    checked={values.geoMismatch}
                    onToggle={(v) => onToggle('geoMismatch', v)}
                />
                <div className="border-t border-neutral-800" />
                <Toggle
                    id="deviceMismatch"
                    label="Device Fingerprint Mismatch"
                    checked={values.deviceMismatch}
                    onToggle={(v) => onToggle('deviceMismatch', v)}
                />
            </div>
        </div>
    )
}
