import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { api } from './api';
import { useAuth } from './hooks/use-auth';
import { Dashboard } from './pages/dashboard';
import { LoginPage } from './pages/login';

function Gate() {
  const { user, loading, refresh } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (loading) return <div className="grid min-h-screen place-items-center"><LoaderCircle className="h-7 w-7 animate-spin text-emerald-600" /></div>;
  if (!user) return location.pathname === '/dashboard' ? <Navigate to="/" replace /> : <LoginPage />;
  if (location.pathname !== '/dashboard') return <Navigate to="/dashboard" replace />;
  return <Dashboard user={user} onLogout={async () => { await api.logout(); await refresh(); navigate('/', { replace: true }); }} />;
}

export function App() {
  return <Routes><Route path="*" element={<Gate />} /></Routes>;
}
