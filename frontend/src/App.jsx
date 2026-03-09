import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login.jsx';

function AppContent() {
  const { user, logout } = useAuth();

  if (!user) return <Login />;

  return <Dashboard user={user} onLogout={logout} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;