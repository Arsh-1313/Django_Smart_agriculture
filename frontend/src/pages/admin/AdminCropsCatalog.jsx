import React, { useState, useEffect } from 'react';
import { cropsAPI } from '../../api/crops';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

const AdminCropsCatalog = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'cereal',
    ideal_temp_min: 15.0,
    ideal_temp_max: 30.0,
    ideal_rainfall_min: 500.0,
    ideal_rainfall_max: 1200.0,
    ideal_ph_min: 6.0,
    ideal_ph_max: 7.5,
    growing_period_days: 120,
    description: '',
  });

  const loadCrops = () => {
    setLoading(true);
    cropsAPI.getCrops({ q: search })
      .then((res) => {
        setCrops(res?.data || []);
      })
      .catch((err) => setError(err?.message || 'Failed to load crops.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadCrops, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddCrop = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await cropsAPI.createCrop({
        ...formData,
        ideal_temp_min: parseFloat(formData.ideal_temp_min),
        ideal_temp_max: parseFloat(formData.ideal_temp_max),
        ideal_rainfall_min: parseFloat(formData.ideal_rainfall_min),
        ideal_rainfall_max: parseFloat(formData.ideal_rainfall_max),
        ideal_ph_min: parseFloat(formData.ideal_ph_min),
        ideal_ph_max: parseFloat(formData.ideal_ph_max),
        growing_period_days: parseInt(formData.growing_period_days),
      });
      setSuccess(`Crop "${formData.name}" added to master catalog.`);
      setIsModalOpen(false);
      loadCrops();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to create crop entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Crops Taxonomy</h2>
          <p className="text-xs text-slate-600 mt-1">
            Global agricultural catalog used by AI predictive engines and marketplace classifications.
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setError('');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Crop to Catalog</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crops by name..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Crops Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-xs">Loading crops catalog...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Crop Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Temperature</th>
                  <th className="px-6 py-3">Rainfall</th>
                  <th className="px-6 py-3">Soil pH</th>
                  <th className="px-6 py-3">Growing Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {crops.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-100 uppercase">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono">{c.ideal_temp_min}° - {c.ideal_temp_max}°C</td>
                    <td className="px-6 py-3.5 font-mono">{c.ideal_rainfall_min} - {c.ideal_rainfall_max}mm</td>
                    <td className="px-6 py-3.5 font-mono font-bold text-emerald-800">{c.ideal_ph_min} - {c.ideal_ph_max}</td>
                    <td className="px-6 py-3.5">{c.growing_period_days} Days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Crop Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>Add Agricultural Crop Variety</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCrop} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Barley"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cereal">Cereal</option>
                    <option value="pulse">Pulse / Legume</option>
                    <option value="fruit">Fruit</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="oilseed">Oilseed</option>
                    <option value="cash_crop">Cash / Industrial Crop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min / Max Temp (°C)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.ideal_temp_min}
                      onChange={(e) => setFormData({ ...formData, ideal_temp_min: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={formData.ideal_temp_max}
                      onChange={(e) => setFormData({ ...formData, ideal_temp_max: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min / Max Rainfall (mm)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="50"
                      value={formData.ideal_rainfall_min}
                      onChange={(e) => setFormData({ ...formData, ideal_rainfall_min: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                    <input
                      type="number"
                      step="50"
                      value={formData.ideal_rainfall_max}
                      onChange={(e) => setFormData({ ...formData, ideal_rainfall_max: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min / Max Soil pH</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      value={formData.ideal_ph_min}
                      onChange={(e) => setFormData({ ...formData, ideal_ph_min: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      value={formData.ideal_ph_max}
                      onChange={(e) => setFormData({ ...formData, ideal_ph_max: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Growing Days</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.growing_period_days}
                    onChange={(e) => setFormData({ ...formData, growing_period_days: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agronomic Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key agronomic characteristics and preferred climate..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Add to Catalog</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCropsCatalog;
