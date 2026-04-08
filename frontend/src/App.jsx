import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/dashboard-page';
import SettlementsPage from './pages/settlements-page';
import JobsPage from './pages/jobs-page';
import NotificationsPage from './pages/notifications-page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settlements" element={<SettlementsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
