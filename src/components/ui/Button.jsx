import React from 'react';

export default function Button({ variant = 'primary', size = 'md', disabled, children, ...props }) {
    const base = 'btn';
    const classes = [base, `${base}--${variant}`, `${base}--${size}`, disabled ? `${base}--disabled` : '']
        .filter(Boolean)
        .join(' ');
    return (
        <button className={classes} disabled={disabled} {...props}>
            {children}
        </button>
    );
}
