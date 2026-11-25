import React, { useState, useEffect } from 'react';
import { supportAPI } from '../../api/support';
import {
  HelpCircle,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  Send,
  RefreshCw,
  Briefcase
} from 'lucide-react';

const BuyerSupport = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('marketplace');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await supportAPI.getMyComplaints();
      setComplaints(res?.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please fill out both Subject and Message.');
      return;
    }

    setSubmitting(true);
    try {
      await supportAPI.createComplaint({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      });
      setSuccessMsg('Your inquiry / grievance has been registered.');
      setSubject('');
      setMessage('');
      setShowForm(false);
      fetchTickets();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err?.message || 'Failed to submit grievance.');
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
            <Briefcase className="w-7 h-7 text-blue-600" />
            Buyer Help Desk & Commercial Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lodge inquiries regarding wholesale orders, logistics delays, quality disputes, or seller communications.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTickets}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            {showForm ? 'Cancel Ticket' : 'Open Ticket'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Ticket Creation Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Lodge a Commercial Grievance or Support Ticket
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="marketplace">Order Dispute & Delivery Logistics</option>
                  <option value="billing">Invoicing, GST & Payment Transfer</option>
                  <option value="technical">Platform Technical Issue</option>
                  <option value="other">General Commercial Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="low">Low (General Query)</option>
                  <option value="medium">Medium (Standard Request)</option>
                  <option value="high">High (Delivery Delay / Urgent)</option>
                  <option value="urgent">Urgent (Immediate Mediation)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Discrepancy in moisture grade for Wheat Order #1002"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Details</label>
              <textarea
                rows="4"
                placeholder="Provide complete facts, order numbers, seller details, and evidence..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900">Your Commercial Support Tickets</h3>
          <span className="text-xs text-slate-500">{complaints.length} tickets recorded</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Loading support history...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-blue-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No open commercial disputes</p>
            <p className="text-xs text-slate-400 mt-0.5">Need help with an order or transaction? Click "Open Ticket" above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
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
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize">
                      {ticket.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{ticket.subject}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{ticket.message}</p>

                {ticket.admin_response ? (
                  <div className="mt-2 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-0.5">
                    <strong className="block text-[10px] text-blue-700 uppercase font-black">
                      Official Admin Resolution:
                    </strong>
                    <p className="text-slate-800 leading-relaxed">{ticket.admin_response}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Case is pending investigation by the platform mediation team.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerSupport;
