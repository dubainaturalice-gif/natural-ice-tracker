import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { User } from '../types';
import * as api from '../api';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username, password);
      onLogin(data.user);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center gap-2 mb-2">
            <img src="/logo.png" alt="Natural Ice" className="w-24 h-24 object-contain" />
            <h2 className="text-2xl font-bold text-base-content">Natural Ice Production</h2>
          </div>
          <p className="text-base-content/60 text-center text-sm mb-4">Production Tracker — Sign In</p>

          {error && (
            <div className="alert alert-error text-sm py-2">
              {error}
            </div>
          )}

          <div className="form-control gap-3">
            <input
              type="text"
              placeholder="Username"
              className="input input-bordered w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              className="btn btn-primary w-full"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
