import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Beneficiaries from './pages/Beneficiaries';
import Distributions from './pages/Distributions';
import UserApproval from './pages/admin/UserApproval';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes with app shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />

            <Route path="/distributions" element={<Distributions />} />

            {/* Utility routes */}
            <Route path="/settings" element={<PlaceholderPage title="Settings" desc="System preferences and configuration." />} />
            <Route path="/help" element={<PlaceholderPage title="Support" desc="Documentation and support resources." />} />

            {/* Admin routes */}
            <Route path="/admin/users" element={<UserApproval />} />
            <Route path="/admin/audit" element={<PlaceholderPage title="Audit Logs" desc="System activity tracking for compliance." />} />
            <Route path="/admin/settings" element={<PlaceholderPage title="System Settings" desc="Global configuration and feature toggles." />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title, desc }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 'var(--space-4)',
    }}>
      <h2 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--on-surface)',
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 'var(--font-size-base)',
        color: 'var(--on-surface-variant)',
        maxWidth: '360px',
        textAlign: 'center',
      }}>
        {desc || 'This module will be available in the next phase.'}
      </p>
    </div>
  );
}
