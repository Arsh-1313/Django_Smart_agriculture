import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  CalendarCheck,
  Building2,
  Clock,
  Truck,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  X,
  Phone,
  Layers,
  ChevronRight,
  Filter,
  FileText,
  RefreshCw
} from 'lucide-react';
import procurementApi from '../../api/procurement';

// Custom Leaflet marker for procurement hubs
const createHubIcon = () => {
  return L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div style="background-color: #047857; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); border: 2px solid #ffffff;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          <path d="M10 6h4"/>
          <path d="M10 10h4"/>
          <path d="M10 14h4"/>
          <path d="M10 18h4"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const ProcurementBooking = () => {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter state
  const [selectedState, setSelectedState] = useState('');
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'history'

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    crop_name: 'Wheat',
    estimated_quantity_quintals: 50,
    vehicle_number: '',
    contact_phone: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [centresRes, bookingsRes] = await Promise.all([
        procurementApi.getCentres(),
        procurementApi.getBookings()
      ]);

      if (centresRes.success) {
        setCentres(centresRes.data);
        if (centresRes.data.length > 0 && !selectedCentre) {
          setSelectedCentre(centresRes.data[0]);
          loadSlots(centresRes.data[0].id);
        }
      }
      if (bookingsRes.success) {
        setBookings(bookingsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load procurement centers.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (centreId) => {
    setSlotsLoading(true);
    try {
      const res = await procurementApi.getSlots(centreId);
      if (res.success) {
        setSlots(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectCentre = (centre) => {
    setSelectedCentre(centre);
    loadSlots(centre.id);
  };

  const handleOpenBookingModal = (slot) => {
    setSelectedSlot(slot);
    setBookingForm({
      crop_name: selectedCentre?.commodities_accepted?.[0] || 'Wheat',
      estimated_quantity_quintals: Math.min(50, slot.capacity_quintals - slot.booked_quintals),
      vehicle_number: '',
      contact_phone: ''
    });
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await procurementApi.createBooking({
        centre_id: selectedCentre.id,
        slot_id: selectedSlot.id,
        ...bookingForm
      });

      if (res.success) {
        setSuccessMsg(`Delivery slot confirmed! Booking Reference: ${res.data.booking_code}`);
        setShowBookingModal(false);
        loadSlots(selectedCentre.id);
        fetchData();
        setActiveTab('history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this procurement delivery booking? Your slot quota will be released.')) return;
    try {
      const res = await procurementApi.updateBookingStatus(bookingId, {
        status: 'cancelled',
        remarks: 'Cancelled by farmer.'
      });
      if (res.success) {
        setSuccessMsg('Booking cancelled and slot capacity released.');
        fetchData();
        if (selectedCentre) loadSlots(selectedCentre.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  // State filtering
  const distinctStates = Array.from(new Set(centres.map(c => c.state))).filter(Boolean);
  const filteredCentres = selectedState
    ? centres.filter(c => c.state === selectedState)
    : centres;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Cooperative & Government Procurement</span>
          </div>
          <h1 className="text-2xl font-bold">Delivery Slot Booking & Warehousing</h1>
          <p className="text-slate-300 text-xs mt-1">
            Book time-slotted unloading appointments at official FCI / NAFED procurement hubs with guaranteed MSP receipt.
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
        </div>
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

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('book')}
          className={`pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === 'book'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Book Delivery Slot
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>My Procurement Bookings ({bookings.length})</span>
          {bookings.filter(b => b.status === 'confirmed').length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
              {bookings.filter(b => b.status === 'confirmed').length} active
            </span>
          )}
        </button>
      </div>

      {/* View: Book Slot */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Centre Directory & Interactive Map */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter by state */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">All States ({centres.length} centres)</option>
                {distinctStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-64 relative">
              <MapContainer
                center={[22.5, 78.5]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {filteredCentres.map((c) => {
                  const coords = c.location?.coordinates;
                  if (!coords || coords.length < 2) return null;
                  const [lng, lat] = coords;

                  return (
                    <Marker
                      key={c.id}
                      position={[lat, lng]}
                      icon={createHubIcon()}
                      eventHandlers={{
                        click: () => handleSelectCentre(c)
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-slate-500">{c.district}, {c.state}</p>
                          <button
                            onClick={() => handleSelectCentre(c)}
                            className="mt-1 px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold"
                          >
                            Select Centre
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Centre Cards List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredCentres.map((c) => {
                const isSelected = selectedCentre?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCentre(c)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-800">{c.name}</h4>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.district}, {c.state}</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Capacity: {c.capacity_quintals.toLocaleString()} Qtl</span>
                      <span className="font-semibold text-emerald-700">{c.operating_hours}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Centre Details & Delivery Slots */}
          <div className="lg:col-span-7 space-y-4">
            {selectedCentre ? (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        Selected Procurement Depot
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedCentre.name}</h3>
                      <p className="text-xs text-slate-500">{selectedCentre.address}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedCentre.contact_phone}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 mr-1">Accepted Crops:</span>
                    {selectedCentre.commodities_accepted?.map(crop => (
                      <span key={crop} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Available Slots Grid */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-800 text-sm">Available Unloading Time Slots</h4>
                    </div>
                    <span className="text-xs text-slate-400">Next 7 Days</span>
                  </div>

                  {slotsLoading ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                      Loading delivery slots...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No active slots available for this center at this time.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {slots.map((s) => {
                        const remaining = s.capacity_quintals - (s.booked_quintals || 0);
                        const isAvailable = s.status === 'available' && remaining > 0;

                        return (
                          <div
                            key={s.id}
                            className={`p-3.5 rounded-xl border text-xs transition ${
                              isAvailable
                                ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                                : 'bg-slate-100 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {s.slot_date}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {isAvailable ? 'AVAILABLE' : 'SLOT FULL'}
                              </span>
                            </div>

                            <p className="text-slate-600 font-semibold">{s.start_time} - {s.end_time}</p>

                            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500">
                                Remaining: <strong className="text-emerald-700">{remaining.toFixed(1)}</strong> / {s.capacity_quintals} Qtl
                              </span>

                              {isAvailable && (
                                <button
                                  onClick={() => handleOpenBookingModal(s)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                                >
                                  Book Slot
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
                Please select a procurement centre from the directory to view its delivery slots.
              </div>
            )}
          </div>
        </div>
      )}

      {/* View: My Booking History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Procurement Bookings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                You haven't scheduled any crop deliveries yet. Reserve a procurement center slot to bypass mandi queues.
              </p>
              <button
                onClick={() => setActiveTab('book')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow"
              >
                Schedule Delivery
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Booking Code</th>
                    <th className="py-3 px-4">Procurement Centre</th>
                    <th className="py-3 px-4">Scheduled Date & Time</th>
                    <th className="py-3 px-4">Crop & Quantity</th>
                    <th className="py-3 px-4">Vehicle Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 tracking-wide font-mono block">
                          {b.booking_code}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {b.centre_name}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block">{b.slot_date}</span>
                        <span className="text-[11px] text-slate-500">{b.slot_time}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{b.crop_name}</span>
                        <span className="text-[11px] text-slate-500 block">{b.estimated_quantity_quintals} Quintals</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {b.vehicle_number ? (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                            {b.vehicle_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {b.status === 'confirmed' ? (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px]"
                          >
                            Cancel Slot
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Closed</span>
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

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Confirm Delivery Appointment</h2>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Depot:</span>
                <span className="font-bold text-slate-700">{selectedCentre?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-bold text-emerald-700">{selectedSlot?.slot_date} ({selectedSlot?.start_time} - {selectedSlot?.end_time})</span>
              </div>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Crop to Deliver</label>
                <select
                  value={bookingForm.crop_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, crop_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {selectedCentre?.commodities_accepted?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Quantity (Quintals)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedSlot?.capacity_quintals - selectedSlot?.booked_quintals}
                  value={bookingForm.estimated_quantity_quintals}
                  onChange={(e) => setBookingForm({ ...bookingForm, estimated_quantity_quintals: parseFloat(e.target.value) || '' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tractor / Truck Vehicle Number</label>
                <input
                  type="text"
                  placeholder="e.g. PB 10 CA 9876"
                  value={bookingForm.vehicle_number}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicle_number: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={bookingForm.contact_phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  <span>Confirm Slot Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementBooking;
