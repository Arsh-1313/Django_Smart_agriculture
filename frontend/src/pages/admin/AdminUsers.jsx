import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  Sprout,
  Briefcase,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await adminAPI.getUsers(params);
      setUsers(res?.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await adminAPI.toggleUserStatus(user.id, !user.is_active);
      setMessage(`User ${user.username} has been ${action}ed.`);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_active: !user.is_active });
      }
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            User Management & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Oversee registered farmers, wholesale buyers, and account operational status across the platform.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {message}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Role Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {[
            { label: 'All Users', value: '' },
            { label: '🌱 Farmers', value: 'farmer' },
            { label: '💼 Buyers', value: 'buyer' },
            { label: '🛡️ Admins', value: 'admin' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                roleFilter === tab.value
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
            <span className="text-xs">Loading user registry...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No users found matching query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location / Business</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'farmer'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {fullName[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{fullName}</p>
                            <p className="text-[11px] text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'farmer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role === 'farmer' && <Sprout className="w-3 h-3" />}
                          {u.role === 'buyer' && <Briefcase className="w-3 h-3" />}
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-700 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {u.email}
                        </p>
                        {u.phone && (
                          <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {u.phone}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.role === 'farmer' && u.profile ? (
                          <span>
                            {u.profile.village ? `${u.profile.village}, ` : ''}
                            {u.profile.district || u.profile.state || 'India'}
                          </span>
                        ) : u.role === 'buyer' && u.profile ? (
                          <div>
                            <p className="font-medium text-slate-800">{u.profile.business_name || 'Commercial Buyer'}</p>
                            <p className="text-[11px] text-slate-400">{u.profile.city || u.profile.state || ''}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                u.is_active
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">User Profile Details</h3>
                <p className="text-xs text-slate-500">ID: {selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Username:</span>
                <span className="font-bold text-slate-800">@{selectedUser.username}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Role:</span>
                <span className="font-bold text-purple-700 capitalize">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email:</span>
                <span className="font-semibold text-slate-800">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone:</span>
                <span className="font-semibold text-slate-800">{selectedUser.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Status:</span>
                <span className={`font-bold ${selectedUser.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedUser.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Registered:</span>
                <span className="text-slate-600">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Profile Specifics */}
            {selectedUser.profile && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Role Specific Profile
                </p>
                {selectedUser.role === 'farmer' ? (
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><span className="text-slate-400">State:</span> {selectedUser.profile.state || 'N/A'}</div>
                    <div><span className="text-slate-400">District:</span> {selectedUser.profile.district || 'N/A'}</div>
                    <div><span className="text-slate-400">Village:</span> {selectedUser.profile.village || 'N/A'}</div>
                    <div><span className="text-slate-400">Experience:</span> {selectedUser.profile.experience_years || 0} years</div>
                    <div><span className="text-slate-400">Language:</span> {selectedUser.profile.preferred_language || 'English'}</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><span className="text-slate-400">Business:</span> {selectedUser.profile.business_name || 'N/A'}</div>
                    <div><span className="text-slate-400">Type:</span> {selectedUser.profile.business_type || 'wholesaler'}</div>
                    <div><span className="text-slate-400">GST / Reg:</span> {selectedUser.profile.gst_number || selectedUser.profile.gst_or_license || 'N/A'}</div>
                    <div><span className="text-slate-400">Address:</span> {selectedUser.profile.address || selectedUser.profile.delivery_address || 'N/A'}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
