import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/Layout/PrivateRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Registration from './pages/HackathonRegistration';
import HackathonList from './pages/HackathonList';
import HackathonDetail from './pages/HackathonDetail';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import HostDashboard from './pages/HostDashboard';
import HostProfile from './pages/HostProfile';
import HostHackathonForm from './pages/AddHackathon';
import EditHackathon from './pages/EditHackathon';
import Admin from './pages/Admin';
import TeamDashboard from './pages/TeamDashboard';
import TeamPage from './pages/TeamPage';

// Layout components
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const AuthLayout = ({ children }) => (
  <div className="bg-gray-50 min-h-screen">
    {children}
  </div>
);

const DashboardLayout = ({ children }) => (
  <>
    <Navbar />
    <div className="pt-16 bg-gray-50 min-h-screen">
      {children}
    </div>
    <Footer />
  </>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Signup /></AuthLayout>} />
          <Route path="/hackathons/:id/registration" element={<PrivateRoute><AuthLayout><Registration /></AuthLayout></PrivateRoute>} />
          <Route path="/hackathons" element={<PublicLayout><HackathonList /></PublicLayout>} />
          <Route path="/hackathons/:id" element={<PublicLayout><HackathonDetail /></PublicLayout>} />

          {/* Protected user routes */}
          <Route path="/user/dashboard" element={<PrivateRoute><DashboardLayout><UserDashboard /></DashboardLayout></PrivateRoute>} />
          <Route path="/user/profile" element={<PrivateRoute><DashboardLayout><UserProfile /></DashboardLayout></PrivateRoute>} />

          {/* Protected host routes */}
          <Route path="/host/dashboard" element={<PrivateRoute requireHost><DashboardLayout><HostDashboard /></DashboardLayout></PrivateRoute>} />
          <Route path="/host/profile" element={<PrivateRoute requireHost><DashboardLayout><HostProfile /></DashboardLayout></PrivateRoute>} />
          <Route path="/host/hackathon/new" element={<PrivateRoute requireHost><DashboardLayout><HostHackathonForm /></DashboardLayout></PrivateRoute>} />
          <Route path="/host/hackathons/:id/edit" element={<PrivateRoute requireHost><DashboardLayout><EditHackathon /></DashboardLayout></PrivateRoute>} />
          <Route path="/hackathons/:id/teams" element={<PrivateRoute><DashboardLayout><TeamDashboard /></DashboardLayout></PrivateRoute>} />
          <Route path="/teams/:id" element={<PublicLayout><TeamPage /></PublicLayout>} />

          {/* Admin route example (add your own AdminRoute logic if needed) */}
          <Route path="/admin" element={<PrivateRoute requireAdmin={true}><DashboardLayout><Admin /></DashboardLayout></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;

