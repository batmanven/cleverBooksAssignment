import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Play, History, Clock } from 'lucide-react';
import Layout from '../components/layout/layout';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/common/StatusBadge';
import api from '../utils/api';

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/jobs/trigger');
      setTimeout(fetchJobs, 1000);
    } catch (err) {
      alert('Failed to trigger job: ' + err.message);
    } finally {
      setTriggering(false);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Layout title="Reconciliation History">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>Run Reconciliation</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manually trigger the reconciliation engine to process uploads.</p>
          </div>
          <Button variant="primary" onClick={handleTrigger} disabled={triggering}>
            <Play size={18} fill="currentColor" />
            {triggering ? 'Triggering...' : 'Start Now'}
          </Button>
        </div>

        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={20} className="text-primary" />
            <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Job Runs</h4>
          </div>

          {loading && jobs.length === 0 ? (
            <div style={{ padding: '5rem' }}><Loader label="Loading history..." /></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>JOB ID</th>
                    <th>TRIGGER</th>
                    <th>STARTED AT</th>
                    <th>DURATION</th>
                    <th>RECORDS</th>
                    <th>MATCHED</th>
                    <th>DISCREPANCIES</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {job._id.slice(-8).toUpperCase()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {job.triggeredBy === 'CRON' ? <Clock size={14} /> : <Play size={14} />}
                          {job.triggeredBy}
                        </div>
                      </td>
                      <td>{format(new Date(job.startedAt), 'PPp')}</td>
                      <td>{formatDuration(job.durationMs)}</td>
                      <td style={{ fontWeight: '600' }}>{job.totalRecords}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '600' }}>{job.matchedCount}</td>
                      <td style={{ color: job.discrepancyCount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600' }}>
                        {job.discrepancyCount}
                      </td>
                      <td><StatusBadge status={job.status} /></td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No reconciliation jobs have been recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AVG. PROCESSING TIME</p>
            <h5 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {jobs.length > 0
                ? formatDuration(jobs.reduce((acc, j) => acc + (j.durationMs || 0), 0) / jobs.length)
                : 'N/A'
              }
            </h5>
          </div>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LAST RUN STATUS</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {jobs.length > 0 ? <StatusBadge status={jobs[0].status} /> : 'N/A'}
            </div>
          </div>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AUTO-TRIGGER (IST)</p>
            <h5 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>02:00 AM</h5>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobsPage;
