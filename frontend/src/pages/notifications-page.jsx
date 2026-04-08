import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BellRing, CheckCircle, XCircle, RefreshCcw, ExternalLink, Activity } from 'lucide-react';
import Layout from '../components/layout/layout';
import Loader from '../components/common/Loader';
import StatusBadge from '../components/common/StatusBadge';
import api from '../utils/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const [notifRes, statsRes] = await Promise.all([
        api.get('/notifications', { params: { page: pageNum, limit: 15 } }),
        api.get('/notifications/stats')
      ]);
      setNotifications(notifRes.data);
      setTotalPages(notifRes.pagination.totalPages);
      setPage(notifRes.pagination.page);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    const interval = setInterval(() => fetchData(page), 15000);
    return () => clearInterval(interval);
  }, [page]);

  const StatBox = ({ label, value, icon, color }) => (
    <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: `${color}10`, color: color }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{value}</h4>
      </div>
    </div>
  );

  return (
    <Layout title="Merchant Notifications">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <StatBox
            label="Successfully Sent"
            value={stats?.SENT || 0}
            icon={<CheckCircle size={20} />}
            color="var(--success)"
          />
          <StatBox
            label="In Queue / Pending"
            value={stats?.PENDING || 0}
            icon={<Activity size={20} />}
            color="var(--primary)"
          />
          <StatBox
            label="Delivery Failed"
            value={stats?.FAILED || 0}
            icon={<XCircle size={20} />}
            color="var(--danger)"
          />
          <StatBox
            label="Permanently Failed (DLQ)"
            value={stats?.DEAD_LETTER || 0}
            icon={<BellRing size={20} />}
            color="var(--text-muted)"
          />
        </div>
        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BellRing size={20} className="text-primary" />
              <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>Notification Delivery Log</h4>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Notifications are sent to webhook.site with automatic retries
            </div>
          </div>

          {loading && notifications.length === 0 ? (
            <div style={{ padding: '5rem' }}><Loader label="Loading notification history..." /></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>AWB NUMBER</th>
                    <th>DISCREPANCY TYPE</th>
                    <th>STATUS</th>
                    <th>ATTEMPTS</th>
                    <th>LAST ATTEMPT</th>
                    <th>NEXT RETRY</th>
                    <th>RESPONSE</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif._id}>
                      <td style={{ fontWeight: '500' }}>{notif.awbNumber}</td>
                      <td>
                        <span style={{ fontSize: '0.8125rem' }}>
                          {notif.discrepancyType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td><StatusBadge status={notif.status} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {notif.attempts} / {notif.maxAttempts}
                          {notif.attempts > 1 && <RefreshCcw size={12} className="text-warning" />}
                        </div>
                      </td>
                      <td>
                        {notif.lastAttemptAt
                          ? format(new Date(notif.lastAttemptAt), 'HH:mm:ss, d MMM')
                          : 'Pending'}
                      </td>
                      <td>
                        {notif.status === 'FAILED' && notif.nextRetryAt
                          ? format(new Date(notif.nextRetryAt), 'HH:mm:ss')
                          : '-'}
                      </td>
                      <td>
                        {notif.webhookResponse ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              background: notif.webhookResponse.statusCode === 200 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: notif.webhookResponse.statusCode === 200 ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {notif.webhookResponse.statusCode}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {notif.webhookResponse.body}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {notifications.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No notifications have been triggered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ padding: '1rem', borderTop: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Previous
              </button>
              <div style={{ alignSelf: 'center', fontSize: '0.875rem' }}>
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(239, 68, 68, 0.05))', borderRadius: '1.25rem', padding: '2rem', border: '1px solid var(--panel-border)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--pending)' }}>
              <BellRing size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Smart Retry Engine (Bonus Feature)</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                This alert engine uses BullMQ behind the scenes to ensure 100% notification delivery.
                If the external API (webhook.site) is down, it automatically retry with <strong>exponential backoff</strong> (1s, 2s, 4s, 8s, 16s).
                Permanent failures are moved to a <strong>Dead-Letter Queue (DLQ)</strong> for your review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
