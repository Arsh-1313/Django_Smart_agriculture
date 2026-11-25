import React, { useState, useEffect } from 'react';
import { predictionsAPI } from '../../api/predictions';
import { farmsAPI } from '../../api/farms';
import {
  TrendingUp,
  Sprout,
  Trees,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scale,
  CloudRain
} from 'lucide-react';

const YieldPrediction = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  const [form, setForm] = useState({
    crop: 'Wheat',
    state: 'Maharashtra',
    season: 'Rabi',
    area_acres: 5.0,
    annual_rainfall_mm: 850.0,
    fertilizer_kg_per_acre: 100.0,
  });

  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    farmsAPI.getFarms()
      .then((res) => {
        const list = res?.data || [];
        setFarms(list);
        if (list.length > 0) {
          setSelectedFarmId(list[0].id);
          setForm((prev) => ({
            ...prev,
            area_acres: list[0].total_area_acres,
            state: list[0].state || prev.state,
          }));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFarmSelect = (e) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);
    if (!fId) return;

    const farmObj = farms.find((f) => f.id === fId);
    if (farmObj) {
      setForm((prev) => ({
        ...prev,
        area_acres: farmObj.total_area_acres,
        state: farmObj.state || prev.state,
      }));
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        farm_id: selectedFarmId || undefined,
        crop: form.crop,
        state: form.state,
        season: form.season,
        area_acres: parseFloat(form.area_acres),
        annual_rainfall_mm: parseFloat(form.annual_rainfall_mm),
        fertilizer_kg_per_acre: parseFloat(form.fertilizer_kg_per_acre),
      };

      const res = await predictionsAPI.predictYield(payload);
      setResult(res?.data);
    } catch (err) {
      setError(err?.message || 'Failed to estimate crop yield.');
    } finally {
      setPredicting(false);
    }
  };

  const cropChoices = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Chickpea', 'Sugarcane'];
  const stateChoices = ['Maharashtra', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Gujarat', 'Haryana', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'West Bengal'];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
          <TrendingUp className="w-4 h-4" />
          <span>Regression Machine Learning Model</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Crop Yield Prediction
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Powered by a trained Random Forest Regressor (R² = 98.8% on historical Indian production datasets). Predicts harvest productivity per acre and total volume in quintals.
        </p>
      </div>

      {/* Farm Auto-Fill Bar */}
      {farms.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Trees className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">Auto-fill land holding details</p>
              <p className="text-[11px] text-amber-800">Select a farm to auto-populate state location and registered acreage</p>
            </div>
          </div>
          <select
            value={selectedFarmId}
            onChange={handleFarmSelect}
            className="px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Manual Entry (No farm selected)</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.farm_name} ({f.total_area_acres} Acres, {f.state})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (Left Column) */}
        <form onSubmit={handlePredict} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 lg:col-span-7">
          <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Cultivation & Production Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Crop *</label>
              <select
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {cropChoices.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / Region *</label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {stateChoices.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cropping Season *</label>
              <select
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Kharif">Kharif (Monsoon)</option>
                <option value="Rabi">Rabi (Winter)</option>
                <option value="Whole Year">Whole Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planted Area (Acres) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={form.area_acres}
                onChange={(e) => setForm({ ...form, area_acres: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Rainfall (mm)</label>
              <input
                type="number"
                step="10"
                min="100"
                value={form.annual_rainfall_mm}
                onChange={(e) => setForm({ ...form, annual_rainfall_mm: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fertilizer Application (kg/acre)</label>
              <input
                type="number"
                step="5"
                min="10"
                value={form.fertilizer_kg_per_acre}
                onChange={(e) => setForm({ ...form, fertilizer_kg_per_acre: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={predicting}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {predicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Estimating Harvest Yield...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Estimate Harvest Yield & Production</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Results (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider mb-2">
                  Yield Projection: {result.crop}
                </span>
                <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {result.total_estimated_production_quintals} <span className="text-lg font-bold text-slate-600">Quintals</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Total expected harvest across {result.area_acres} Acres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Yield per Acre</span>
                  <span className="font-extrabold text-amber-800 text-lg font-mono">
                    {result.predicted_yield_per_acre} Qtl/Acre
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Model Accuracy</span>
                  <span className="font-extrabold text-emerald-700 text-lg font-mono">
                    98.8% R²
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                Log record saved to MongoDB collection <code className="font-mono text-slate-700">yield_predictions</code>. Reference ID: <code className="font-mono text-slate-700">{result.prediction_id}</code>.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">No Yield Calculated Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Select your crop, region, and land acreage to calculate expected agricultural production.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YieldPrediction;
