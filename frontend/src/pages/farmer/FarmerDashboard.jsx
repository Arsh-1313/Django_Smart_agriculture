import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { farmsAPI } from '../../api/farms';
import StatCard from '../../components/StatCard';
import {
  Trees,
  Sprout,
  TestTube2,
  Cpu,
  CloudSun,
  Store,
  CalendarCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react';

const FarmerDashboard = () => {
  const { user, roleProfile } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    farmsAPI.getFarms()
      .then((res) => {
        setFarms(res?.data || []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load farms.');
      })
      .finally(() => setLoading(false));
  }, []);

  const totalAcreage = farms.reduce((acc, f) => acc + (f.total_area_acres || 0), 0);
  const totalSoilTests = farms.filter((f) => f.latest_soil).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-emerald-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-sm text-emerald-100 uppercase tracking-wider mb-3">
            Farmer Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.first_name || user?.username}!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Welcome to your digital agricultural operations center. Monitor your registered parcels, track soil nutrient health, and access predictive AI models to maximize your harvest yield.
          </p>
          {roleProfile?.district && (
            <p className="mt-3 text-xs text-emerald-200 flex items-center space-x-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>{roleProfile.village ? `${roleProfile.village}, ` : ''}{roleProfile.district}, {roleProfile.state || 'India'}</span>
            </p>
          )}
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Sprout className="w-80 h-80" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Registered Farms"
          value={loading ? '...' : farms.length}
          subtitle="Land parcels under management"
          icon={Trees}
          color="emerald"
        />
        <StatCard
          title="Total Cultivated Land"
          value={loading ? '...' : `${totalAcreage.toFixed(1)} Acres`}
          subtitle="Across all registered plots"
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Soil Tests Conducted"
          value={loading ? '...' : totalSoilTests}
          subtitle="Farms with active soil telemetry"
          icon={TestTube2}
          color="sky"
        />
        <StatCard
          title="Predictive AI Suite"
          value="Ready"
          subtitle="Random Forest models active"
          icon={Cpu}
          color="purple"
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Quick Actions & Digital Services
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <Link
            to="/farmer/farms"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Add New Farm</span>
          </Link>

          <Link
            to="/farmer/crops"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Crop History</span>
          </Link>

          <Link
            to="/farmer/recommendation"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Crop Predictor</span>
          </Link>

          <Link
            to="/farmer/weather"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CloudSun className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Weather Forecast</span>
          </Link>

          <Link
            to="/farmer/marketplace"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Sell Produce</span>
          </Link>

          <Link
            to="/farmer/procurement"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Book Slot</span>
          </Link>
        </div>
      </div>

      {/* Farms Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">My Farm Parcels</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage land boundaries and soil nutrient status</p>
          </div>
          <Link
            to="/farmer/farms"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Loading farm details...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-amber-700 flex items-center justify-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : farms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Trees className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">No Farms Registered Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add your first agricultural land parcel to begin tracking soil nutrition, climate conditions, and crop recommendations.
            </p>
            <Link
              to="/farmer/farms"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register First Farm</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {farms.slice(0, 5).map((farm) => (
              <div key={farm.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{farm.farm_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                      {farm.irrigation_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-700">{farm.total_area_acres} Acres</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {farm.latest_soil ? (
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] text-slate-700 flex items-center space-x-2">
                      <span className="text-slate-500">N-P-K:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {farm.latest_soil.nitrogen_N}-{farm.latest_soil.phosphorus_P}-{farm.latest_soil.potassium_K}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">pH:</span>
                      <span className="font-mono font-bold text-emerald-800">{farm.latest_soil.pH}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      No Soil Test Logged
                    </span>
                  )}

                  <Link
                    to={`/farmer/farms/${farm.id}`}
                    className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="View Farm Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
