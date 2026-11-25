import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { farmsAPI } from '../../api/farms';
import MapPicker from '../../components/MapPicker';
import {
  Trees,
  Plus,
  MapPin,
  Trash2,
  Edit2,
  ArrowRight,
  TestTube2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const FarmManagement = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    farm_name: '',
    total_area_acres: '',
    latitude: 20.5937,
    longitude: 78.9629,
    village: '',
    district: '',
    state: '',
    pin_code: '',
    irrigation_type: 'borewell'
  });

  const loadFarms = () => {
    setLoading(true);
    farmsAPI.getFarms()
      .then((res) => {
        setFarms(res?.data || []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load farms.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const openCreateModal = () => {
    setEditingFarm(null);
    setFormData({
      farm_name: '',
      total_area_acres: '',
      latitude: 19.9975,
      longitude: 73.7898,
      village: '',
      district: '',
      state: 'Maharashtra',
      pin_code: '',
      irrigation_type: 'borewell'
    });
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (farm) => {
    setEditingFarm(farm);
    const coords = farm.location?.coordinates || [73.7898, 19.9975];
    setFormData({
      farm_name: farm.farm_name,
      total_area_acres: farm.total_area_acres,
      latitude: coords[1],
      longitude: coords[0],
      village: farm.village || '',
      district: farm.district || '',
      state: farm.state || '',
      pin_code: farm.pin_code || '',
      irrigation_type: farm.irrigation_type || 'borewell'
    });
    setIsModalOpen(true);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSaveFarm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...formData,
      total_area_acres: parseFloat(formData.total_area_acres),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };

    try {
      if (editingFarm) {
        await farmsAPI.updateFarm(editingFarm.id, payload);
        setSuccessMsg('Farm updated successfully.');
      } else {
        await farmsAPI.createFarm(payload);
        setSuccessMsg('New farm registered successfully.');
      }
      setIsModalOpen(false);
      loadFarms();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to save farm.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFarm = async (farmId, farmName) => {
    if (!window.confirm(`Are you sure you want to delete "${farmName}"? This will delete associated soil records and crop history.`)) {
      return;
    }

    try {
      await farmsAPI.deleteFarm(farmId);
      setSuccessMsg(`Farm "${farmName}" deleted successfully.`);
      loadFarms();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to delete farm.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Farm Parcels & Land Registry</h2>
          <p className="text-xs text-slate-600 mt-1">
            Register and manage your geographic agricultural plots with GPS mapping and irrigation details.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Farm</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Farms Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center space-y-2">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs">Loading farm holdings...</span>
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Trees className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Farm Holdings Registered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Register your first farm plot to enable personalized AI predictions, soil nutrient tracking, and microclimate weather updates.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Farm</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => {
            const coords = farm.location?.coordinates || [0, 0];
            return (
              <div
                key={farm.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Map Preview Snapshot */}
                  <div className="h-36 w-full bg-slate-100 relative">
                    <MapPicker
                      latitude={coords[1]}
                      longitude={coords[0]}
                      height="100%"
                      interactive={false}
                      markerLabel={farm.farm_name}
                    />
                    <span className="absolute top-3 right-3 z-[400] px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-sm text-emerald-800 shadow-sm border border-slate-200 capitalize">
                      {farm.irrigation_type}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 tracking-tight">{farm.farm_name}</h4>
                      <p className="text-xs text-slate-600 flex items-center space-x-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Area</span>
                        <span className="font-extrabold text-slate-800 text-sm">{farm.total_area_acres} Acres</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">Soil Status</span>
                        {farm.latest_soil ? (
                          <span className="font-bold text-emerald-700 text-xs block">
                            pH {farm.latest_soil.pH} ({farm.latest_soil.soil_type})
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">Pending test</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(farm)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors"
                      title="Edit farm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFarm(farm.id, farm.farm_name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-white transition-colors"
                      title="Delete farm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/farmer/farms/${farm.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Manage Soil & Crops</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Farm Create/Edit Modal with Leaflet Map */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Trees className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingFarm ? 'Edit Farm Details' : 'Register New Farm Parcel'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFarm} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Name *</label>
                  <input
                    type="text"
                    required
                    name="farm_name"
                    value={formData.farm_name}
                    onChange={handleFormChange}
                    placeholder="e.g. Ganga Valley Parcel 1"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    name="total_area_acres"
                    value={formData.total_area_acres}
                    onChange={handleFormChange}
                    placeholder="5.5"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Village / Locality *</label>
                  <input
                    type="text"
                    required
                    name="village"
                    value={formData.village}
                    onChange={handleFormChange}
                    placeholder="e.g. Deola"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    name="district"
                    value={formData.district}
                    onChange={handleFormChange}
                    placeholder="e.g. Nashik"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Irrigation System *</label>
                  <select
                    name="irrigation_type"
                    value={formData.irrigation_type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="drip">Drip Irrigation (Micro)</option>
                    <option value="borewell">Borewell / Tube Well</option>
                    <option value="canal">Canal / Surface Flow</option>
                    <option value="sprinkler">Sprinkler System</option>
                    <option value="rainfed">Rainfed / Natural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pin Code</label>
                  <input
                    type="text"
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleFormChange}
                    placeholder="423102"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Interactive Leaflet Map Coordinates Picker */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>GPS Location Coordinates (Click map to pin)</span>
                  <span className="font-mono text-emerald-700 text-[11px]">
                    Lat: {formData.latitude}, Lng: {formData.longitude}
                  </span>
                </label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={handleLocationSelect}
                  height="260px"
                  interactive={true}
                  markerLabel={formData.farm_name || 'Selected Farm Location'}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Farm...</span>
                    </>
                  ) : (
                    <span>{editingFarm ? 'Update Farm' : 'Register Farm'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmManagement;
