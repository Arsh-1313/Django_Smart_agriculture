import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  Sprout,
  Cpu,
  CloudSun,
  Store,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    apiClient.get('/health/')
      .then((res) => setHealth(res))
      .catch((err) => setHealth({ status: 'offline', error: err?.message }))
      .finally(() => setLoadingHealth(false));
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'buyer') return '/buyer/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/farmer/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 text-slate-800">
      {/* Top Banner Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">Smart Agriculture</h1>
            <p className="text-xs text-emerald-700 font-semibold">AI-Powered Farmer Assistance Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <Link
              to={getDashboardLink()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-center">
        <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Full-Stack Digital Farming Infrastructure</span>
        </span>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Smarter Agriculture with <span className="text-emerald-600">Predictive AI</span> & Direct Market Access
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering farmers with soil nutrient intelligence, trained machine learning for crop and yield prediction, real-time meteorological forecasts, mandi price transparency, and seamless buyer trade.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
          >
            <Sprout className="w-5 h-5" />
            <span>Join as Farmer or Buyer</span>
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
          >
            <span>Sign In to Platform</span>
          </Link>
        </div>

        {/* Health Probe Indicator */}
        <div className="mt-8 inline-flex items-center space-x-3 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
          {loadingHealth ? (
            <span className="flex items-center space-x-1.5 text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Checking backend API status...</span>
            </span>
          ) : health?.status === 'healthy' ? (
            <span className="flex items-center space-x-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{health.service} v{health.version}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">{health.database?.details}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2 text-amber-700">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Backend Offline (Run: python manage.py runserver)</span>
            </span>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Comprehensive Digital Agricultural Ecosystem
          </h3>
          <p className="text-slate-600 text-sm mt-2">
            Built with modern architecture: Django REST Framework, PyMongo with 17 MongoDB Atlas collections, and React.js.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Sprout className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-2">Farm & Soil Telemetry</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Register parcel boundaries with GPS coordinates on interactive OpenStreetMap, and log historical N-P-K nutrient ratios, pH acidity, and moisture.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-2">Predictive AI Suite</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trained Random Forest models deliver scientific crop recommendations based on climate and soil chemistry, harvest yield predictions, and fertilizer dosages.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-sky-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <CloudSun className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-2">Agri-Weather & Mandi Feed</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live Open-Meteo microclimate telemetry and Agmarknet commodity market price monitoring help farmers schedule irrigation and time crop sales.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Store className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-2">Produce Marketplace</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Farmers create live product listings with variety, grade, and quintal pricing. Verified buyers place purchase requests with end-to-end tracking.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-2">Procurement Management</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Locate government and private procurement centres, view available capacity quotas, and book time slots with automated QR/booking verification codes.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-purple-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-2">Role-Based Security</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Custom JWT authentication with granular permissions strictly separates Farmer, Buyer, and Administrator dashboards, keeping data private and safe.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p className="font-medium">Smart Agriculture – AI-Powered Farmer Assistance Platform</p>
        <p className="mt-1">Full-Stack Application Powered by React, Django, PyMongo & MongoDB Atlas</p>
      </footer>
    </div>
  );
};

export default LandingPage;
