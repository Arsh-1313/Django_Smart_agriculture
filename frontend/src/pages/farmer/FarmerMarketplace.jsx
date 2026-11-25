import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  Package,
  Layers,
  MapPin,
  Calendar,
  X,
  Phone,
  FileText
} from 'lucide-react';
import marketplaceApi from '../../api/marketplace';
import cropsApi from '../../api/crops';

const FarmerMarketplace = () => {
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'orders'
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cropsList, setCropsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create Listing Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [listingForm, setListingForm] = useState({
    crop_name: 'Wheat',
    variety: 'Sharbati Gold',
    quantity_quintals: 50,
    price_per_quintal: 2450,
    quality_grade: 'Grade A',
    harvest_date: new Date().toISOString().split('T')[0],
    state: 'Madhya Pradesh',
    district: 'Sehore',
    description: 'High quality sun-dried grain, freshly harvested and moisture-tested.'
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [listingsRes, ordersRes, cropsRes] = await Promise.all([
        marketplaceApi.getMyListings(),
        marketplaceApi.getOrders(),
        cropsApi.getCrops().catch(() => ({ data: [] }))
      ]);

      if (listingsRes.success) setListings(listingsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (cropsRes.data) setCropsList(cropsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load marketplace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await marketplaceApi.createListing(listingForm);
      if (res.success) {
        setSuccessMsg('Produce listing published successfully to marketplace!');
        setShowCreateModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, remarks = '') => {
    setActionLoading(true);
    try {
      const res = await marketplaceApi.updateOrderStatus(orderId, {
        status: newStatus,
        remarks: remarks || `Order marked as ${newStatus}`
      });
      if (res.success) {
        setSuccessMsg(`Order updated to ${newStatus}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to withdraw this listing from the market?')) return;
    try {
      const res = await marketplaceApi.deleteListing(listingId);
      if (res.success) {
        setSuccessMsg('Listing withdrawn.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to withdraw listing.');
    }
  };

  // Stats calculation
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'active').length;
  const pendingOrders = orders.filter(o => o.status === 'requested').length;
  const totalSalesRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, curr) => acc + (curr.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Direct Agri-Marketplace</span>
          </div>
          <h1 className="text-2xl font-bold">Produce Listings & Buyer Orders</h1>
          <p className="text-slate-300 text-xs mt-1">
            Publish your harvested crops directly to wholesale buyers without middlemen commissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-medium flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-md shadow-emerald-500/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>List Produce for Sale</span>
          </button>
        </div>
      </div>

      {/* Feedback alerts */}
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Listings</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{activeListings}</div>
          <div className="text-[11px] text-slate-400 mt-1">{totalListings} total published</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingOrders}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting your approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{orders.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">B2B purchase deals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Fulfilled Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">₹{totalSalesRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">From delivered orders</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'listings'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          My Listed Produce ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Incoming Buyer Orders ({orders.length})</span>
          {pendingOrders > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
              {pendingOrders}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Produce Listed Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Put your harvested produce on the national marketplace so verified grain aggregators and buyers can send purchase requests.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow"
              >
                Create First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((item) => {
                const avail = item.available_quantity;
                const total = item.quantity_quintals;
                const percentLeft = Math.round((avail / (total || 1)) * 100);

                return (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">
                          {item.quality_grade || 'Grade A'}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 mt-1">{item.crop_name}</h3>
                        <p className="text-xs text-slate-500">{item.variety || 'Standard Variety'}</p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'sold_out'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Price / Quintal:</span>
                        <span className="font-bold text-emerald-700 text-sm">₹{item.price_per_quintal.toLocaleString()}</span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Available Stock:</span>
                          <span className="font-semibold text-slate-700">{avail} / {total} Qtl ({percentLeft}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percentLeft > 30 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentLeft}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center text-[11px] text-slate-500 gap-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.district}, {item.state}</span>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg line-clamp-2">
                          "{item.description}"
                        </p>
                      )}
                    </div>

                    {item.status === 'active' && (
                      <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleWithdrawListing(item.id)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                        >
                          Withdraw Listing
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Orders Received Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                When wholesale buyers send purchase requests against your produce listings, they will show up here for you to accept and dispatch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Buyer & Contact</th>
                    <th className="py-3 px-4">Produce Details</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{o.order_number}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block">{o.buyer_name}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{o.buyer_contact}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{o.crop_name}</span>
                        <span className="text-slate-400 block text-[10px]">{o.variety} • {o.quality_grade}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {o.quantity_quintals} Quintals
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 text-sm">₹{o.total_price.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block">@ ₹{o.price_per_quintal}/Qtl</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
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
                      </td>

                      <td className="py-3 px-4 text-right">
                        {o.status === 'requested' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, 'accepted')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, 'cancelled', 'Rejected by farmer.')}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-[11px]"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {o.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'shipped')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] inline-flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Mark Shipped</span>
                          </button>
                        )}

                        {o.status === 'shipped' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {(o.status === 'delivered' || o.status === 'cancelled') && (
                          <span className="text-[11px] text-slate-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Listing */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Publish Produce Listing</h2>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Crop Name</label>
                  <input
                    type="text"
                    list="crops-datalist"
                    value={listingForm.crop_name}
                    onChange={(e) => setListingForm({ ...listingForm, crop_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Wheat"
                    required
                  />
                  <datalist id="crops-datalist">
                    {cropsList.map(c => <option key={c.id || c.name} value={c.name} />)}
                  </datalist>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Variety</label>
                  <input
                    type="text"
                    value={listingForm.variety}
                    onChange={(e) => setListingForm({ ...listingForm, variety: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Sharbati Gold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity (Quintals)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={listingForm.quantity_quintals}
                    onChange={(e) => setListingForm({ ...listingForm, quantity_quintals: parseFloat(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price per Quintal (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={listingForm.price_per_quintal}
                    onChange={(e) => setListingForm({ ...listingForm, price_per_quintal: parseFloat(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quality Grade</label>
                  <select
                    value={listingForm.quality_grade}
                    onChange={(e) => setListingForm({ ...listingForm, quality_grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Grade A">Grade A (Export / Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Milling)</option>
                    <option value="Organic">Organic Certified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={listingForm.state}
                    onChange={(e) => setListingForm({ ...listingForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District</label>
                  <input
                    type="text"
                    value={listingForm.district}
                    onChange={(e) => setListingForm({ ...listingForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harvest Date</label>
                  <input
                    type="date"
                    value={listingForm.harvest_date}
                    onChange={(e) => setListingForm({ ...listingForm, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Quality Notes</label>
                <textarea
                  rows="3"
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Detail moisture level, grain color, drying method, etc."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Publish Listing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerMarketplace;
