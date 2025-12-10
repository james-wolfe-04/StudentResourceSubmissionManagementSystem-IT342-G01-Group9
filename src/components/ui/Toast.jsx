import React, { useEffect } from 'react';

export default function Toast({ open, type = 'info', message, onClose, autoHide = 3000 }) {
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => onClose?.(), autoHide);
        return () => clearTimeout(t);
    }, [open, autoHide, onClose]);

    if (!open) return null;
    return (
        <div className={`toast toast--${type}`} role="status" aria-live="polite">
            {message}
        </div>
    );
}
