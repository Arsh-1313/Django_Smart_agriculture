import React, { useState, useEffect } from 'react';
import { predictionsAPI } from '../../api/predictions';
import { farmsAPI } from '../../api/farms';
import {
  FlaskConical,
  TestTube2,
  Trees,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ShieldAlert
} from 'lucide-react';

const FertilizerRecommendation = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  const [form, setForm] = useState({
    nitrogen: 20,
    phosphorus: 40,
    potassium: 35,
    soil_type: 'Loamy',
    crop_type: 'Wheat',
    temperature: 25.0,
    humidity: 60.0,
    moisture: 35.0,
  });

  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    farmsAPI.getFarms()
      .then((res) => {
        const list = res?.data || [];
        setFarms(list);
        if (list.length > 0 && list[0].latest_soil) {
          const soil = list[0].latest_soil;
          setForm((prev) => ({
            ...prev,
            nitrogen: soil.nitrogen_N,
            phosphorus: soil.phosphorus_P,
            potassium: soil.potassium_K,
            soil_type: soil.soil_type.charAt(0).toUpperCase() + soil.soil_type.slice(1),
          }));
          setSelectedFarmId(list[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFarmSelect = (e) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);
    if (!fId) return;

    const farmObj = farms.find((f) => f.id === fId);
    if (farmObj && farmObj.latest_soil) {
      setForm((prev) => ({
        ...prev,
        nitrogen: farmObj.latest_soil.nitrogen_N,
        phosphorus: farmObj.latest_soil.phosphorus_P,
        potassium: farmObj.latest_soil.potassium_K,
        soil_type: farmObj.latest_soil.soil_type.charAt(0).toUpperCase() + farmObj.latest_soil.soil_type.slice(1),
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
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        soil_type: form.soil_type,
        crop_type: form.crop_type,
        temperature: parseFloat(form.temperature),
        humidity: parseFloat(form.humidity),
        moisture: parseFloat(form.moisture),
      };

      const res = await predictionsAPI.predictFertilizer(payload);
      setResult(res?.data);
    } catch (err) {
      setError(err?.message || 'Failed to determine fertilizer dosage.');
    } finally {
      setPredicting(false);
    }
  };

  const soilTypes = ['Loamy', 'Black', 'Clayey', 'Red', 'Sandy'];
  const cropTypes = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Pigeonpeas', 'Barley', 'Pulses', 'Ground Nuts'];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
          <FlaskConical className="w-4 h-4" />
          <span>Soil Chemistry & Fertilizer Intelligence</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Fertilizer Recommendation
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Evaluates soil nutrient deficits (Nitrogen, Phosphorus, Potassium) against crop-specific uptake requirements to recommend tailored fertilizer formulations (Urea, DAP, 10-26-26, 17-17-17, etc.).
        </p>
      </div>

      {/* Farm Auto-Fill Bar */}
      {farms.length > 0 && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Trees className="w-5 h-5 text-teal-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-teal-950">Auto-fill soil test parameters</p>
              <p className="text-[11px] text-teal-800">Select a farm to pull its recorded N-P-K nutrient ratios</p>
            </div>
          </div>
          <select
            value={selectedFarmId}
            onChange={handleFarmSelect}
            className="px-3 py-1.5 text-xs rounded-xl border border-teal-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Manual Entry (No farm selected)</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.farm_name} ({f.latest_soil ? `N:${f.latest_soil.nitrogen_N} P:${f.latest_soil.phosphorus_P} K:${f.latest_soil.potassium_K}` : 'No Soil Test'})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs */}
        <form onSubmit={handlePredict} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 lg:col-span-7">
          <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
            <TestTube2 className="w-4 h-4 text-teal-600" />
            <span>Soil Nutrients & Target Crop</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nitrogen (N)</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={form.nitrogen}
                onChange={(e) => setForm({ ...form, nitrogen: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phosphorus (P)</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={form.phosphorus}
                onChange={(e) => setForm({ ...form, phosphorus: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Potassium (K)</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={form.potassium}
                onChange={(e) => setForm({ ...form, potassium: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Crop *</label>
              <select
                value={form.crop_type}
                onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {cropTypes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Soil Classification *</label>
              <select
                value={form.soil_type}
                onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {soilTypes.map((s) => (
                  <option key={s} value={s}>{s} Soil</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Soil Moisture (%)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                value={form.moisture}
                onChange={(e) => setForm({ ...form, moisture: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.5"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Humidity (%)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                value={form.humidity}
                onChange={(e) => setForm({ ...form, humidity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={predicting}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {predicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Nutrient Ratios...</span>
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4" />
                <span>Determine Optimal Fertilizer</span>
              </>
            )}
          </button>
        </form>

        {/* Results Card */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="bg-white rounded-3xl border border-teal-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider mb-2">
                  Recommended Formulation
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono text-teal-800">
                  {result.recommended_fertilizer}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Confidence rating: <span className="font-bold text-teal-700">{result.confidence_percentage}%</span>
                </p>
              </div>

              {/* Nutrient Level Indicators */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Soil Nutrient Deficit Assessment
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Nitrogen (N)</span>
                    <span className={`font-bold ${result.soil_analysis?.nitrogen_level === 'Low' ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {result.soil_analysis?.nitrogen_level}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Phosphorus (P)</span>
                    <span className={`font-bold ${result.soil_analysis?.phosphorus_level === 'Low' ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {result.soil_analysis?.phosphorus_level}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Potassium (K)</span>
                    <span className={`font-bold ${result.soil_analysis?.potassium_level === 'Low' ? 'text-sky-600' : 'text-emerald-700'}`}>
                      {result.soil_analysis?.potassium_level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agronomic Application Guidelines */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs space-y-1.5">
                <span className="font-bold text-teal-950 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-teal-700" />
                  <span>Agronomic Application Advice:</span>
                </span>
                <p className="text-teal-900 leading-relaxed">
                  {result.application_guidelines}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start space-x-2 text-[11px] text-slate-500">
                <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>{result.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">No Fertilizer Advice Calculated</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Enter your soil test figures and target crop on the left to calculate the optimal N-P-K fertilizer formulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FertilizerRecommendation;
