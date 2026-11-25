import React, { useState, useEffect } from 'react';
import { predictionsAPI } from '../../api/predictions';
import { farmsAPI } from '../../api/farms';
import {
  Cpu,
  Sprout,
  Sparkles,
  Trees,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Thermometer,
  CloudRain,
  TestTube2,
  Percent
} from 'lucide-react';

const CropRecommendation = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [loadingFarms, setLoadingFarms] = useState(true);

  // Form inputs
  const [form, setForm] = useState({
    N: 80,
    P: 45,
    K: 40,
    temperature: 24.5,
    humidity: 78.0,
    ph: 6.5,
    rainfall: 200.0,
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
          // Pre-populate with first farm's soil if available
          const soil = list[0].latest_soil;
          setForm((prev) => ({
            ...prev,
            N: soil.nitrogen_N,
            P: soil.phosphorus_P,
            K: soil.potassium_K,
            ph: soil.pH,
          }));
          setSelectedFarmId(list[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingFarms(false));
  }, []);

  const handleFarmSelect = (e) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);
    if (!fId) return;

    const farmObj = farms.find((f) => f.id === fId);
    if (farmObj && farmObj.latest_soil) {
      setForm((prev) => ({
        ...prev,
        N: farmObj.latest_soil.nitrogen_N,
        P: farmObj.latest_soil.phosphorus_P,
        K: farmObj.latest_soil.potassium_K,
        ph: farmObj.latest_soil.pH,
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
        N: parseFloat(form.N),
        P: parseFloat(form.P),
        K: parseFloat(form.K),
        temperature: parseFloat(form.temperature),
        humidity: parseFloat(form.humidity),
        ph: parseFloat(form.ph),
        rainfall: parseFloat(form.rainfall),
      };

      const res = await predictionsAPI.predictCrop(payload);
      setResult(res?.data);
    } catch (err) {
      setError(err?.message || 'Failed to generate crop recommendation.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <Cpu className="w-4 h-4" />
          <span>Machine Learning Intelligence</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Crop Recommendation
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Powered by a trained Random Forest Classifier (98.6% accuracy on 2,200 agricultural samples). Analyzes your soil N-P-K nutrient profile and microclimatic variables to recommend the most optimal crop.
        </p>
      </div>

      {/* Farm Auto-Fill Bar */}
      {farms.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Trees className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Auto-fill parameters from your registered farm</p>
              <p className="text-[11px] text-emerald-800">Select a farm parcel to load its latest laboratory soil test</p>
            </div>
          </div>
          <select
            value={selectedFarmId}
            onChange={handleFarmSelect}
            className="px-3 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Manual Entry (No farm selected)</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.farm_name} ({f.total_area_acres} Acres) {f.latest_soil ? '✓ Soil Available' : '— No Soil'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Parameters Form (Left Column) */}
        <form onSubmit={handlePredict} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 lg:col-span-7">
          <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
            <TestTube2 className="w-4 h-4 text-emerald-600" />
            <span>Soil Nutrients & Climate Telemetry</span>
          </h3>

          {/* Soil N-P-K */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nitrogen (N)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="200"
                required
                value={form.N}
                onChange={(e) => setForm({ ...form, N: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">0 - 150 mg/kg</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phosphorus (P)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="200"
                required
                value={form.P}
                onChange={(e) => setForm({ ...form, P: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">5 - 145 mg/kg</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Potassium (K)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="250"
                required
                value={form.K}
                onChange={(e) => setForm({ ...form, K: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">5 - 210 mg/kg</span>
            </div>
          </div>

          {/* Soil pH & Moisture */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Soil pH (0.0 - 14.0)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                required
                value={form.ph}
                onChange={(e) => setForm({ ...form, ph: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Ideal: 5.5 - 7.5</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rainfall (mm)</label>
              <input
                type="number"
                step="5"
                min="10"
                max="1000"
                required
                value={form.rainfall}
                onChange={(e) => setForm({ ...form, rainfall: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Seasonal average mm</span>
            </div>
          </div>

          {/* Climate Telemetry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Average Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="50"
                required
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relative Humidity (%)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                required
                value={form.humidity}
                onChange={(e) => setForm({ ...form, humidity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={predicting}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {predicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Machine Learning Inference...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Predict Optimal Crop Recommendation</span>
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
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-2">
                  Top Recommended Crop
                </span>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 mb-3">
                  <Sprout className="w-9 h-9" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {result.recommended_crop}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Primary recommendation confidence: <span className="font-bold text-emerald-700">{result.confidence}%</span>
                </p>
              </div>

              {/* Confidence Progress Bar */}
              <div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              {/* Top-3 Ranked Alternatives */}
              {result.top_alternatives?.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Top Ranked Alternatives
                  </span>
                  <div className="space-y-2">
                    {result.top_alternatives.map((alt, idx) => (
                      <div key={alt.crop} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-bold text-slate-800 flex items-center space-x-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{alt.crop}</span>
                        </span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {alt.confidence_percentage}% match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                Prediction logged into MongoDB Atlas with reference ID: <code className="font-mono text-slate-700">{result.prediction_id}</code>.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">No Prediction Generated Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Adjust the soil nutrient and climate sliders on the left and click "Predict Optimal Crop".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
