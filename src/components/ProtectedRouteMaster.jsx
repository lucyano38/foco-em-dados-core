import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../contexts/AuthContext';

export default function ProtectedRouteMaster({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#121414] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#fabd00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(String(user.email || '').toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return children;
}