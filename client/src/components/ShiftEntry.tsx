import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { ProductionGrid } from './ProductionGrid';
import { MaterialsForm } from './MaterialsForm';

interface ShiftEntryProps {
  user: User;
  onBack: () => void;
}

export const ShiftEntry: React.FC<ShiftEntryProps> = ({ user, onBack }) => {
  const today = new Date().toISOString().slice(0, 10);
  const currentHour = new Date().getHours();
  const defaultShift = currentHour >= 6 && currentHour < 18 ? 'M' : 'N';

  const [date, setDate] = useState(today);
  const [shift, setShift] = useState(user.shift || defaultShift);
  const [activeTeam, setActiveTeam] = useState(user.team || 1);
  const [activeTab, setActiveTab] = useState<'production' | 'materials'>('production');

  const canChangeTeam = user.role === 'admin' || user.role === 'manager';
  const canChangeShift = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="min-h-screen bg-base-100 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-base-content flex-1">Shift Production Entry</h2>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="date"
          className="input input-bordered input-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex gap-1">
          <button
            className={`btn btn-sm ${shift === 'M' ? 'btn-warning' : 'btn-ghost'}`}
            onClick={() => canChangeShift && setShift('M')}
            disabled={!canChangeShift && shift !== 'M'}
          >
            <Sun size={14} /> Morning
          </button>
          <button
            className={`btn btn-sm ${shift === 'N' ? 'btn-info' : 'btn-ghost'}`}
            onClick={() => canChangeShift && setShift('N')}
            disabled={!canChangeShift && shift !== 'N'}
          >
            <Moon size={14} /> Night
          </button>
        </div>

        {canChangeTeam && (
          <div className="flex gap-1">
            <button
              className={`btn btn-sm ${activeTeam === 1 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTeam(1)}
            >
              Production Team 1
            </button>
            <button
              className={`btn btn-sm ${activeTeam === 2 ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setActiveTeam(2)}
            >
              Cutting Team 2
            </button>
          </div>
        )}
      </div>

      {/* Tab selection */}
      <div className="tabs tabs-boxed mb-4 bg-base-200">
        <button
          className={`tab ${activeTab === 'production' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('production')}
        >
          Production
        </button>
        <button
          className={`tab ${activeTab === 'materials' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          Raw Materials
        </button>
      </div>

      {/* Content */}
      {activeTab === 'production' ? (
        <ProductionGrid date={date} shift={shift} team={activeTeam} userRole={user.role} />
      ) : (
        <MaterialsForm date={date} shift={shift} team={activeTeam} userRole={user.role} />
      )}
    </div>
  );
};
