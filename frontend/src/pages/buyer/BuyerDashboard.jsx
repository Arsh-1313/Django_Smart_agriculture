import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import {
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Building2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user, roleProfile } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-amber-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-sm text-amber-100 uppercase tracking-wider mb-3">
            Buyer Trade Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.first_name || user?.username}!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-amber-100 leading-relaxed">
            Directly connect with certified agricultural producers. Source quality-graded produce, compare mandi market benchmark rates, and place farm-direct wholesale orders.
          </p>
          {roleProfile?.business_name && (
            <p className="mt-3 text-xs text-amber-200 flex items-center space-x-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>{roleProfile.business_name} ({roleProfile.business_type}) — {roleProfile.city || 'Hub'}</span>
            </p>
          )}
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <ShoppingBag className="w-80 h-80" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Marketplace Listings"
          value="Active"
          subtitle="Direct farmer produce offers"
          icon={Store}
          color="amber"
        />
        <StatCard
          title="Pending Requests"
          value="0"
          subtitle="Orders awaiting farmer review"
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          title="Delivered Orders"
          value="0"
          subtitle="Successfully fulfilled volume"
          icon={Truck}
          color="sky"
        />
        <StatCard
          title="Mandi Benchmark"
          value="Live"
          subtitle="Agmarknet price monitoring"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Browse Produce Marketplace</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore farmer-posted harvest listings with verified variety, quality grades (Grade A/B/C), and available quintal volume.
            </p>
          </div>
          <Link
            to="/buyer/marketplace"
            className="mt-6 inline-flex items-center space-x-2 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <span>Explore Produce Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Commercial Profile & GST</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintain your trade license, delivery addresses, and commercial billing details to streamline farmer purchase agreements.
            </p>
          </div>
          <Link
            to="/buyer/profile"
            className="mt-6 inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Update Business Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
