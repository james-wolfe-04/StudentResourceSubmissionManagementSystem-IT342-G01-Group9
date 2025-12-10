import React from 'react';

export default function Card({ title, subtitle, actions, children }) {
    return (
        <div className="card">
            {(title || actions) && (
                <div className="card-header">
                    <div className="card-titles">
                        {title && <div className="card-title">{title}</div>}
                        {subtitle && <div className="card-subtitle">{subtitle}</div>}
                    </div>
                    {actions && <div className="card-actions">{actions}</div>}
                </div>
            )}
            <div className="card-body">{children}</div>
        </div>
    );
}
