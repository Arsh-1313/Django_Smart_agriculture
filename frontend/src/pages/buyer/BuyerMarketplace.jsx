import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  Filter,
  ShoppingBag,
  MapPin,
  IndianRupee,
  Calendar,
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  PackageCheck,
  ShieldCheck,
  Info,
  MessageSquare
} from 'lucide-react';
import marketplaceApi from '../../api/marketplace';

const BuyerMarketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Purchase Order Modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(10);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Direct Inquiry State
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryListing, setInquiryListing] = useState(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryQty, setInquiryQty] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryResult, setInquiryResult] = useState(null);

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm) params.crop = searchTerm;
      if (selectedGrade) params.grade = selectedGrade;
      if (selectedState) params.state = selectedState;
      if (maxPrice) params.max_price = maxPrice;

      const res = await marketplaceApi.getListings(params);
      if (res.success) {
        setListings(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch produce listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedGrade, selectedState]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleOpenOrderModal = (listing) => {
    setSelectedListing(listing);
    setOrderQuantity(Math.min(10, listing.available_quantity));
    setDeliveryAddress('');
    setContactPhone('');
    setOrderNotes('');
    setShowOrderModal(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;

    setOrderSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        listing_id: selectedListing.id,
        quantity_quintals: parseFloat(orderQuantity),
        delivery_address: deliveryAddress.trim(),
        contact_phone: contactPhone.trim(),
        notes: orderNotes.trim()
      };

      const res = await marketplaceApi.createOrder(payload);
      if (res.success) {
        setSuccessMsg(`Purchase request for ${orderQuantity} Qtl ${selectedListing.crop_name} submitted successfully! Order #${res.data.order_number}`);
        setShowOrderModal(false);
        fetchListings(); // refresh stock
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place purchase request.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Distinct states from active listings
  const distinctStates = Array.from(new Set(listings.map(l => l.state))).filter(Boolean);

  const calculateTotalPrice = () => {
    if (!selectedListing) return 0;
    return Math.round((orderQuantity || 0) * selectedListing.price_per_quintal);
  };

  const handleOpenInquiry = (listing) => {
    setInquiryListing(listing);
    setInquiryMessage('');
    setInquiryQty(listing.available_quantity);
    setInquiryResult(null);
    setShowInquiryModal(true);
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) {
      alert('Please enter an inquiry message or question.');
      return;
    }

    setInquirySubmitting(true);
    try {
      const res = await marketplaceApi.sendInquiry(inquiryListing.id, {
        message: inquiryMessage.trim(),
        quantity_quintals: Number(inquiryQty) || undefined,
      });
      setInquiryResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deliver inquiry.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Farm-Direct Wholesale Sourcing</span>
          </div>
          <h1 className="text-2xl font-bold">Wholesale Produce Marketplace</h1>
          <p className="text-slate-300 text-xs mt-1">
            Browse verified farmer harvest lots, compare quality grades, and send direct purchase requests.
          </p>
        </div>

        <button
          onClick={fetchListings}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-medium flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Listings</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search crop name (e.g. Wheat, Rice, Cotton, Onion)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Quality Grades</option>
              <option value="Grade A">Grade A (Export / Premium)</option>
              <option value="Grade B">Grade B (Standard)</option>
              <option value="Grade C">Grade C (Milling)</option>
              <option value="Organic">Organic Certified</option>
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All States</option>
              {distinctStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Max ₹/Qtl"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Produce Listings Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
          Loading farm-direct produce listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Listings Match Your Filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your crop search query or reset the state and grade filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wide">
                      {item.quality_grade || 'Grade A'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mt-1">{item.crop_name}</h3>
                    <p className="text-xs text-slate-500">{item.variety || 'Standard Variety'}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-700 block">
                      ₹{item.price_per_quintal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">per Quintal</span>
                  </div>
                </div>

                {/* Stock & Origin Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Available Quantity:</span>
                    <strong className="text-slate-800 font-bold">{item.available_quantity} Quintals</strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.district}, {item.state}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Farmer: <strong>{item.farmer_name}</strong></span>
                  </div>

                  {item.harvest_date && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Harvested on: {item.harvest_date}</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 mt-2">
                      "{item.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenInquiry(item)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                  title="Contact Farmer Directly"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Contact</span>
                </button>

                <button
                  onClick={() => handleOpenOrderModal(item)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Purchase Request</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Place Purchase Request */}
      {showOrderModal && selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Place Purchase Request</h2>
            </div>

            {/* Produce Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Crop:</span>
                <span className="font-bold text-slate-800">{selectedListing.crop_name} ({selectedListing.variety})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer:</span>
                <span className="font-semibold text-slate-700">{selectedListing.farmer_name} • {selectedListing.district}, {selectedListing.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Price:</span>
                <span className="font-bold text-emerald-700">₹{selectedListing.price_per_quintal.toLocaleString()} / Quintal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Stock:</span>
                <span className="font-semibold text-slate-700">{selectedListing.available_quantity} Quintals</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Order Quantity (Quintals)</label>
                  <span className="text-[11px] text-slate-400">Max: {selectedListing.available_quantity} Qtl</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedListing.available_quantity}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Live Cost Calculation */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">Total Purchase Value:</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{calculateTotalPrice().toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Destination Address</label>
                <textarea
                  rows="2"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter godown / mill / warehouse address..."
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Procurement Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Packaging or Delivery Instructions</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 50kg jute bags, truck unloading by Friday..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {orderSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                  <span>Confirm Purchase Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Farmer Inquiry Modal */}
      {showInquiryModal && inquiryListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Direct Farmer Inquiry</h3>
                <p className="text-xs text-slate-500">
                  {inquiryListing.crop_name} &bull; {inquiryListing.district}, {inquiryListing.state}
                </p>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {inquiryResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Inquiry Delivered Directly to Farmer!</span>
                  </div>
                  <p className="text-slate-700">
                    Your inquiry has been placed into the farmer's in-app notification center. You may also contact them directly below:
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Farmer:</span>
                    <strong className="text-slate-800">{inquiryResult.farmer_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <strong className="text-emerald-700">{inquiryResult.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Village / District:</span>
                    <span className="text-slate-800">{inquiryResult.village || 'Local'}, {inquiryResult.district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">State:</span>
                    <span className="text-slate-800">{inquiryResult.state}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Quantity (Quintals)</label>
                  <input
                    type="number"
                    value={inquiryQty}
                    onChange={(e) => setInquiryQty(e.target.value)}
                    max={inquiryListing.available_quantity}
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter intended volume"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Message or Question</label>
                  <textarea
                    rows="4"
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Can you confirm the moisture percentage? Are you willing to negotiate for the full lot?"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInquiryModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    {inquirySubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    <span>Send Inquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerMarketplace;
