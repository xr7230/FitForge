import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props { children: React.ReactNode; }

const AuthGuard: React.FC<Props> = ({ children }) => {
  const token = localStorage.getItem('token') || (localStorage.getItem('fitforge_demo_mode') === 'true' ? 'demo' : null);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default AuthGuard;
