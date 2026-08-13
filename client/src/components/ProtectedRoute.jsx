import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards a staff-only route. `roles` restricts to specific roles
// (e.g. ['admin'] for the admin dashboard) - anyone logged in but
// with the wrong role gets redirected to their own dashboard instead
// of a blank screen, so no one lands on a page that will just 403.
export function StaffRoute({ roles, children }) {
  const { staffUser } = useAuth();

  if (!staffUser) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(staffUser.role)) {
    return <Navigate to={`/${staffUser.role}`} replace />;
  }

  return children;
}

export function CandidateRoute({ children }) {
  const { candidate } = useAuth();
  if (!candidate) return <Navigate to="/candidate/login" replace />;
  return children;
}
