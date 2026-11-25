import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../api/weather';
import { farmsAPI } from '../../api/farms';
import MapPicker from '../../components/MapPicker';
import {
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Trees,
  Search,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

const WeatherDashboard = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  const [coords, setCoords] = useState({ lat: 19.9975, lon: 73.7898, locationName: 'Nashik, Maharashtra' });
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Geocoding search
  const [searchQuery, setSearchQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [searchingGeo, setSearchingGeo] = useState(false);

  // Load farms on mount
  useEffect(() => {
    farmsAPI.getFarms()
      .then((res) => {
        const list = res?.data || [];
        setFarms(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedFarmId(first.id);
          const fCoords = first.location?.coordinates || [73.7898, 19.9975];
          setCoords({
            lat: fCoords[1],
            lon: fCoords[0],
            locationName: `${first.farm_name} (${first.district}, ${first.state})`
          });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchWeatherData = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const [currRes, foreRes] = await Promise.all([
        weatherAPI.getCurrent({ lat, lon }),
        weatherAPI.getForecast({ lat, lon, days: 7 }),
      ]);
      setCurrentWeather(currRes?.data);
      setForecast(foreRes?.data?.forecast || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch meteorological data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (coords.lat && coords.lon) {
      fetchWeatherData(coords.lat, coords.lon);
    }
  }, [coords.lat, coords.lon]);

  const handleFarmSelect = (e) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);
    if (!fId) return;

    const farmObj = farms.find((f) => f.id === fId);
    if (farmObj && farmObj.location?.coordinates) {
      const c = farmObj.location.coordinates;
      setCoords({
        lat: c[1],
        lon: c[0],
        locationName: `${farmObj.farm_name} (${farmObj.district}, ${farmObj.state})`
      });
    }
  };

  const handleSearchGeo = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length >= 2) {
      setSearchingGeo(true);
      weatherAPI.geocode(q)
        .then((res) => setGeoResults(res?.data || []))
        .catch(() => setGeoResults([]))
        .finally(() => setSearchingGeo(false));
    } else {
      setGeoResults([]);
    }
  };

  const handleSelectGeoPlace = (place) => {
    setCoords({
      lat: place.latitude,
      lon: place.longitude,
      locationName: `${place.name}, ${place.state || place.country}`
    });
    setSelectedFarmId('');
    setSearchQuery('');
    setGeoResults([]);
  };

  const getWeatherIcon = (desc = '') => {
    const d = desc.toLowerCase();
    if (d.includes('thunder')) return CloudLightning;
    if (d.includes('rain') || d.includes('drizzle')) return CloudRain;
    if (d.includes('cloud') || d.includes('overcast')) return Cloud;
    if (d.includes('clear') || d.includes('sun')) return Sun;
    return CloudSun;
  };

  const CurrentIcon = getWeatherIcon(currentWeather?.weather_desc);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <CloudSun className="w-4 h-4" />
            <span>Open-Meteo Meteorological Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Agricultural Weather Dashboard
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Real-time local weather observations, soil moisture suitability, and 7-day agricultural rain forecasts.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchWeatherData(coords.lat, coords.lon);
          }}
          disabled={refreshing || loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Observations</span>
        </button>
      </div>

      {/* Control Bar: Farm Selector & Location Geocoder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Farm Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Trees className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select Registered Farm Plot</span>
          </label>
          <select
            value={selectedFarmId}
            onChange={handleFarmSelect}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
          >
            {farms.length === 0 ? (
              <option value="">No registered farms found (using default)</option>
            ) : (
              farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name} — {f.district}, {f.state}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Location Geocoder Search */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-sky-600" />
            <span>Search Any Village or City</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchGeo}
              placeholder="Search e.g. Nashik, Ludhiana, Pune, Baramati..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 pr-8"
            />
            {searchingGeo && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-2.5" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {geoResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
              {geoResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectGeoPlace(r)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-sky-50 flex items-center justify-between text-slate-800 transition-colors"
                >
                  <span className="font-semibold">{r.name}, {r.state}</span>
                  <span className="font-mono text-[10px] text-slate-400">{r.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Meteorological Card */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-sm">Fetching meteorological satellites & telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-sky-900/10 lg:col-span-5 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-sm text-sky-100 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{coords.locationName}</span>
                </span>
                <span className="text-xs text-sky-200 font-mono">
                  {coords.lat?.toFixed(3)}° N, {coords.lon?.toFixed(3)}° E
                </span>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  <h3 className="text-6xl sm:text-7xl font-extrabold tracking-tighter">
                    {Math.round(currentWeather?.temperature || 0)}°<span className="text-3xl text-sky-200 font-bold">C</span>
                  </h3>
                  <p className="text-sm font-semibold text-sky-100 mt-1 capitalize">
                    {currentWeather?.weather_desc}
                  </p>
                  <p className="text-xs text-sky-200">
                    Feels like {Math.round(currentWeather?.apparent_temperature || currentWeather?.temperature || 0)}°C
                  </p>
                </div>
                <CurrentIcon className="w-20 h-20 text-sky-200/90" />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="relative z-10 grid grid-cols-3 gap-2 pt-6 border-t border-white/15 text-center text-xs mt-6">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                <div className="flex items-center justify-center space-x-1 text-sky-200 mb-1">
                  <Droplets className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Humidity</span>
                </div>
                <span className="font-extrabold text-sm">{currentWeather?.humidity}%</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                <div className="flex items-center justify-center space-x-1 text-sky-200 mb-1">
                  <Wind className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Wind</span>
                </div>
                <span className="font-extrabold text-sm">{currentWeather?.wind_speed} km/h</span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
                <div className="flex items-center justify-center space-x-1 text-sky-200 mb-1">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold">Precip</span>
                </div>
                <span className="font-extrabold text-sm">{currentWeather?.precipitation || 0} mm</span>
              </div>
            </div>
          </div>

          {/* Interactive Farm Map Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm lg:col-span-7 h-[380px] flex flex-col justify-between">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Microclimate Geographic Pin</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">OpenStreetMap Telemetry</span>
            </div>
            <div className="flex-1 w-full relative">
              <MapPicker
                latitude={coords.lat}
                longitude={coords.lon}
                height="100%"
                interactive={false}
                markerLabel={coords.locationName}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Agricultural Forecast Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              7-Day Agricultural Forecast
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan planting, irrigation scheduling, and harvesting around projected rainfall probability.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-100">
            Open-Meteo Synoptic Model
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((day, idx) => {
            const DayIcon = getWeatherIcon(day.weather_desc);
            const dateObj = new Date(day.date);
            const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div
                key={day.date}
                className={`p-4 rounded-2xl border text-center flex flex-col justify-between transition-all ${
                  idx === 0
                    ? 'bg-sky-50/70 border-sky-200 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200 hover:border-sky-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{dayName}</span>
                  <span className="text-[10px] text-slate-400 block mb-3">{monthDay}</span>
                  <DayIcon className="w-8 h-8 text-sky-600 mx-auto my-2" />
                  <span className="text-[11px] font-semibold text-slate-700 block truncate" title={day.weather_desc}>
                    {day.weather_desc}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1">
                  <div className="flex items-center justify-center space-x-1.5 text-xs font-mono font-bold">
                    <span className="text-slate-900">{Math.round(day.temp_max)}°</span>
                    <span className="text-slate-400 font-normal">/</span>
                    <span className="text-slate-500 font-normal">{Math.round(day.temp_min)}°</span>
                  </div>

                  <div className="flex items-center justify-center space-x-1 text-[10px] text-sky-700 font-semibold">
                    <CloudRain className="w-3 h-3 text-sky-500" />
                    <span>{day.precipitation_probability ?? 0}% rain</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
