import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Loader2,
  RefreshCw,
  User,
  ArrowRight
} from 'lucide-react';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('resolved');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getComplaints(params);
      setComplaints(res?.data || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleOpenResolve = (ticket) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.admin_response || '');
    setNewStatus(ticket.status === 'open' ? 'resolved' : ticket.status);
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!adminResponse.trim()) {
      alert('Please provide resolution remarks or an official response.');
      return;
    }

    setSubmitting(true);
    try {
      await adminAPI.resolveComplaint(selectedTicket.id, {
        status: newStatus,
        admin_response: adminResponse.trim(),
      });
      setSuccessMsg(`Ticket #${selectedTicket.id.slice(-6)} marked as ${newStatus}.`);
      setSelectedTicket(null);
      fetchComplaints();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.message || 'Failed to update ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-purple-600" />
            Grievances & Complaints Redressal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, investigate, and resolve support requests, payment issues, and platform disputes from farmers and buyers.
          </p>
        </div>
        <button
          onClick={fetchComplaints}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        {[
          { label: 'All Tickets', value: '' },
          { label: '🔴 Open', value: 'open' },
          { label: '🟡 In Progress', value: 'in_progress' },
          { label: '🟢 Resolved', value: 'resolved' },
          { label: '⚪ Closed', value: 'closed' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
            <span className="text-xs">Loading grievance registry...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No complaints in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      #{ticket.id.slice(-6)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.status === 'open'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : ticket.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold capitalize">
                      {ticket.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{ticket.subject}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ticket.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span>Raised by: <strong className="text-slate-800">@{ticket.username}</strong> ({ticket.role})</span>
                    <span>Contact: {ticket.email}</span>
                  </div>
                  {ticket.admin_response && (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900">
                      <strong className="block text-[10px] text-purple-700 uppercase font-black">Official Resolution:</strong>
                      <span className="mt-0.5 block">{ticket.admin_response}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenResolve(ticket)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {ticket.admin_response ? 'Update Resolution' : 'Review & Resolve'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Review & Resolve Grievance</h3>
                <p className="text-xs text-slate-500">Ticket #{selectedTicket.id.slice(-6)} — {selectedTicket.category}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedTicket.subject}</p>
              <p className="text-slate-600 leading-relaxed">{selectedTicket.message}</p>
              <div className="text-[11px] text-slate-400 pt-1">
                From: @{selectedTicket.username} ({selectedTicket.role}) &bull; {selectedTicket.email}
              </div>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="in_progress">🟡 In Progress (Under Investigation)</option>
                  <option value="resolved">🟢 Resolved (Solution Provided)</option>
                  <option value="closed">⚪ Closed (Case Finished)</option>
                  <option value="rejected">🔴 Rejected (Invalid Request)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Administrative Response / Action Taken
                </label>
                <textarea
                  rows="4"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Explain the findings, steps taken, or payment/order resolution..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
