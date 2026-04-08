import React from 'react';
import Sidebar from './Sidebar';
import Header from './header';

const Layout = ({ children, title }) => {
    return (
        <>
            <Sidebar />
            <div style={{
                marginLeft: 'var(--sidebar-width)',
                flex: 1,
                minHeight: '100vh',
                background: 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.05), transparent 40%)',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <Header title={title} />
                <main style={{ padding: '0 2rem 2rem 2rem' }} className="animate-fade-in">
                    {children}
                </main>
            </div>
        </>
    );
};

export default Layout;
