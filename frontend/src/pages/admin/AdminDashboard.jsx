import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cropsAPI } from '../../api/crops';
import apiClient from '../../api/client';
import StatCard from '../../components/StatCard';
import {
  ShieldCheck,
  BookOpen,
  Users,
  Database,
  Cpu,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [cropCount, setCropCount] = useState(0);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cropsAPI.getCrops(),
      apiClient.get('/health/')
    ])
      .then(([cropsRes, healthRes]) => {
        setCropCount(cropsRes?.data?.length || 0);
        setHealth(healthRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-sm text-purple-200 uppercase tracking-wider mb-3">
            System Administration Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Smart Agriculture Control Console
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-purple-200 leading-relaxed">
            Manage global master datasets, review agricultural crop profiles, oversee platform user registries, and inspect database collection telemetry.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-80 h-80" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Master Crops Catalog"
          value={loading ? '...' : cropCount}
          subtitle="Seeded agricultural varieties"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="MongoDB Collections"
          value="17 Active"
          subtitle="PyMongo direct connection pool"
          icon={Database}
          color="emerald"
        />
        <StatCard
          title="Database Status"
          value={health?.status === 'healthy' ? 'Healthy' : 'Online'}
          subtitle="MongoDB Atlas engine"
          icon={CheckCircle2}
          color="sky"
        />
        <StatCard
          title="ML Inference Models"
          value="4 Ready"
          subtitle="Crop, Yield, Fert RF & Disease CNN"
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">User Management</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Oversee registered farmers and wholesale buyers, inspect contact profiles, and toggle account activation status.
            </p>
          </div>
          <Link
            to="/admin/users"
            className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 hover:text-purple-800"
          >
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Crops Taxonomy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add new crop varieties with scientific boundaries (ideal temp, rainfall, soil pH, and growing period).
            </p>
          </div>
          <Link
            to="/admin/crops"
            className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 hover:text-purple-800"
          >
            <span>Manage Crops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Reports & Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review marketplace trading volumes, ML inference logs, and generate 1-click official CSV data exports.
            </p>
          </div>
          <Link
            to="/admin/reports"
            className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-sky-700 hover:text-sky-800"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Grievances Redressal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Handle complaints, marketplace payment disputes, and delivery issues submitted by farmers and buyers.
            </p>
          </div>
          <Link
            to="/admin/complaints"
            className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-rose-700 hover:text-rose-800"
          >
            <span>Handle Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
