import React, { useState, useEffect } from 'react';
import { cropsAPI } from '../../api/crops';
import {
  BookOpen,
  Search,
  Filter,
  Thermometer,
  CloudRain,
  Timer,
  TestTube2,
  Loader2,
  AlertCircle
} from 'lucide-react';

const CropCatalog = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);

  const fetchCrops = () => {
    setLoading(true);
    cropsAPI.getCrops({ q: search, category })
      .then((res) => {
        setCrops(res?.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCrops();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category]);

  const categories = [
    { value: '', label: 'All Crops' },
    { value: 'cereal', label: 'Cereals' },
    { value: 'pulse', label: 'Pulses & Legumes' },
    { value: 'fruit', label: 'Fruits' },
    { value: 'cash_crop', label: 'Cash & Industrial' },
    { value: 'oilseed', label: 'Oilseeds' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agricultural Crop Catalog</h2>
          <p className="text-xs text-slate-600 mt-1">
            Explore optimal climatic, rainfall, and soil pH requirements for over 20+ staple and commercial crops.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crop by name (e.g. Wheat, Rice, Cotton, Chickpea)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Crops Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 flex flex-col items-center space-y-2">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs">Loading crop profiles...</span>
        </div>
      ) : crops.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No crops matched your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => setSelectedCrop(crop)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-base text-slate-900">{crop.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase">
                    {crop.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {crop.description || 'Optimal conditions calculated from agro-climatic databases.'}
                </p>

                {/* Agronomic Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-semibold">Temperature</span>
                      <span className="font-bold text-slate-800">{crop.ideal_temp_min}° - {crop.ideal_temp_max}°C</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl flex items-center space-x-2">
                    <CloudRain className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-semibold">Rainfall</span>
                      <span className="font-bold text-slate-800">{crop.ideal_rainfall_min} - {crop.ideal_rainfall_max}mm</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl flex items-center space-x-2">
                    <TestTube2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-semibold">Ideal pH</span>
                      <span className="font-bold text-slate-800">{crop.ideal_ph_min} - {crop.ideal_ph_max}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-semibold">Cycle Duration</span>
                      <span className="font-bold text-slate-800">{crop.growing_period_days} Days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropCatalog;
