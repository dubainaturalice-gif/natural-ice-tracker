import React, { useState, useEffect } from 'react';
import { User, Page } from './types';
import { getStoredUser, getStoredToken, getProductionStats, logout } from './api';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ShiftEntry } from './components/ShiftEntry';
import { MonthlySummary } from './components/MonthlySummary';
import { UserManagement } from './components/UserManagement';

const App: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    // Check for existing token and validate
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      // Validate token by making a request
      const today = new Date().toISOString().slice(0, 10);
      getProductionStats(today)
        .then(() => {
          setUser(storedUser);
          setReady(true);
        })
        .catch(() => {
          logout();
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setPage('dashboard');
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={(u) => { setUser(u); setPage('dashboard'); }} />;
  }

  switch (page) {
    case 'shift-entry':
      return <ShiftEntry user={user} onBack={() => setPage('dashboard')} />;
    case 'monthly-summary':
      return <MonthlySummary onBack={() => setPage('dashboard')} />;
    case 'user-management':
      return <UserManagement onBack={() => setPage('dashboard')} />;
    default:
      return <Dashboard user={user} onNavigate={setPage} onLogout={handleLogout} />;
  }
};

export default App;
