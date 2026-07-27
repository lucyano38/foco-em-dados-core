import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRouteMaster({ children }) {
  const { user } = useAuth();

  if (!user || user.email !== 'lucyano.pci@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return children;
}
