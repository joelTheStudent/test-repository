import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <span className="logo-icon spin">◈</span>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
