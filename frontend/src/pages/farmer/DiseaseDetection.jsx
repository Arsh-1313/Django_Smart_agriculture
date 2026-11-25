import React, { useState, useEffect, useRef } from 'react';
import {
  Bug,
  Upload,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Info,
  Clock,
  RefreshCw,
  Sparkles,
  FileText,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  Sprout
} from 'lucide-react';
import diseaseApi from '../../api/disease';
import farmsAPI from '../../api/farms';

const SAMPLE_LEAF_PRESETS = [
  {
    name: 'Tomato Early Blight Sample',
    crop: 'Tomato',
    description: 'Concentric target-board necrotic lesions with yellow halo.',
    color: '#3d2612',
    bgColor: '#4a7c29',
    haloColor: '#d4b106'
  },
  {
    name: 'Potato Late Blight Sample',
    crop: 'Potato',
    description: 'Water-soaked purplish lesions with water-logged rot.',
    color: '#242a22',
    bgColor: '#3b6e22',
    haloColor: '#a1a89c'
  },
  {
    name: 'Corn Rust Sample',
    crop: 'Maize',
    description: 'Elongated cinnamon orange pustules along leaf blade.',
    color: '#a34808',
    bgColor: '#528224',
    haloColor: '#d97706'
  },
  {
    name: 'Healthy Tomato Leaf',
    crop: 'Tomato',
    description: 'Uniform lush chlorophyll green with no lesion spotting.',
    color: '#2e7d32',
    bgColor: '#388e3c',
    haloColor: '#4caf50'
  }
];

