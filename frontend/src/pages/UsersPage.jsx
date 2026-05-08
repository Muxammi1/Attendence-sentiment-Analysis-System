import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', 
    first_name: '', 
    last_name: '', 
    email: '', 
    role: 'FACULTY',
    password: 'faculty123' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    apiClient.get('/users/')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/users/', formData);
      setShowModal(false);
      setFormData({ 
        username: '', first_name: '', last_name: '', 
        email: '', role: 'FACULTY', password: 'faculty123' 
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.username?.[0] || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiClient.delete(`/users/${id}/`);
      fetchUsers();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <>
      <div className="card mb-16">
        <div className="flex gap-8 items-center">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search users..." />
          </div>
          <div className="tb-btn primary ml-auto" onClick={() => setShowModal(true)}>
            + Add New User
          </div>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="6">Loading users...</td></tr>}
            {!loading && users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 600 }}>@{user.username}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email || 'N/A'}</td>
                <td>
                  <span className={`pill ${user.role === 'ADMIN' ? 'done' : 'active'} dot`}>
                    {user.role}
                  </span>
                </td>
                <td><span className="pill done dot">Active</span></td>
                <td>
                  <div className="flex gap-8">
                    <span className="tb-btn" style={{ color: '#f85149' }} onClick={() => deleteUser(user.id)}>Delete</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-title">Add New Staff / Faculty</div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-select" required value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-select" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="flex gap-8">
                <div className="form-group flex-1">
                  <label className="form-label">First Name</label>
                  <input className="form-select" value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Last Name</label>
                  <input className="form-select" value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {error && <div style={{ color: '#f85149', fontSize: '12px', marginBottom: '10px' }}>{error}</div>}
              <div className="flex gap-8 mt-24" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="tb-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="tb-btn primary" disabled={submitting}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; alignItems: center; justifyContent: center; z-index: 1000;
        }
        .modal-content {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 32px; width: 440px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .flex-1 { flex: 1; }
      `}</style>
    </>
  );
}
