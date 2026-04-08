import React from 'react';

const Button = ({ children, variant = 'primary', onClick, disabled, className = '', type = 'button' }) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={disabled ? null : onClick}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
};

export default Button;
