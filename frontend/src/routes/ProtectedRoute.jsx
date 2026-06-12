import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-dark-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

/**
 * WardenRoute — only allows staff with designation "Warden".
 * Non-warden staff are redirected to /staff dashboard.
 */
export const WardenRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role === 'staff' && user?.designation !== 'Warden') {
    return <Navigate to="/staff" replace />;
  }

  return children;
};

export default ProtectedRoute;
