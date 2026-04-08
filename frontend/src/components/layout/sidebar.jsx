
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Activity, BellRing, Package, ChevronLeft } from 'lucide-react';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const links = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/settlements', icon: <FileSpreadsheet size={20} />, label: 'Settlements' },
        { to: '/jobs', icon: <Activity size={20} />, label: 'Reconciliation' },
        { to: '/notifications', icon: <BellRing size={20} />, label: 'Notifications' },
    ];

    return (
        <>
            <aside
                className="sidebar glass"
                style={{
                    width: isCollapsed ? '80px' : 'var(--sidebar-width)',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem 1rem',
                    zIndex: 101,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRight: '1px solid var(--panel-border)',
                    overflowY: 'auto',
                }}
            >
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(14, 165, 233, 0.1)',
                        border: '1px solid var(--primary)',
                        borderRadius: '0.75rem',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                    }}
                    className="toggle-btn"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronLeft
                        size={20}
                        style={{
                            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                        }}
                    />
                </button>

                <div
                    className="logo-container"
                    style={{
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <h1
                        className="gradient-text"
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            opacity: isCollapsed ? 0 : 1,
                            transition: 'opacity 0.3s ease 0.1s',
                        }}
                    >
                        <Package className="text-primary" size={24} />
                        <span style={{ fontSize: '1.25rem' }}>CleverBooks</span>
                    </h1>
                    <div
                        style={{
                            display: isCollapsed ? 'flex' : 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Package className="text-primary" size={24} />
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                gap: '1rem',
                                padding: '0.875rem',
                                borderRadius: '0.75rem',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                background: isActive
                                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(6, 182, 212, 0.2))'
                                    : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                border: isActive
                                    ? '1px solid var(--primary)'
                                    : '1px solid transparent',
                                position: 'relative',
                            })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', minWidth: '20px' }}>
                                {link.icon}
                            </div>
                            <span
                                style={{
                                    fontWeight: '500',
                                    opacity: isCollapsed ? 0 : 1,
                                    transition: 'opacity 0.3s ease',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                }}
                            >
                                {link.label}
                            </span>
                            {isCollapsed && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '60px',
                                        background: 'var(--panel-bg)',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        border: '1px solid var(--panel-border)',
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        transition: 'opacity 0.2s ease',
                                    }}
                                    className="tooltip"
                                >
                                    {link.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div
                    style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--panel-border)',
                        textAlign: isCollapsed ? 'center' : 'left',
                        transition: 'all 0.3s ease',
                    }}
                >
                    {!isCollapsed && (
                        <>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Logged in as
                            </p>
                            <p
                                style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'white',
                                    marginTop: '0.25rem',
                                }}
                            >
                                Merchant #001
                            </p>
                        </>
                    )}
                    {isCollapsed && (
                        <div
                            style={{
                                width: '1.5rem',
                                height: '1.5rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                margin: '0 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: 'white',
                            }}
                        >
                            M
                        </div>
                    )}
                </div>
            </aside>

            {!isCollapsed && (
                <div
                    style={{
                        display: 'none',
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 50,
                    }}
                    className="sidebar-overlay"
                />
            )}
        </>
    );
};

export default Sidebar;