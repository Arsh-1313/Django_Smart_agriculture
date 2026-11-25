import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  MapPin,
  Calendar,
  X,
  Phone,
  ArrowRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import marketplaceApi from '../../api/marketplace';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await marketplaceApi.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this purchase order? Produce stock will be returned to the farmer.')) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await marketplaceApi.updateOrderStatus(orderId, {
        status: 'cancelled',
        remarks: 'Order cancelled by buyer before dispatch.'
      });
      if (res.success) {
        setSuccessMsg('Order cancelled successfully.');
        fetchOrders();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  // Stats
  const totalSpend = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'requested').length;
  const inTransitCount = orders.filter(o => o.status === 'shipped').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Procurement & Contracts</span>
          </div>
          <h1 className="text-2xl font-bold">My Purchase Orders</h1>
          <p className="text-slate-300 text-xs mt-1">
            Track fulfillment status, view farmer dispatch details, and review contract totals.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-medium flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Orders</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{orders.length}</span>
          <span className="text-[11px] text-slate-400">All procurement requests</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Pending Acceptance</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{pendingCount}</span>
          <span className="text-[11px] text-slate-400">With farmer</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">In Transit</span>
          <span className="text-2xl font-bold text-purple-600 mt-1 block">{inTransitCount}</span>
          <span className="text-[11px] text-slate-400">Dispatched lots</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Settled Spend</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">₹{totalSpend.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400">Delivered orders</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        {['all', 'requested', 'accepted', 'shipped', 'delivered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`pb-2.5 px-3 font-bold uppercase tracking-wider transition whitespace-nowrap ${
              filterStatus === st
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {st} {st === 'all' ? `(${orders.length})` : `(${orders.filter(o => o.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
          Loading your procurement orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Browse the produce marketplace to place purchase orders directly with verified farmers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const isPending = o.status === 'requested';

            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm font-mono">{o.order_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'requested'
                            ? 'bg-amber-100 text-amber-800'
                            : o.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : o.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : o.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Placed on {new Date(o.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-emerald-700 block">
                      ₹{o.total_price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {o.quantity_quintals} Qtl @ ₹{o.price_per_quintal}/Qtl
                    </span>
                  </div>
                </div>

                {/* Progress tracker */}
                <div className="py-2">
                  <div className="grid grid-cols-4 text-center text-xs">
                    {[
                      { key: 'requested', label: '1. Requested' },
                      { key: 'accepted', label: '2. Accepted' },
                      { key: 'shipped', label: '3. Shipped' },
                      { key: 'delivered', label: '4. Delivered' }
                    ].map((step, idx) => {
                      const statusWeights = { requested: 1, accepted: 2, shipped: 3, delivered: 4, cancelled: 0 };
                      const currentWeight = statusWeights[o.status] || 0;
                      const isComplete = currentWeight >= (idx + 1);
                      const isCurrent = currentWeight === (idx + 1);

                      return (
                        <div key={step.key} className="space-y-1">
                          <div className={`h-1.5 rounded-full ${
                            o.status === 'cancelled'
                              ? 'bg-red-200'
                              : isComplete
                              ? 'bg-emerald-500'
                              : 'bg-slate-200'
                          }`} />
                          <span className={`text-[11px] font-semibold block ${
                            isCurrent
                              ? 'text-emerald-700 font-bold'
                              : isComplete
                              ? 'text-slate-700'
                              : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Produce Sourced</span>
                    <span className="font-bold text-slate-800">{o.crop_name}</span>
                    <span className="text-slate-500 block text-[11px]">{o.variety} • {o.quality_grade}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Farmer Contact</span>
                    <span className="font-semibold text-slate-800">{o.farmer_name}</span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{o.buyer_contact}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Godown</span>
                    <span className="text-slate-700 text-[11px] line-clamp-2">{o.delivery_address}</span>
                  </div>
                </div>

                {/* Status history comments & actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="text-[11px] text-slate-500">
                    {o.status_history?.length > 0 && (
                      <span>Latest Note: {o.status_history[o.status_history.length - 1].remarks}</span>
                    )}
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleCancelOrder(o.id)}
                      disabled={actionLoading}
                      className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition"
                    >
                      Cancel Purchase Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;
