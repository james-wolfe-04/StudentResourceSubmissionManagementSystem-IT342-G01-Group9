import React from 'react';

export default function Input({ label, hint, error, suffix, ...props }) {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <div className="input-wrap">
                <input className={`input ${error ? 'input--error' : ''}`} {...props} />
                {suffix && <div className="input-suffix">{suffix}</div>}
            </div>
            {hint && !error && <div className="input-hint">{hint}</div>}
            {error && <div className="input-error" role="alert">{error}</div>}
        </div>
    );
}
