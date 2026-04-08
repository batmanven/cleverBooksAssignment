import { useEffect, useState } from "react";
import api from '../utils/api';
import SummaryCards from "../components/dashboard/summary-cards";
import Layout from "../components/layout/layout";
import { Play, Activity, History, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import CourierBreakdownChart from "../components/dashboard/courier-breakdown-chart";
import StatusBadge from '../components/common/StatusBadge';

const DashboardPage = () => {
    const [summary, setSummary] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    const fetchData = async () => {
        try {
            const [summaryRes, jobsRes] = await Promise.all([
                api.get('/settlements/summary'),
                api.get('/jobs', { params: { limit: 5 } }),
            ]);
            setSummary(summaryRes.data);
            setRecentJobs(jobsRes.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            try {
                const jobsRes = await api.get('/jobs', { params: { limit: 5 } });
                setRecentJobs(jobsRes.data);
            } catch (e) {
                console.error('Failed to fetch jobs:', e);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleTriggerReconciliation = async () => {
        setTriggering(true);
        try {
            await api.post('/jobs/trigger');
            alert('Reconciliation job triggered! It will process all pending settlements in the background.');
            fetchData();
        } catch (err) {
            alert('Failed to trigger reconciliation: ' + err.message);
        } finally {
            setTriggering(false);
        }
    };

    if (loading && !summary) {
        return (
            <Layout title="Dashboard">
                <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader label="Preparing your logistics intelligence..." />
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard Overview">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Welcome back, Merchant</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Here's what's happening with your settlements today.</p>
                    </div>
                    <Button variant="primary" onClick={handleTriggerReconciliation} disabled={triggering}>
                        {triggering ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                        {triggering ? 'Processing...' : 'Run Reconciliation'}
                    </Button>
                </div>

                <SummaryCards data={summary} />

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    <CourierBreakdownChart data={summary?.courierBreakdown || []} />

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <History size={18} /> Recent Runs
                            </h4>
                            <a href="/jobs" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none' }}>View All</a>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentJobs.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                                    No jobs have been run yet.
                                </p>
                            ) : (
                                recentJobs.map((job) => (
                                    <div key={job._id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--panel-border)'
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                                {job.triggeredBy === 'CRON' ? 'Nightly Job' : 'Manual Run'}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(job.startedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <StatusBadge status={job.status} />
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                {job.discrepancyCount} issues found
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(6, 182, 212, 0.1))', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                            <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={16} className="text-primary" /> Active Monitoring
                            </h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                System is monitoring {summary?.totalSettlements || 0} shipments across {summary?.courierBreakdown?.length || 0} partners.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const RefreshCw = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
);

export default DashboardPage;
