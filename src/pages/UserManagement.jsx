// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get("/api/users", { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.status === 'active' ? 'deactivate' : 'activate'} ${user.fullName}?`)) {
      return;
    }

    try {
      await api.post(`/api/users/${user._id}/toggle-status`);
      fetchUsers();
      alert(`User ${user.status === 'active' ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error("Error toggling status:", err);
      alert(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/users/${selectedUser._id}`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#ef4444',
      manager: '#3b82f6',
      sales_person: '#10b981',
      viewer: '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      manager: 'Manager',
      sales_person: 'Sales Person',
      viewer: 'Viewer'
    };
    return labels[role] || role;
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>User Management</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Manage users and their access levels</p>
        </div>
        <button 
          className="btn primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New User
        </button>
      </div>

      {/* Filters */}
      <div className="user-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
          style={{ flex: 1, maxWidth: 300 }}
        />
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-input"
          style={{ width: 150 }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="sales_person">Sales Person</option>
          <option value="viewer">Viewer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-input"
          style={{ width: 150 }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
          <button
            className="btn"
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="card table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner"></div>
            <div style={{ marginTop: 12, color: '#6b7280' }}>Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            No users found
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th onClick={() => handleSort('email')} className="sortable">
                      Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Phone</th>
                    <th onClick={() => handleSort('role')} className="sortable">
                      Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')} className="sortable">
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('createdAt')} className="sortable">
                      Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="user-avatar">
                            {getInitials(user.fullName || user.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.fullName || user.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span 
                          className="role-badge"
                          style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${user.status}`}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === 'active' ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDateTime(user.lastLogin)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            title="Edit user"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetPasswordModal(true);
                            }}
                            title="Reset password"
                          >
                            🔑
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="pagination-controls">
                <select 
                  value={pagination.limit} 
                  onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  className="pagination-select"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
                <button 
                  className="btn" 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </button>
                <span className="page-indicator">Page {pagination.page} of {pagination.pages}</span>
                <button 
                  className="btn" 
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
          onPasswordGenerated={(pwd) => setGeneratedPassword(pwd)}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDeleteUser}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({ onClose, onSuccess, onPasswordGenerated }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "viewer"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/users", formData);
      setGeneratedPassword(res.data.generatedPassword);
      onPasswordGenerated(res.data.generatedPassword);
      alert(`User created successfully!\n\nGenerated Password: ${res.data.generatedPassword}\n\nPlease save this password and share it with the user.`);
      onSuccess();
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New User</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert">{error}</div>}

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                minLength={3}
                maxLength={100}
                className="filter-input"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="filter-input"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="filter-input"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="filter-input"
              >
                <option value="viewer">Viewer</option>
                <option value="sales_person">Sales Person</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="info-box">
              <strong>ℹ️ Note:</strong> A secure password will be auto-generated and displayed after creation.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || "",
    role: user.role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.put(`/api/users/${user._id}`, formData);
      alert("User updated successfully");
      onSuccess();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert">{error}</div>}

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                minLength={3}
                maxLength={100}
                className="filter-input"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="filter-input"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="filter-input"
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="filter-input"
              >
                <option value="viewer">Viewer</option>
                <option value="sales_person">Sales Person</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ user, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete User</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{user.fullName || user.name || user.email}</strong>?</p>
          <p style={{ color: '#ef4444', fontSize: 14 }}>
            This action cannot be undone. All user data and QR assignments will be permanently deleted.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ background: '#ef4444', color: '#fff' }} onClick={onConfirm}>
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// Reset Password Modal
function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/api/users/${user._id}/reset-password`);
      setNewPassword(res.data.newPassword);
      alert(`Password reset successfully!\n\nNew Password: ${res.data.newPassword}\n\nPlease save this password and share it with the user.`);
      onSuccess();
    } catch (err) {
      console.error("Error resetting password:", err);
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reset Password</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Reset password for <strong>{user.fullName || user.name || user.email}</strong>?</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            A new secure password will be generated. The user will be required to change it on next login.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={handleReset} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
