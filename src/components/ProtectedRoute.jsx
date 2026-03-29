import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="loading-spinner" size={32} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile || profile.status !== 'active') {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
