import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { farmsAPI } from '../../api/farms';
import { cropsAPI } from '../../api/crops';
import MapPicker from '../../components/MapPicker';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Trees,
  TestTube2,
  Sprout,
  Plus,
  ArrowLeft,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Droplets,
  Edit2
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FarmDetail = () => {
  const { farmId } = useParams();

  const [farm, setFarm] = useState(null);
  const [soilRecords, setSoilRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Soil modal state
  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
  const [savingSoil, setSavingSoil] = useState(false);
  const [soilForm, setSoilForm] = useState({
    nitrogen_N: 90,
    phosphorus_P: 42,
    potassium_K: 43,
    pH: 6.5,
    soil_type: 'black',
    organic_carbon_percent: 0.55,
    moisture_percent: 28.0,
  });

  // Crop history modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [savingCrop, setSavingCrop] = useState(false);
  const [cropForm, setCropForm] = useState({
    crop_name: 'Wheat',
    season: 'Rabi',
    year: new Date().getFullYear(),
    planted_area_acres: 2.0,
    harvested_yield_quintals: 0,
    status: 'planted',
    notes: '',
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [farmRes, soilRes, histRes] = await Promise.all([
        farmsAPI.getFarmDetail(farmId),
        farmsAPI.getFarmSoil(farmId),
        farmsAPI.getFarmHistory(farmId),
      ]);
      setFarm(farmRes?.data);
      setSoilRecords(soilRes?.data || []);
      setHistoryRecords(histRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load farm details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [farmId]);

  const handleAddSoil = async (e) => {
    e.preventDefault();
    setSavingSoil(true);
    try {
      await farmsAPI.addSoilRecord(farmId, {
        ...soilForm,
        nitrogen_N: parseFloat(soilForm.nitrogen_N),
        phosphorus_P: parseFloat(soilForm.phosphorus_P),
        potassium_K: parseFloat(soilForm.potassium_K),
        pH: parseFloat(soilForm.pH),
        organic_carbon_percent: parseFloat(soilForm.organic_carbon_percent),
        moisture_percent: parseFloat(soilForm.moisture_percent),
      });
      setIsSoilModalOpen(false);
      setSuccessMsg('Soil test parameters recorded successfully.');
      loadAllData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to save soil test.');
    } finally {
      setSavingSoil(false);
    }
  };

  const handleAddCropHistory = async (e) => {
    e.preventDefault();
    setSavingCrop(true);
    try {
      await farmsAPI.addFarmHistory(farmId, {
        ...cropForm,
        planted_area_acres: parseFloat(cropForm.planted_area_acres),
        harvested_yield_quintals: parseFloat(cropForm.harvested_yield_quintals || 0),
        year: parseInt(cropForm.year),
      });
      setIsCropModalOpen(false);
      setSuccessMsg('Cultivation record added successfully.');
      loadAllData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to save crop cycle.');
    } finally {
      setSavingCrop(false);
    }
  };

  const handleMarkHarvested = async (historyId, currentYield) => {
    const yieldInput = prompt('Enter final harvested yield in quintals:', currentYield || '50');
    if (yieldInput === null) return;

    try {
      const yieldVal = parseFloat(yieldInput) || 0;
      await cropsAPI.updateCropHistory(historyId, {
        status: 'harvested',
        harvested_yield_quintals: yieldVal,
        crop_name: historyRecords.find(h => h.id === historyId)?.crop_name || 'Crop',
        season: historyRecords.find(h => h.id === historyId)?.season || 'Kharif',
        year: historyRecords.find(h => h.id === historyId)?.year || 2025,
        planted_area_acres: historyRecords.find(h => h.id === historyId)?.planted_area_acres || 1,
      });
      setSuccessMsg('Crop status marked as harvested with recorded yield.');
      loadAllData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to update harvest.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm">Loading parcel data and telemetry...</p>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h3 className="font-bold text-base text-slate-800">Farm Not Found</h3>
        <Link to="/farmer/farms" className="text-xs text-emerald-600 font-bold mt-2 inline-block">
          Return to Farms Directory
        </Link>
      </div>
    );
  }

  const coords = farm.location?.coordinates || [73.7898, 19.9975];
  const latestSoil = soilRecords[0];

  // Chart data for N-P-K
  const chartData = {
    labels: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)'],
    datasets: [
      {
        label: 'Current Soil Ratio (mg/kg)',
        data: latestSoil
          ? [latestSoil.nitrogen_N, latestSoil.phosphorus_P, latestSoil.potassium_K]
          : [0, 0, 0],
        backgroundColor: [
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(14, 165, 233, 0.75)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/farmer/farms"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Farm Directory</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {farm.farm_name}
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 capitalize">
              {farm.irrigation_type} Irrigation
            </span>
          </div>
          <p className="text-xs text-slate-600 flex items-center space-x-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state}</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-700">{farm.total_area_acres} Total Acres</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSoilModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
          >
            <TestTube2 className="w-4 h-4" />
            <span>Record Soil Test</span>
          </button>
          <button
            onClick={() => setIsCropModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Plant Crop Cycle</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Map Coordinates & Soil Status Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm lg:col-span-1">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-slate-700 tracking-wider">Geographic Boundary</span>
            <span className="font-mono text-[11px] text-emerald-700 font-semibold">
              {coords[1]?.toFixed(4)}° N, {coords[0]?.toFixed(4)}° E
            </span>
          </div>
          <div className="h-64 w-full">
            <MapPicker
              latitude={coords[1]}
              longitude={coords[0]}
              height="100%"
              interactive={false}
              markerLabel={farm.farm_name}
            />
          </div>
        </div>

        {/* Current Soil Health Bar Chart Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Current Soil Nutrient Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {latestSoil ? `Sampled on ${new Date(latestSoil.recorded_date).toLocaleDateString()}` : 'No laboratory sample on record'}
                </p>
              </div>
              {latestSoil && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
                    pH: {latestSoil.pH}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold capitalize">
                    {latestSoil.soil_type} Soil
                  </span>
                </div>
              )}
            </div>

            {latestSoil ? (
              <div className="h-44 w-full">
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <TestTube2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No soil test records registered for this farm.</p>
                <button
                  onClick={() => setIsSoilModalOpen(true)}
                  className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  + Add Soil Test Reading
                </button>
              </div>
            )}
          </div>

          {latestSoil && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Nitrogen</span>
                <span className="font-mono font-bold text-emerald-700">{latestSoil.nitrogen_N} ppm</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Phosphorus</span>
                <span className="font-mono font-bold text-amber-700">{latestSoil.phosphorus_P} ppm</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Potassium</span>
                <span className="font-mono font-bold text-sky-700">{latestSoil.potassium_K} ppm</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Moisture</span>
                <span className="font-mono font-bold text-teal-700">{latestSoil.moisture_percent}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crop Cultivation Cycles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Crop Cultivation & Harvest History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Track seasonal sowings, area planted, and harvested yield</p>
          </div>
          <button
            onClick={() => setIsCropModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Crop Cycle</span>
          </button>
        </div>

        {historyRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Sprout className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No cultivation cycles recorded yet on this land.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Crop Name</th>
                  <th className="px-6 py-3">Season & Year</th>
                  <th className="px-6 py-3">Planted Area</th>
                  <th className="px-6 py-3">Yield (Quintals)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {historyRecords.map((hist) => (
                  <tr key={hist.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{hist.crop_name}</td>
                    <td className="px-6 py-4">{hist.season} {hist.year}</td>
                    <td className="px-6 py-4">{hist.planted_area_acres} Acres</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-800">
                      {hist.status === 'harvested' ? `${hist.harvested_yield_quintals} Qtl` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        hist.status === 'harvested'
                          ? 'bg-emerald-100 text-emerald-800'
                          : hist.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {hist.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hist.status === 'planted' && (
                        <button
                          onClick={() => handleMarkHarvested(hist.id, hist.harvested_yield_quintals)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          Mark Harvested
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Soil Modal */}
      {isSoilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSoilModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <TestTube2 className="w-5 h-5 text-emerald-600" />
                <span>Log Soil Laboratory Test</span>
              </h3>
              <button onClick={() => setIsSoilModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSoil} className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nitrogen (N) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={soilForm.nitrogen_N}
                    onChange={(e) => setSoilForm({ ...soilForm, nitrogen_N: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phosphorus (P) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={soilForm.phosphorus_P}
                    onChange={(e) => setSoilForm({ ...soilForm, phosphorus_P: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Potassium (K) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={soilForm.potassium_K}
                    onChange={(e) => setSoilForm({ ...soilForm, potassium_K: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Soil pH (0.0 - 14.0) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    required
                    value={soilForm.pH}
                    onChange={(e) => setSoilForm({ ...soilForm, pH: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Soil Type *</label>
                  <select
                    value={soilForm.soil_type}
                    onChange={(e) => setSoilForm({ ...soilForm, soil_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                  >
                    <option value="black">Black Soil (Regur)</option>
                    <option value="alluvial">Alluvial Soil</option>
                    <option value="loamy">Loamy Soil</option>
                    <option value="clay">Clay Soil</option>
                    <option value="red">Red Soil</option>
                    <option value="sandy">Sandy Soil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={soilForm.moisture_percent}
                    onChange={(e) => setSoilForm({ ...soilForm, moisture_percent: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organic Carbon (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="100"
                    value={soilForm.organic_carbon_percent}
                    onChange={(e) => setSoilForm({ ...soilForm, organic_carbon_percent: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSoilModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSoil}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  {savingSoil ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Soil Parameters</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Crop Cycle Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCropModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <span>Log Cultivation Cycle</span>
              </h3>
              <button onClick={() => setIsCropModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCropHistory} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Name *</label>
                <input
                  type="text"
                  required
                  value={cropForm.crop_name}
                  onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })}
                  placeholder="Wheat, Rice, Cotton, Chickpea..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Season *</label>
                  <select
                    value={cropForm.season}
                    onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year *</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    value={cropForm.year}
                    onChange={(e) => setCropForm({ ...cropForm, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planted Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={cropForm.planted_area_acres}
                    onChange={(e) => setCropForm({ ...cropForm, planted_area_acres: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cycle Status *</label>
                  <select
                    value={cropForm.status}
                    onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="planted">Currently Planted</option>
                    <option value="harvested">Harvested</option>
                    <option value="failed">Crop Failed</option>
                  </select>
                </div>
              </div>

              {cropForm.status === 'harvested' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harvested Yield (Quintals)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={cropForm.harvested_yield_quintals}
                    onChange={(e) => setCropForm({ ...cropForm, harvested_yield_quintals: e.target.value })}
                    placeholder="e.g. 50.0"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Variety</label>
                <input
                  type="text"
                  value={cropForm.notes}
                  onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })}
                  placeholder="e.g. Sonalika variety with organic vermicompost"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCrop}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  {savingCrop ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Record Crop Cycle</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmDetail;
