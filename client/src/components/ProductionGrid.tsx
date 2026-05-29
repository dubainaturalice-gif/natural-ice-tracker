import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Loader } from 'lucide-react';
import { MORNING_HOURS, NIGHT_HOURS, TEAM1_PRODUCTS, TEAM2_PRODUCTS } from '../utils/data';
import * as api from '../api';

interface ProductionGridProps {
  date: string;
  shift: string;
  team: number;
  userRole: string;
}

export const ProductionGrid: React.FC<ProductionGridProps> = ({ date, shift, team, userRole }) => {
  const products = team === 1 ? TEAM1_PRODUCTS : TEAM2_PRODUCTS;
  const hours = shift === 'M' ? MORNING_HOURS : NIGHT_HOURS;
  const allCols = [...hours, 'DISPATCH'];

  const [grid, setGrid] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lockedCells, setLockedCells] = useState<Set<string>>(new Set());

  const isPrivileged = userRole === 'admin' || userRole === 'manager';
  const cellKey = (product: string, hour: string) => `${product}::${hour}`;
  const isCellLocked = (product: string, hour: string) => !isPrivileged && lockedCells.has(cellKey(product, hour));
  const allLocked = !isPrivileged && products.every(p => allCols.every(h => lockedCells.has(cellKey(p, h))));
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef(grid);
  gridRef.current = grid;

  useEffect(() => {
    loadData();
  }, [date, shift, team]);

  const loadData = async () => {
    setLoaded(false);
    setDirty(false);
    try {
      const rows = await api.getProduction(date, shift, team);
      const newGrid: Record<string, Record<string, number>> = {};
      for (const p of products) {
        newGrid[p] = {};
        for (const h of allCols) {
          newGrid[p][h] = 0;
        }
      }
      const locked = new Set<string>();
      for (const row of rows) {
        const p = row.product;
        const h = row.hour;
        if (newGrid[p]) {
          newGrid[p][h] = row.quantity;
          if (row.quantity > 0) {
            locked.add(cellKey(p, h));
          }
        }
      }
      setLockedCells(locked);
      setGrid(newGrid);
    } catch (err) {
      console.error('Failed to load production data:', err);
      const newGrid: Record<string, Record<string, number>> = {};
      for (const p of products) {
        newGrid[p] = {};
        for (const h of allCols) {
          newGrid[p][h] = 0;
        }
      }
      setGrid(newGrid);
    } finally {
      setLoaded(true);
    }
  };

  const saveBatch = useCallback(async (gridData: Record<string, Record<string, number>>) => {
    const entries: Array<{ product: string; hour: string; quantity: number }> = [];
    for (const product of products) {
      for (const hour of allCols) {
        const qty = gridData[product]?.[hour] || 0;
        if (qty > 0) {
          entries.push({ product, hour, quantity: qty });
        }
      }
    }
    if (entries.length === 0) return;
    try {
      await api.saveProduction(date, shift, team, entries);
    } catch (err) {
      console.error('Failed to save batch:', err);
    }
    setDirty(false);
    // Lock newly saved cells for workers
    setLockedCells(prev => {
      const updated = new Set(prev);
      for (const product of products) {
        for (const hour of allCols) {
          const qty = gridData[product]?.[hour] || 0;
          if (qty > 0) updated.add(cellKey(product, hour));
        }
      }
      return updated;
    });
  }, [date, shift, team, products, allCols]);

  const handleChange = useCallback((product: string, hour: string, value: string) => {
    const num = parseInt(value) || 0;
    setGrid(prev => {
      const updated = {
        ...prev,
        [product]: {
          ...prev[product],
          [hour]: num,
        },
      };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveBatch(updated);
      }, 2000);
      return updated;
    });
    setDirty(true);
  }, [saveBatch]);

  const saveAll = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    try {
      await saveBatch(gridRef.current);
    } finally {
      setSaving(false);
    }
  };

  const getProductTotal = (product: string): number => {
    if (!grid[product]) return 0;
    return allCols.reduce((sum, h) => sum + (grid[product][h] || 0), 0);
  };

  if (!loaded) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-base-content">
          {team === 1 ? 'Production Team 1' : 'Cutting Team 2 — Luxury Ice'}
        </h3>
        {allLocked ? (
          <span className="badge badge-warning badge-sm gap-1">🔒 Fully Locked (Admin/Manager can edit)</span>
        ) : (
          <button className={`btn btn-sm ${dirty ? 'btn-warning' : 'btn-primary'}`} onClick={saveAll} disabled={saving}>
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {dirty ? 'Save Changes' : 'Save All'}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-base-300 z-10 min-w-[120px]">Product</th>
              {allCols.map(h => (
                <th key={h} className="text-center min-w-[60px]">{h}</th>
              ))}
              <th className="text-center font-bold bg-base-300 min-w-[60px]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const total = getProductTotal(product);
              return (
                <tr key={product}>
                  <td className="sticky left-0 bg-base-200 z-10 font-medium text-xs">{product}</td>
                  {allCols.map(hour => {
                    const locked = isCellLocked(product, hour);
                    return (
                      <td key={hour} className="p-0">
                        <input
                          type="number"
                          min="0"
                          className={`input input-bordered input-xs w-full text-center ${locked ? 'bg-base-200 cursor-not-allowed text-base-content/60' : ''}`}
                          value={grid[product]?.[hour] || ''}
                          onChange={(e) => !locked && handleChange(product, hour, e.target.value)}
                          readOnly={locked}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                  <td className="text-center font-bold text-primary">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
