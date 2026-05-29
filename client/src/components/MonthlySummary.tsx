import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { TEAM1_PRODUCTS, TEAM2_PRODUCTS } from '../utils/data';
import * as api from '../api';

const PALLET_RATES: Record<string, number> = {
  '1kg Tube': 60,
  '2kg Tube': 60,
  '10kg Tube': 80,
  '10kg Cube - HM': 80,
  '10kg Crushed': 80,
};

interface MonthlySummaryProps {
  onBack: () => void;
}

interface DailySummary {
  date: string;
  shift: string;
  team: number;
  product: string;
  total: number;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ onBack }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summaryData, setSummaryData] = useState<DailySummary[]>([]);
  const [activeTeam, setActiveTeam] = useState(1);
  const [shiftFilter, setShiftFilter] = useState<'all' | 'M' | 'N'>('all');
  const [loading, setLoading] = useState(true);

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    loadSummary();
  }, [year, month]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const rows = await api.getProductionSummary(startDate, endDate);
      setSummaryData(rows as DailySummary[]);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const matchesShift = (d: DailySummary) => shiftFilter === 'all' || d.shift === shiftFilter;

  const getProductDayTotal = (product: string, day: number): number => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return summaryData
      .filter(d => d.date === dateStr && d.product === product && d.team === activeTeam && matchesShift(d))
      .reduce((sum, d) => sum + d.total, 0);
  };

  const getProductMonthTotal = (product: string): number => {
    return summaryData
      .filter(d => d.product === product && d.team === activeTeam && matchesShift(d))
      .reduce((sum, d) => sum + d.total, 0);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const products = activeTeam === 1 ? TEAM1_PRODUCTS : TEAM2_PRODUCTS;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-base-100 p-3">
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-base-content flex-1">Monthly Summary</h2>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span className="font-semibold text-base-content min-w-[160px] text-center">{monthName}</span>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
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
        <div className="flex gap-1 ml-auto">
          <button
            className={`btn btn-sm ${shiftFilter === 'all' ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setShiftFilter('all')}
          >
            All Shifts
          </button>
          <button
            className={`btn btn-sm ${shiftFilter === 'M' ? 'btn-warning' : 'btn-ghost'}`}
            onClick={() => setShiftFilter('M')}
          >
            ☀ Morning
          </button>
          <button
            className={`btn btn-sm ${shiftFilter === 'N' ? 'btn-info' : 'btn-ghost'}`}
            onClick={() => setShiftFilter('N')}
          >
            ☽ Night
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra table-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-base-300 z-10 min-w-[120px]">Product</th>
                {days.map(d => (
                  <th key={d} className="text-center min-w-[50px]">
                    <div className="text-xs">{d}</div>
                    <div className="text-[10px] text-base-content/50">
                      {new Date(year, month - 1, d).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </th>
                ))}
                <th className="text-center font-bold bg-base-300 min-w-[60px]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const rate = PALLET_RATES[product];
                const monthTotal = getProductMonthTotal(product);
                return (
                  <React.Fragment key={product}>
                    {/* Quantity row */}
                    <tr>
                      <td className="sticky left-0 bg-base-200 z-10 font-medium text-xs">{product}</td>
                      {days.map(d => {
                        const val = getProductDayTotal(product, d);
                        return (
                          <td key={d} className={`text-center text-xs ${val > 0 ? 'text-base-content font-medium' : 'text-base-content/30'}`}>
                            {val || '-'}
                          </td>
                        );
                      })}
                      <td className="text-center font-bold text-primary">{monthTotal || '-'}</td>
                    </tr>
                    {/* Pallet row for Team 1 products with rates */}
                    {activeTeam === 1 && rate && (
                      <tr className="bg-green-50">
                        <td className="sticky left-0 bg-green-50 z-10 text-[10px] text-secondary italic pl-4">
                          ↳ Pallets ({rate}/pallet)
                        </td>
                        {days.map(d => {
                          const val = getProductDayTotal(product, d);
                          const pallets = val > 0 ? Math.round((val / rate) * 100) / 100 : 0;
                          return (
                            <td key={d} className={`text-center text-[10px] ${pallets > 0 ? 'text-secondary font-medium' : 'text-base-content/20'}`}>
                              {pallets > 0 ? pallets.toFixed(1) : '-'}
                            </td>
                          );
                        })}
                        <td className="text-center text-xs font-bold text-secondary">
                          {monthTotal > 0 ? (monthTotal / rate).toFixed(1) : '-'}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
