/* eslint-disable react-hooks/static-components */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CourierBreakdownChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="glass" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.25rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No discrepancy data available yet.</p>
            </div>
        );
    }

    const COLORS = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--panel-border)', fontSize: '0.875rem' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{payload[0].payload.courier}</p>
                    <p style={{ color: 'var(--danger)' }}>Discrepancies: {payload[0].value}</p>
                    <p style={{ color: 'var(--text-muted)' }}>Variance: ₹{payload[0].payload.totalVariance}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', height: '400px' }}>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '600' }}>Discrepancies by Courier</h4>
            <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="courier"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            textAnchor="middle"
                            height={50}
                            tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="discrepancyCount" radius={[4, 4, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CourierBreakdownChart;
