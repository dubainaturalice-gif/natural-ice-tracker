import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Loader } from 'lucide-react';
import { TEAM1_MATERIALS, TEAM2_MATERIALS, MaterialCategory } from '../utils/data';
import * as api from '../api';

interface MaterialsFormProps {
  date: string;
  shift: string;
  team: number;
  userRole?: string;
}

interface MatRow {
  initial: number;
  using: number;
  initialFromPrev: boolean;
}

export const MaterialsForm: React.FC<MaterialsFormProps> = ({ date, shift, team, userRole }) => {
  const isAdmin = userRole === 'admin' || userRole === 'manager';
  const categories: MaterialCategory[] = team === 1 ? TEAM1_MATERIALS : TEAM2_MATERIALS;
  const allItems = categories.flatMap(c => c.items);
  const [values, setValues] = useState<Record<string, MatRow>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    loadData();
  }, [date, shift, team]);

  const loadData = async () => {
    setLoaded(false);
    setDirty(false);
    try {
      // Load current shift saved data
      const rows = await api.getMaterials(date, shift, team);
      const savedMap: Record<string, { initial: number; using: number }> = {};
      for (const row of rows) {
        savedMap[row.material] = {
          initial: row.initial_stock || 0,
          using: row.using_qty || 0,
        };
      }

      // Load previous shift data to compute carry-over finals
      const prevRows = await api.getPrevMaterials(date, shift, team);
      const prevFinals: Record<string, number> = {};
      let hasPrevData = false;
      for (const row of prevRows) {
        hasPrevData = true;
        const init = row.initial_stock || 0;
        const used = row.using_qty || 0;
        prevFinals[row.material] = init - used;
      }

      // Build values
      const currentData: Record<string, MatRow> = {};
      for (const item of allItems) {
        const prevFinal = prevFinals[item];
        const hasPrev = hasPrevData && prevFinal !== undefined;

        if (hasPrev) {
          const carryOver = Math.max(0, prevFinal);
          currentData[item] = {
            initial: carryOver,
            using: savedMap[item]?.using || 0,
            initialFromPrev: true,
          };
        } else if (savedMap[item]) {
          currentData[item] = {
            initial: savedMap[item].initial,
            using: savedMap[item].using,
            initialFromPrev: false,
          };
        } else {
          currentData[item] = { initial: 0, using: 0, initialFromPrev: false };
        }
      }

      setValues(currentData);
    } catch (err) {
      console.error('Failed to load materials:', err);
      const empty: Record<string, MatRow> = {};
      for (const item of allItems) {
        empty[item] = { initial: 0, using: 0, initialFromPrev: false };
      }
      setValues(empty);
    } finally {
      setLoaded(true);
    }
  };

  const saveBatch = useCallback(async (data: Record<string, MatRow>) => {
    const entries: Array<{ material: string; initial_stock: number; using_qty: number }> = [];
    for (const item of allItems) {
      const row = data[item] || { initial: 0, using: 0 };
      entries.push({
        material: item,
        initial_stock: row.initial,
        using_qty: row.using,
      });
    }

    if (entries.length === 0) return;

    try {
      await api.saveMaterials(date, shift, team, entries);
    } catch (err) {
      console.error('Failed to save materials batch:', err);
    }
    setDirty(false);
  }, [date, shift, team, allItems]);

  const handleChange = useCallback((material: string, field: 'initial' | 'using', value: string) => {
    const num = parseInt(value) || 0;
    setValues(prev => {
      const updated = { ...prev };
      updated[material] = { ...updated[material], [field]: num };
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
      await saveBatch(valuesRef.current);
    } finally {
      setSaving(false);
    }
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
          {team === 1 ? 'Production Team 1 — Raw Materials' : 'Cutting Team 2 — Raw Materials (Luxury Ice)'}
        </h3>
        <button className={`btn btn-sm ${dirty ? 'btn-warning' : 'btn-primary'}`} onClick={saveAll} disabled={saving}>
          {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          {dirty ? 'Save Changes' : 'Save All'}
        </button>
      </div>

      <p className="text-xs text-base-content/50 mb-3 italic">
        💡 Initial stock is auto-carried from the previous shift's final. Only admin/manager can manually adjust initial stock.
      </p>

      <div className="grid gap-4">
        {categories.map(cat => (
          <div key={cat.name} className="card bg-base-200">
            <div className="card-body py-3 px-4">
              <h4 className="font-semibold text-sm text-primary mb-2">{cat.name}</h4>
              {/* Header */}
              <div className="grid grid-cols-[1fr_90px_90px_70px] gap-1 mb-1 text-xs font-bold text-base-content/70">
                <span>Material</span>
                <span className="text-center">Initial</span>
                <span className="text-center">Using</span>
                <span className="text-center">Final</span>
              </div>
              {/* Rows */}
              {cat.items.map(item => {
                const row = values[item] || { initial: 0, using: 0, initialFromPrev: false };
                const final_stock = row.initial - row.using;
                return (
                  <div key={item} className="grid grid-cols-[1fr_90px_90px_70px] gap-1 items-center py-0.5">
                    <label className="text-xs text-base-content/80 truncate" title={item}>
                      {item}
                    </label>
                    {isAdmin ? (
                      <input
                        type="number"
                        min="0"
                        className={`input input-bordered input-xs text-center ${row.initialFromPrev ? 'border-warning' : ''}`}
                        value={row.initial || ''}
                        onChange={(e) => handleChange(item, 'initial', e.target.value)}
                        placeholder="0"
                        title={row.initialFromPrev ? "Admin override - auto-carried value" : "Enter initial stock"}
                      />
                    ) : (
                      <div className="input input-bordered input-xs text-center bg-base-300 text-base-content/60 flex items-center justify-center cursor-not-allowed" title={row.initialFromPrev ? "Auto-carried from previous shift" : "Only admin/manager can set initial stock"}>
                        {row.initial}
                      </div>
                    )}
                    <input
                      type="number"
                      min="0"
                      className="input input-bordered input-xs text-center"
                      value={row.using || ''}
                      onChange={(e) => handleChange(item, 'using', e.target.value)}
                      placeholder="0"
                    />
                    <div className={`text-xs text-center font-bold ${final_stock < 0 ? 'text-error' : 'text-success'}`}>
                      {final_stock}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
