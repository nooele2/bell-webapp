import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login.jsx';
import ManageSchedules from './pages/ManageSchedules';

function AppContent() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const handleManageSchedules = () => {
    setCurrentPage('manage-schedules');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'manage-schedules') {
    return <ManageSchedules onBack={handleBackToDashboard} />;
  }

  return <Dashboard user={user} onLogout={logout} onManageSchedules={handleManageSchedules} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;