const DiseaseDetection = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('diagnose'); // 'diagnose' | 'history'

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load farms and past scans
    farmsAPI.getFarms().then(res => {
      if (res.data) setFarms(res.data);
    }).catch(() => {});

    diseaseApi.getHistory().then(res => {
      if (res.success) setHistory(res.data);
    }).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleSelectPreset = (preset) => {
    // Generate a synthetic test image blob on an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw leaf shape
    ctx.fillStyle = preset.bgColor;
    ctx.beginPath();
    ctx.ellipse(128, 128, 90, 115, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Leaf main vein
    ctx.strokeStyle = '#225514';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(128, 20);
    ctx.lineTo(128, 236);
    ctx.stroke();

    // Draw disease spots
    if (preset.name.includes('Early Blight')) {
      [
        { x: 90, y: 80, r: 24 },
        { x: 155, y: 140, r: 28 },
        { x: 110, y: 180, r: 20 }
      ].forEach(pt => {
        // Yellow halo
        ctx.fillStyle = preset.haloColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r + 6, 0, 2 * Math.PI);
        ctx.fill();
        // Concentric dark rings
        ctx.fillStyle = preset.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#1a0e04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * 0.5, 0, 2 * Math.PI);
        ctx.stroke();
      });
    } else if (preset.name.includes('Late Blight')) {
      [
        { x: 80, y: 100, rx: 35, ry: 45 },
        { x: 160, y: 150, rx: 40, ry: 30 }
      ].forEach(pt => {
        ctx.fillStyle = preset.color;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, pt.rx, pt.ry, 0.4, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else if (preset.name.includes('Rust')) {
      for (let i = 0; i < 20; i++) {
        const rx = 60 + Math.random() * 136;
        const ry = 40 + Math.random() * 176;
        ctx.fillStyle = preset.color;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 4, 10, 0.2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    canvas.toBlob((blob) => {
      const file = new File([blob], `${preset.name.toLowerCase().replace(/\s+/g, '_')}.png`, { type: 'image/png' });
      setSelectedFile(file);
      setPreviewUrl(canvas.toDataURL());
      setResult(null);
      setError('');
    });
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload or select a leaf sample image to diagnose.');
      return;
    }

    setDiagnosing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (selectedFarmId) {
        formData.append('farm_id', selectedFarmId);
      }

      const res = await diseaseApi.detectDisease(formData);
      if (res.success) {
        setResult(res.data);
        // Refresh past scans
        diseaseApi.getHistory().then(hRes => {
          if (hRes.success) setHistory(hRes.data);
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Inference failed. Please ensure the image is clear.');
    } finally {
      setDiagnosing(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bug className="w-4 h-4" />
            <span>Computer Vision & Deep Learning</span>
          </div>
          <h1 className="text-2xl font-bold">Crop Disease Detection & Leaf Pathology</h1>
          <p className="text-slate-300 text-xs mt-1">
            Upload leaf photos to identify fungal, bacterial, and oomycete pathogens with AI confidence metrics and certified agronomic treatments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'diagnose' ? 'history' : 'diagnose')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Clock className="w-4 h-4" />
            <span>{activeTab === 'diagnose' ? `Scan History (${history.length})` : 'New Diagnosis'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Diagnosis Workspace */}
      {activeTab === 'diagnose' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Upload & Presets */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Upload Leaf Photograph</span>
              </h3>

              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
                  previewUrl
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-3 w-full">
                    <img
                      src={previewUrl}
                      alt="Selected Leaf"
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
                    />
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
                      <span className="font-semibold text-slate-700">{selectedFile?.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setResult(null);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-xs">Click to browse or drop leaf image</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports high-res JPG, PNG, or WebP</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Farm Link */}
              {farms.length > 0 && (
                <div>
                  <label className="font-semibold text-slate-700 block text-xs mb-1">Link to Farm (Optional)</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No farm association</option>
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.location_state || 'Field'})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleDiagnose}
                disabled={diagnosing || !selectedFile}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                {diagnosing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Neural Features...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Diagnose Plant Disease</span>
                  </>
                )}
              </button>
            </div>

            {/* 1-Click Interactive Test Samples */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">Quick Test Samples</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">1-Click Demo</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Don't have a leaf image handy? Click any pathology sample below to test AI detection instantly:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_LEAF_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-left transition text-xs group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.haloColor }} />
                      <strong className="font-bold text-slate-800 text-[11px] group-hover:text-emerald-700">
                        {p.crop}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-500 block line-clamp-1">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostic Output */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Condition Diagnosis Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide">
                        {result.crop} Pathology Result
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                        {result.display_name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pathogen: <strong className="text-slate-700 font-semibold">{result.pathogen}</strong>
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getUrgencyBadge(result.urgency)}`}>
                      Urgency: {result.urgency}
                    </span>
                  </div>

                  {/* Confidence Meter */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Model Confidence:</span>
                      <span className="font-bold text-emerald-700 text-sm">{result.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          result.confidence > 80
                            ? 'bg-emerald-500'
                            : result.confidence > 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Visual Symptoms */}
                  {result.symptoms?.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h4 className="font-bold text-xs text-slate-800">Characteristic Diagnostic Symptoms:</h4>
                      <ul className="space-y-1">
                        {result.symptoms.map((s, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Treatment & Management Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    {/* Organic / Biological */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                      <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span>Organic & Biological Solutions</span>
                      </span>
                      <ul className="space-y-1.5 text-emerald-800">
                        {result.organic_treatment?.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Chemical Control */}
                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
                      <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                        <Bug className="w-4 h-4 text-blue-600" />
                        <span>Chemical Control & Dosages</span>
                      </span>
                      <ul className="space-y-1.5 text-blue-800">
                        {result.chemical_control?.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Preventative Practices */}
                  {result.preventative_measures?.length > 0 && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <span className="font-bold text-slate-800 block">Preventative Cultural Practices:</span>
                      <ul className="space-y-1 text-slate-600 text-[11px]">
                        {result.preventative_measures.map((p, idx) => (
                          <li key={idx}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Top Alternatives */}
                  {result.top_alternatives?.length > 0 && (
                    <div className="pt-2 text-xs">
                      <span className="text-slate-400 text-[11px] block mb-1">Ranked Secondary Possibilities:</span>
                      <div className="flex flex-wrap gap-2">
                        {result.top_alternatives.map((alt, idx) => (
                          <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                            {alt.name}: <strong className="text-slate-900">{alt.confidence}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Agronomic Disclaimer */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Agronomic Extension Caution:</strong> {result.agronomic_disclaimer}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
                <Bug className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">Awaiting Leaf Inspection</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload an image of a plant leaf or select one of the demonstration samples on the left to initiate neural disease diagnosis.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {history.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No historical disease scans found. Run your first leaf inspection above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Scan Date</th>
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-4">Diagnosed Condition</th>
                    <th className="py-3 px-4">Pathogen</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(h.detected_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{h.crop}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{h.display_name}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{h.pathogen}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700">{h.confidence}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          h.is_healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {h.is_healthy ? 'HEALTHY' : 'DISEASE DETECTED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
