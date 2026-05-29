import React, { useState, useEffect } from 'react';
import { ClipboardList, BarChart3, Users, Sun, Moon, LogOut } from 'lucide-react';
import { User, Page } from '../types';
import * as api from '../api';

interface DashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [todayStats, setTodayStats] = useState({ morningTotal: 0, nightTotal: 0 });
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await api.getProductionStats(today);
      setTodayStats(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const currentHour = new Date().getHours();
  const currentShift = currentHour >= 6 && currentHour < 18 ? 'Morning' : 'Night';

  return (
    <div className="min-h-screen bg-base-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Natural Ice" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-base-content">Natural Ice Production</h1>
            <p className="text-sm text-base-content/60">Welcome, {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary">{user.role}</span>
          {user.team && <span className="badge badge-secondary">Team {user.team}</span>}
          {user.shift && (
            <span className="badge badge-outline">
              {user.shift === 'M' ? 'Morning' : 'Night'}
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Today info */}
      <div className="card bg-base-200 mb-6">
        <div className="card-body py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base-content/60 text-sm">Today</p>
              <p className="text-lg font-semibold text-base-content">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentShift === 'Morning' ? (
                <Sun className="text-warning" size={20} />
              ) : (
                <Moon className="text-info" size={20} />
              )}
              <span className="text-base-content font-medium">{currentShift} Shift</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-200">
          <div className="card-body py-4 items-center text-center">
            <Sun className="text-warning opacity-60" size={24} />
            <p className="text-sm text-base-content/60">Morning Total</p>
            <p className="text-2xl font-bold text-base-content">{todayStats.morningTotal}</p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body py-4 items-center text-center">
            <Moon className="text-info opacity-60" size={24} />
            <p className="text-sm text-base-content/60">Night Total</p>
            <p className="text-2xl font-bold text-base-content">{todayStats.nightTotal}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid gap-3">
        <button
          className="btn btn-primary btn-lg justify-start gap-3"
          onClick={() => onNavigate('shift-entry')}
        >
          <ClipboardList size={22} />
          Enter Shift Production Data
        </button>
        <button
          className="btn btn-secondary btn-lg justify-start gap-3"
          onClick={() => onNavigate('monthly-summary')}
        >
          <BarChart3 size={22} />
          Monthly Summary
        </button>
        {user.role === 'admin' && (
          <button
            className="btn btn-outline btn-lg justify-start gap-3"
            onClick={() => onNavigate('user-management')}
          >
            <Users size={22} />
            Manage Users
          </button>
        )}
      </div>
    </div>
  );
};
