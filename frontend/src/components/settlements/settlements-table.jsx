import { format } from 'date-fns';
import { ChevronRight, Info } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const SettlementsTable = ({ settlements, onRowClick }) => {
    if (!settlements || settlements.length === 0) {
        return (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '1rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No settlement records found. Upload a batch to get started.</p>
            </div>
        );
    }

    return (
        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>AWB NUMBER</th>
                            <th>COURIER</th>
                            <th>BATCH ID</th>
                            <th>SETTLED AMT</th>
                            <th>STATUS</th>
                            <th>DATE</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {settlements.map((item) => (
                            <tr
                                key={item._id}
                                onClick={() => onRowClick(item)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td style={{ fontWeight: '500' }}>{item.awbNumber}</td>
                                <td>
                                    <span style={{ textTransform: 'capitalize' }}>
                                        {item.order?.courierPartner || 'Unknown'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.batchId}</td>
                                <td>₹{item.settledCodAmount?.toLocaleString()}</td>
                                <td><StatusBadge status={item.status} /></td>
                                <td>
                                    {item.settlementDate
                                        ? format(new Date(item.settlementDate), 'dd MMM yyyy')
                                        : item.status === 'PENDING_REVIEW' ? 'Pending' : 'N/A'
                                    }
                                </td>
                                <td>
                                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SettlementsTable;
