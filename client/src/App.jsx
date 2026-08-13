import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StaffRoute, CandidateRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CandidateLogin from './pages/CandidateLogin';
import CandidateActivate from './pages/CandidateActivate';
import CandidatePortal from './pages/CandidatePortal';

function Root() {
  const { staffUser, candidate } = useAuth();
  if (staffUser) return <Navigate to={`/${staffUser.role}`} replace />;
  if (candidate) return <Navigate to="/candidate" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/admin"
            element={
              <StaffRoute roles={['admin']}>
                <AdminDashboard />
              </StaffRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <StaffRoute roles={['hr']}>
                <HRDashboard />
              </StaffRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <StaffRoute roles={['manager']}>
                <ManagerDashboard />
              </StaffRoute>
            }
          />

          <Route path="/candidate/login" element={<CandidateLogin />} />
          <Route path="/candidate/activate" element={<CandidateActivate />} />
          <Route
            path="/candidate"
            element={
              <CandidateRoute>
                <CandidatePortal />
              </CandidateRoute>
            }
          />

          <Route path="*" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
