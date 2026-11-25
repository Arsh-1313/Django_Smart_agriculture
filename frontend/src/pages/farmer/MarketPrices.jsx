import React, { useState, useEffect } from 'react';
import { marketAPI } from '../../api/market';
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
  TrendingUp,
  Search,
  Filter,
  Store,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);

  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    Promise.all([
      marketAPI.getCommodities(),
      marketAPI.getStates()
    ]).then(([comRes, stRes]) => {
      setCommodities(comRes?.data || []);
      setStates(stRes?.data || []);
    }).catch((err) => console.error(err));
  }, []);

  const loadPrices = () => {
    setLoading(true);
    marketAPI.getPrices({
      commodity: selectedCommodity,
      state: selectedState,
      q: searchQuery
    })
      .then((res) => {
        setPrices(res?.data || []);
      })
      .catch((err) => setError(err?.message || 'Failed to fetch mandi prices.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(loadPrices, 200);
    return () => clearTimeout(timer);
  }, [selectedCommodity, selectedState, searchQuery]);

  // Chart: Mandi Price Comparison for current records
  const chartLabels = prices.slice(0, 8).map((p) => `${p.market} (${p.commodity})`);
  const chartModalPrices = prices.slice(0, 8).map((p) => p.modal_price);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Modal Benchmark Price (₹ / Quintal)',
        data: chartModalPrices,
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        hoverBackgroundColor: 'rgba(5, 150, 105, 0.9)',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: false, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Agmarknet / data.gov.in Mandi Feed</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Agricultural Mandi Market Prices
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Daily wholesale prices, mandi arrivals, and modal benchmark rates across regulated APMC markets in India.
          </p>
        </div>

        <button
          onClick={loadPrices}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Rates</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Commodity Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Commodity
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* State Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Filter by State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search APMC Mandi or Variety
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Nashik, Azadpur, Lokwan..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Mandi Comparison Chart Card */}
      {prices.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Mandi Benchmark Rate Comparison
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modal price distribution (₹ per Quintal) across active markets
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800">
              Live Mandi Data
            </span>
          </div>

          <div className="h-56 w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Mandi Price Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              APMC Mandi Arrival Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {prices.length} market reporting records for today
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Unit: ₹ / Quintal (100 kg)
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Fetching Agmarknet mandi feeds...</span>
          </div>
        ) : prices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">No mandi price records found for your current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Commodity & Variety</th>
                  <th className="px-6 py-3.5">APMC Mandi & Location</th>
                  <th className="px-6 py-3.5">Min Price</th>
                  <th className="px-6 py-3.5">Max Price</th>
                  <th className="px-6 py-3.5 font-bold text-slate-900">Modal Price</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {prices.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{p.commodity}</span>
                      <span className="text-[10px] text-slate-400">{p.variety}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">{p.market}</span>
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.district}, {p.state}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">₹ {p.min_price}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">₹ {p.max_price}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        ₹ {p.modal_price}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {p.arrival_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPrices;
