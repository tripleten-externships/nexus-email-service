import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // const { currentUser, loading } = useAuth({});
  const navigate = useNavigate();

  React.useEffect(() => {
    // if (!loading) {
    navigate('/welcome');
    // }
  }, [navigate]);

  // if (loading) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );
  // }

  // if (!currentUser) {
  // return null;
  // }

  // return <>{children}</>;
};

export default ProtectedRoute;
