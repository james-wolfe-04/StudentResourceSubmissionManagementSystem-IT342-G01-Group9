import React from 'react';

export default function Chip({ color = 'default', children }) {
    return <span className={`chip chip--${color}`}>{children}</span>;
}
