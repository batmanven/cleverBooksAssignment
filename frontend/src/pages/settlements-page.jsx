/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Download, Filter, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/layout';
import UploadForm from '../components/settlements/upload-form';
import SettlementsTable from '../components/settlements/settlements-table';
import DiscrepancyDetail from '../components/settlements/discrepency-detail';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import api from '../utils/api';

const SettlementsPage = () => {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const fetchSettlements = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get('/settlements', {
                params: {
                    status: statusFilter,
                    page,
                    limit: 15,
                },
            });
            setSettlements(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Failed to fetch settlements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlements(1);
    }, [statusFilter]);

    const handleRowClick = (settlement) => {
        setSelectedSettlement(settlement);
        setIsModalOpen(true);
    };

    const handleExport = () => {
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/settlements/export?status=${statusFilter}`, '_blank');
    };

    const handleUploadSuccess = () => {
        fetchSettlements(1);
    };

    const filterTabs = [
        { id: 'ALL', label: 'All' },
        { id: 'MATCHED', label: 'Matched' },
        { id: 'DISCREPANCY', label: 'Discrepancy' },
        { id: 'PENDING_REVIEW', label: 'Pending' },
    ];

    return (
        <Layout title="Settlements Management">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                    <UploadForm onUploadSuccess={handleUploadSuccess} />
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Button variant="secondary" onClick={handleExport} className="w-full">
                                <Download size={18} /> Export Current View (CSV)
                            </Button>
                            <Button variant="secondary" onClick={() => fetchSettlements(1)} className="w-full">
                                <RefreshCw size={18} /> Refresh Data
                            </Button>
                        </div>
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--panel-border)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Tip: Click on any row in the table below to see detailed discrepancy analysis and suggested actions.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.375rem', borderRadius: '0.875rem' }} className="glass">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '0.625rem',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: statusFilter === tab.id ? 'var(--primary)' : 'transparent',
                                    color: statusFilter === tab.id ? 'white' : 'var(--text-muted)',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Showing {settlements.length} records
                    </div>
                </div>

                {loading ? (
                    <div className="glass" style={{ borderRadius: '1rem', padding: '5rem' }}>
                        <Loader label="Fetching settlements..." />
                    </div>
                ) : (
                    <SettlementsTable
                        settlements={settlements}
                        onRowClick={handleRowClick}
                    />
                )}

                {pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <Button
                            variant="secondary"
                            disabled={pagination.page === 1}
                            onClick={() => fetchSettlements(pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <div style={{ padding: '0.5rem 1rem', color: 'white' }}>
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="secondary"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => fetchSettlements(pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Settlement Reconciliation Detail"
            >
                <DiscrepancyDetail
                    settlement={selectedSettlement}
                    order={selectedSettlement?.order}
                />
            </Modal>
        </Layout>
    );
};

export default SettlementsPage;
