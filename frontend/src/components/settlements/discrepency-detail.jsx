import React from 'react';
import { AlertTriangle, CheckCircle2, Package, Truck, AlertCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const DiscrepancyDetail = ({ settlement, order }) => {
    if (!settlement) return null;

    const discrepancies = settlement.discrepancies || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AWB NUMBER</p>
                    <p style={{ fontWeight: '600', fontSize: '1.25rem' }}>{settlement.awbNumber}</p>
                </div>
                <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid var(--accent)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>RECONCILIATION STATUS</p>
                    <div style={{ display: 'flex', alignItems: 'center', height: '1.875rem' }}>
                        <StatusBadge status={settlement.status} />
                    </div>
                </div>
            </div>

            <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={16} /> DATA COMPARISON
                </h4>
                <div className="glass" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <table style={{ margin: 0 }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem' }}>Attribute</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Expected (Order)</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Actual (Settlement)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0.75rem 1rem' }}>COD Amount</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>₹{order?.codAmount || 0}</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: settlement.settledCodAmount < (order?.codAmount || 0) ? 'var(--danger)' : 'var(--success)' }}>
                                    ₹{settlement.settledCodAmount}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.75rem 1rem' }}>Weight</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{order?.declaredWeight || 0} kg</td>
                                <td style={{ padding: '0.75rem 1rem', color: settlement.chargedWeight > (order?.declaredWeight || 0) ? 'var(--danger)' : 'inherit' }}>
                                    {settlement.chargedWeight} kg
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.75rem 1rem' }}>Order Status</td>
                                <td style={{ padding: '0.75rem 1rem' }}>{order?.orderStatus || 'N/A'}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {settlement.rtoCharge > 0 ? (
                                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <AlertCircle size={14} /> RTO Charge Applied
                                        </span>
                                    ) : 'Delivered'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> DETECTED ISSUES ({discrepancies.length})
                </h4>

                {discrepancies.length === 0 ? (
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={20} /> No discrepancies found for this settlement.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {discrepancies.map((d, index) => (
                            <div key={index} className="glass" style={{ padding: '1.25rem', borderRadius: '0.75rem', borderLeft: '4px solid var(--danger)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <p style={{ fontWeight: '600', color: 'white' }}>{d.rule.replace(/_/g, ' ')}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>- ₹{d.variance}</p>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{d.description}</p>

                                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Suggested Action</p>
                                    <p style={{ fontSize: '0.875rem', color: 'white' }}>{d.suggestedAction}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
const Activity = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

export default DiscrepancyDetail;
