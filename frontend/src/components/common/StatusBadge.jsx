import React from 'react';
const StatusBadge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'MATCHED': return 'badge-matched';
      case 'DISCREPANCY': return 'badge-discrepancy';
      case 'PENDING_REVIEW': return 'badge-pending';
      case 'SENT': return 'badge-matched';
      case 'FAILED': return 'badge-discrepancy';
      case 'DEAD_LETTER': return 'badge-discrepancy';
      default: return 'badge-secondary';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
