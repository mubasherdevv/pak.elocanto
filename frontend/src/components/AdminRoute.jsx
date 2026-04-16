import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  return user && user.isAdmin ? <Outlet /> : <Navigate to="/" />;
}
