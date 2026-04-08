import { DollarSign, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import React from 'react';

const SummaryCards = ({ data }) => {
    const cards = [
        {
            label: 'Total Settlements',
            value: data?.totalSettlements || 0,
            icon: <FileCheck className="text-primary" />,
            color: 'var(--primary)',
        },
        {
            label: 'Discrepancy Value',
            value: `₹${(data?.totalDiscrepancyValue || 0).toLocaleString()}`,
            icon: <DollarSign className="text-danger" />,
            color: 'var(--danger)',
        },
        {
            label: 'Match Rate',
            value: `${data?.totalSettlements ? Math.round(((data.statusCounts?.MATCHED || 0) / data.totalSettlements) * 100) : 0}%`,
            icon: <FileCheck className="text-success" />,
            color: 'var(--success)',
        },
        {
            label: 'Pending Review',
            value: data?.statusCounts?.PENDING_REVIEW || 0,
            icon: <Clock className="text-warning" />,
            color: 'var(--warning)',
        },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {cards.map((card, i) => (
                <div key={i} className="glass" style={{
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        width: '80px',
                        height: '80px',
                        background: `radial-gradient(circle, ${card.color}15 0%, transparent 70%)`,
                        zIndex: 0,
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--panel-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {React.cloneElement(card.icon, { size: 24 })}
                        </div>
                    </div>

                    <div style={{ zIndex: 1 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>{card.label}</p>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem' }}>{card.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SummaryCards;
