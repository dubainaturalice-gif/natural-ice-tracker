import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { User, UserRole } from '../types';
import * as api from '../api';

interface UserManagementProps {
  onBack: () => void;
}

interface EditingUser {
  id: number | null;
  username: string;
  name: string;
  password: string;
  role: UserRole;
  team: number | null;
  shift: string | null;
}

const emptyUser: EditingUser = {
  id: null,
  username: '',
  name: '',
  password: '',
  role: 'worker',
  team: 1,
  shift: 'M',
};

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const rows = await api.getUsers();
      setUsers(rows);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async () => {
    if (!editing) return;
    if (!editing.username || !editing.name || !editing.password) {
      setError('All fields are required');
      return;
    }
    setError('');
    try {
      const teamVal = editing.role === 'worker' ? editing.team : null;
      const shiftVal = editing.role === 'worker' ? (editing.shift || 'M') : null;

      const data = {
        username: editing.username,
        name: editing.name,
        password: editing.password,
        role: editing.role,
        team: teamVal,
        shift: shiftVal,
      };

      if (editing.id === null) {
        await api.createUser(data);
      } else {
        await api.updateUser(editing.id, data);
      }
      setEditing(null);
      await loadUsers();
    } catch (err: unknown) {
      console.error('Failed to save user:', err);
      setError(err instanceof Error ? err.message : 'Failed to save. Username may already exist.');
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-3">
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-base-content flex-1">User Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ ...emptyUser })}>
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card bg-base-200 mb-4">
          <div className="card-body py-3 px-4">
            <h3 className="font-semibold text-sm mb-2">
              {editing.id === null ? 'New User' : 'Edit User'}
            </h3>
            {error && <div className="alert alert-error text-sm py-1 mb-2">{error}</div>}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Username"
                className="input input-bordered input-sm"
                value={editing.username}
                onChange={(e) => setEditing({ ...editing, username: e.target.value })}
              />
              <input
                type="text"
                placeholder="Full Name"
                className="input input-bordered input-sm"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Password"
                className="input input-bordered input-sm"
                value={editing.password}
                onChange={(e) => setEditing({ ...editing, password: e.target.value })}
              />
              <select
                className="select select-bordered select-sm"
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value as UserRole })}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="worker">Worker</option>
              </select>
              {editing.role === 'worker' && (
                <>
                  <select
                    className="select select-bordered select-sm"
                    value={editing.team || 1}
                    onChange={(e) => setEditing({ ...editing, team: parseInt(e.target.value) })}
                  >
                    <option value={1}>Production Team 1</option>
                    <option value={2}>Cutting Team 2</option>
                  </select>
                  <select
                    className="select select-bordered select-sm"
                    value={editing.shift || 'M'}
                    onChange={(e) => setEditing({ ...editing, shift: e.target.value })}
                  >
                    <option value="M">Morning Shift</option>
                    <option value="N">Night Shift</option>
                  </select>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-primary btn-sm" onClick={saveUser}>
                <Save size={14} /> Save
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setError(''); }}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Team</th>
                <th>Shift</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.username}</td>
                  <td>{u.name}</td>
                  <td><span className="badge badge-sm badge-primary">{u.role}</span></td>
                  <td>{u.team ? `Team ${u.team}` : '—'}</td>
                  <td>{u.shift === 'M' ? 'Morning' : u.shift === 'N' ? 'Night' : '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() =>
                          setEditing({
                            id: u.id,
                            username: u.username,
                            name: u.name,
                            password: '',
                            role: u.role,
                            team: u.team,
                            shift: u.shift,
                          })
                        }
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => deleteUser(u.id)}
                        disabled={u.username === 'admin'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
