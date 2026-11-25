import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import StatCard from '../../components/StatCard';
import {
  BarChart3,
  Download,
  Users,
  ShoppingBag,
  Cpu,
  ShieldAlert,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Sprout,
  Activity
} from 'lucide-react';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReportsSummary();
      setData(res?.data || null);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = (type) => {
    const token = localStorage.getItem('access_token');
    // Fetch and download CSV with auth header
    fetch(adminAPI.getExportUrl(type), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartagri_${type}_report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Export failed: ' + err.message));
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <span className="text-sm font-semibold">Generating system telemetry reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            Platform Analytics & System Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time platform usage metrics, marketplace trade volume, ML inference statistics, and downloadable data reports.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Users"
          value={data?.users?.total || 0}
          subtitle={`${data?.users?.farmers || 0} Farmers, ${data?.users?.buyers || 0} Buyers`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Market Traded Volume"
          value={`₹${(data?.marketplace?.total_traded_value_inr || 0).toLocaleString()}`}
          subtitle={`${data?.marketplace?.total_orders || 0} total purchase orders`}
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          title="Farmland Acreage"
          value={`${data?.farms?.total_acreage || 0} Acres`}
          subtitle={`Across ${data?.farms?.total_farms || 0} mapped farms`}
          icon={Sprout}
          color="sky"
        />
        <StatCard
          title="AI Diagnostics Run"
          value={(data?.predictions?.crop_recommendations || 0) + (data?.predictions?.disease_scans || 0)}
          subtitle={`${data?.predictions?.disease_scans || 0} leaf disease scans`}
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* CSV Export Center */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Official Data Export Center (CSV)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Download comprehensive operational CSV records for auditing, agricultural planning, and government compliance reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { type: 'users', label: 'User Directory', desc: 'Farmers, buyers, contact & statuses' },
            { type: 'orders', label: 'Marketplace Orders', desc: 'Traded volume, price & fulfillment' },
            { type: 'listings', label: 'Produce Listings', desc: 'Active lots, quantities & asking price' },
            { type: 'diseases', label: 'Disease Detections', desc: 'Leaf scans, diagnoses & confidence' },
            { type: 'bookings', label: 'Procurement Slots', desc: 'Depot delivery appointments' },
          ].map((item) => (
            <div
              key={item.type}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex flex-col justify-between transition-colors"
            >
              <div>
                <FileSpreadsheet className="w-5 h-5 text-purple-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-800">{item.label}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
              </div>
              <button
                onClick={() => handleExport(item.type)}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Analytical Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Learning Telemetry */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            Machine Learning Inferences Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Crop Recommendations (RF Classifier):</span>
              <span className="font-bold text-slate-900">{data?.predictions?.crop_recommendations || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Yield Predictions (RF Regressor Pipeline):</span>
              <span className="font-bold text-slate-900">{data?.predictions?.yield_predictions || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Fertilizer Advice (RF Pipeline):</span>
              <span className="font-bold text-slate-900">{data?.predictions?.fertilizer_recommendations || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Leaf Disease Foliar Scans (CNN Keras):</span>
              <span className="font-bold text-slate-900">{data?.predictions?.disease_scans || 0}</span>
            </div>
          </div>

          {/* Disease Class Incidence */}
          {data?.predictions?.disease_breakdown?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Top Detected Foliar Pathogens
              </h4>
              <div className="space-y-2">
                {data.predictions.disease_breakdown.slice(0, 5).map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 truncate pr-2">{d.disease}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                      {d.count} scan{d.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support & Grievances Redressal Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            Grievances & Support Health
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Total Registered Tickets:</span>
              <span className="font-bold text-slate-900">{data?.support?.total_tickets || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Open Grievances (Awaiting Action):</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px]">
                {data?.support?.open_tickets || 0} Open
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Resolved Complaints:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                {data?.support?.resolved_tickets || 0} Resolved
              </span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-xs text-purple-900 space-y-1">
            <p className="font-bold">Prompt Grievance Resolution</p>
            <p className="text-[11px] text-purple-700 leading-relaxed">
              Timely resolution of payment, order disputes, and procurement slot reservations directly improves farmer trust and platform adoption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
