import React from 'react';

const Loader = ({ size = 24, label = 'Loading...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem' }}>
      <div style={{
        width: size,
        height: size,
        border: '3px solid rgba(14, 165, 233, 0.2)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}></div>
      {label && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
