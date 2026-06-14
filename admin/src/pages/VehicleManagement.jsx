import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, Fuel, Settings, CarFront, Activity,
  CheckCircle, RefreshCw, Search, Users, Zap, Shield,
  Music, ChevronRight, ChevronLeft, MapPin, Star, Edit2
} from 'lucide-react';
import axios from 'axios';

// Fallback local assets
import AudiImg    from '../assets/AudiElectric.png';
import SkodaImg   from '../assets/skoda.png';
import MercedesImg from '../assets/mercedes.png';
import KiaImg     from '../assets/Kia.png';
import SupraImg   from '../assets/supra.png';
import NanoImg    from '../assets/Nano.png';
import HondaImg   from '../assets/Honda.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LOCAL_ASSETS = { audi: AudiImg, skoda: SkodaImg, mercedes: MercedesImg,
  honda: HondaImg, kia: KiaImg, supra: SupraImg, nano: NanoImg, default: AudiImg };

const getCarImage = (car) => {
  if (car.images?.[0]?.startsWith('http')) return car.images[0];
  const key = (car.images?.[0] || car.brand || '').toLowerCase();
  for (const k of Object.keys(LOCAL_ASSETS)) {
    if (key.includes(k)) return LOCAL_ASSETS[k];
  }
  return LOCAL_ASSETS.default;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

// ── Reusable form field components ────────────────────────────────────────────
const inputCls = 'w-full p-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 rounded-xl font-medium text-gray-800 transition-all outline-none text-sm';
const labelCls = 'text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block';

const Field = ({ label, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <Field label={label}>
    <input className={inputCls} {...props} />
  </Field>
);

const Select = ({ label, children, ...props }) => (
  <Field label={label}>
    <select className={inputCls + ' appearance-none cursor-pointer'} {...props}>
      {children}
    </select>
  </Field>
);

// Tag input — press Enter or comma to add
const TagInput = ({ label, tags, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };
  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));
  return (
    <Field label={label}>
      <div className="min-h-[46px] p-2 bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 rounded-xl transition-all flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span key={i} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">
            {t}
            <button type="button" onClick={() => remove(i)} className="hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-medium text-gray-800 placeholder-gray-400"
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1 ml-1">Press Enter or comma to add</p>
    </Field>
  );
};

// ── TABS config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'basics',      label: 'Basics',      icon: CarFront },
  { id: 'performance', label: 'Performance',  icon: Zap },
  { id: 'features',    label: 'Features',     icon: Shield },
  { id: 'media',       label: 'Media & Notes', icon: Music },
];

const EMPTY_FORM = {
  // Basics
  brand: '', name: '', model: '', year: new Date().getFullYear(),
  color: 'White', licensePlate: '',
  category: 'suv', fuelType: 'petrol', transmission: 'automatic',
  seats: 5, doors: 4,
  location: '', pricePerDay: '', pricePerHour: '', depositAmount: '',
  // Performance
  engineType: '', engineCC: '', horsepower: '', torqueNm: '',
  topSpeedKmh: '', zeroTo100: '',
  mileage: '', evRangeKm: '', fuelTankL: '', batteryKwh: '', bootSpaceL: '',
  // Features
  features: [], safetyFeatures: [], comfortFeatures: [], entertainmentFeatures: [],
  highlights: [],
  // Media & Notes
  imageUrl: '', description: '',
  odometerKm: '', lastServicedAt: '',
};

// ── Main component ─────────────────────────────────────────────────────────────
const VehicleManagement = () => {
  const [vehicles, setVehicles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stats, setStats]             = useState({ totalCars: 0, availableCars: 0, rentedCars: 0 });
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab]     = useState('basics');
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const [carsRes, statsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/cars`),
        axios.get(`${API_URL}/admin/stats/vehicle-analytics`, { headers })
      ]);
      if (carsRes.status === 'fulfilled' && carsRes.value.data.success)
        setVehicles(carsRes.value.data.data);
      if (statsRes.status === 'fulfilled' && statsRes.value.data.success)
        setStats(statsRes.value.data.data);
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.brand || !formData.name || !formData.pricePerDay || !formData.location) {
      setFormError('Brand, Name, Price/day and Location are required.');
      setActiveTab('basics');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        images: formData.imageUrl ? [formData.imageUrl] : [],
      };
      delete payload.imageUrl;
      await axios.post(`${API_URL}/cars`, payload, { headers: getAuthHeader() });
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      setActiveTab('basics');
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add vehicle. Check all required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/cars/${id}`, { headers: getAuthHeader() });
      fetchData();
    } catch {
      alert('Failed to delete. It may have active bookings.');
    }
  };

  const openModal = () => { setFormData(EMPTY_FORM); setActiveTab('basics'); setFormError(''); setIsModalOpen(true); };

  const filteredVehicles = vehicles.filter(car => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || (car.name + car.brand + car.model).toLowerCase().includes(q);
    const matchCat = filterCategory === 'all' || car.category === filterCategory;
    return matchSearch && matchCat;
  });

  const localTotal     = vehicles.length;
  const localAvailable = vehicles.filter(v => v.available).length;
  const displayTotal   = stats.totalCars     || localTotal;
  const displayAvail   = stats.availableCars || localAvailable;
  const displayRented  = stats.rentedCars    || (localTotal - localAvailable);
  const utilization    = displayTotal > 0 ? Math.round((displayRented / displayTotal) * 100) : 0;

  const tabIndex = TABS.findIndex(t => t.id === activeTab);
  const isLastTab = tabIndex === TABS.length - 1;
  const isFirstTab = tabIndex === 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50">
      <div className="max-w-[1800px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
              Fleet <span className="text-blue-600 italic">Command</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Manage your vehicle inventory</p>
          </div>
          <button onClick={fetchData} title="Refresh"
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Fleet',  value: displayTotal,  sub: 'Vehicles in system', icon: CarFront, color: 'blue' },
            { label: 'Available',    value: displayAvail,  sub: 'Ready to book',      icon: CheckCircle, color: 'green' },
            { label: 'On Trip',      value: displayRented, sub: `${utilization}% utilization`, icon: Activity, color: 'orange' },
          ].map(({ label, value, sub, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-2xl`}><Icon size={22} /></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
              </div>
              <h3 className="text-3xl font-black text-gray-900">{value}</h3>
              <p className={`text-xs font-bold text-${color}-600 mt-1 uppercase`}>{sub}</p>
            </motion.div>
          ))}

          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            onClick={openModal}
            className="bg-blue-600 p-6 rounded-3xl hover:bg-blue-700 transition-all group flex flex-col items-center justify-center text-white shadow-lg shadow-blue-200">
            <div className="p-3 bg-white/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Plus size={28} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm">Add New Vehicle</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-72 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
            <Search size={16} className="text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search brand, name, model..."
              className="bg-transparent outline-none text-sm font-bold text-gray-700 placeholder-gray-400 w-full" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
            {['all', 'suv', 'sedan', 'hatchback', 'luxury', 'sports', 'electric', 'minivan', 'pickup'].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all
                  ${filterCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="animate-spin text-blue-600" size={36} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredVehicles.length > 0 ? filteredVehicles.map(car => (
                <motion.div key={car._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden">

                  {/* Status badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full
                      ${car.available ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {car.available ? 'Available' : 'Rented'}
                    </span>
                  </div>

                  {/* Car image */}
                  <div className="h-40 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-[1.5rem] mb-4 group-hover:from-blue-50/40 transition-colors">
                    <img src={getCarImage(car)} alt={car.name}
                      className="max-h-[80%] max-w-[88%] object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-lg"
                      onError={e => { e.target.src = LOCAL_ASSETS.default; }} />
                  </div>

                  {/* Identity */}
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{car.brand} · {car.year}</p>
                  <h3 className="font-black text-lg text-gray-900 leading-tight mt-0.5">
                    {car.name} <span className="text-gray-400 font-normal text-sm">{car.model}</span>
                  </h3>

                  {/* Spec pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                    <Pill icon={<Fuel size={9} />} text={car.fuelType} />
                    <Pill icon={<Settings size={9} />} text={car.transmission} />
                    <Pill icon={<Users size={9} />} text={`${car.seats}s`} />
                    {car.horsepower  && <Pill icon={<Zap size={9} />}    text={`${car.horsepower}bhp`} />}
                    {car.mileage     && <Pill icon={<Activity size={9}/>} text={`${car.mileage}kmpl`} />}
                    {car.evRangeKm   && <Pill icon={<Zap size={9} />}    text={`${car.evRangeKm}km`} color="green" />}
                  </div>

                  {/* Location */}
                  {car.location && (
                    <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-3">
                      <MapPin size={10} /> {car.location}
                    </p>
                  )}

                  {/* Highlights (first 2) */}
                  {car.highlights?.length > 0 && (
                    <div className="mb-3 space-y-0.5">
                      {car.highlights.slice(0, 2).map((h, i) => (
                        <p key={i} className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                          <Star size={8} className="text-yellow-400 fill-yellow-400 flex-shrink-0" /> {h}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Price & actions */}
                  <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                    <div>
                      <span className="font-black text-xl text-gray-900">₹{car.pricePerDay?.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">/day</span>
                      {car.pricePerHour > 0 && (
                        <p className="text-[10px] font-bold text-blue-500 mt-0.5">₹{car.pricePerHour?.toLocaleString()}/hr</p>
                      )}
                      {car.depositAmount > 0 && (
                        <p className="text-[10px] font-bold text-orange-500 mt-0.5">₹{car.depositAmount?.toLocaleString()} deposit</p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(car._id)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300">
                  <CarFront size={56} className="mb-3 opacity-30" />
                  <p className="text-lg font-bold text-gray-500">No vehicles found</p>
                  <p className="text-sm text-gray-400">Try a different search or filter</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Add Vehicle Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

              {/* Modal header */}
              <div className="flex justify-between items-center px-8 pt-7 pb-5 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Add Vehicle</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Expand your fleet</p>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-gray-100 px-6">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all
                      ${activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                  {/* ── BASICS ── */}
                  {activeTab === 'basics' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Brand *"     placeholder="e.g. Toyota"   value={formData.brand}   onChange={e => set('brand', e.target.value)} required />
                        <Input label="Name *"      placeholder="e.g. Fortuner" value={formData.name}    onChange={e => set('name', e.target.value)}  required />
                        <Input label="Model / Trim" placeholder="e.g. Legender 4x4" value={formData.model} onChange={e => set('model', e.target.value)} />
                        <Input label="Year" type="number" min="1990" max="2030" value={formData.year} onChange={e => set('year', e.target.value)} required />
                        <Input label="Color" placeholder="e.g. Pearl White" value={formData.color} onChange={e => set('color', e.target.value)} required />
                        <Input label="License Plate" placeholder="e.g. MH12AB1234" value={formData.licensePlate} onChange={e => set('licensePlate', e.target.value)} />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Select label="Category" value={formData.category} onChange={e => set('category', e.target.value)}>
                          {['suv','sedan','hatchback','luxury','sports','electric','minivan','pickup'].map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                        </Select>
                        <Select label="Fuel Type" value={formData.fuelType} onChange={e => set('fuelType', e.target.value)}>
                          {['petrol','diesel','electric','hybrid','cng'].map(f => (
                            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                          ))}
                        </Select>
                        <Select label="Transmission" value={formData.transmission} onChange={e => set('transmission', e.target.value)}>
                          {[['manual','Manual'],['automatic','Automatic'],['cvt','CVT'],['amt','AMT']].map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Seats" type="number" min="2" max="12" value={formData.seats} onChange={e => set('seats', e.target.value)} required />
                        <Input label="Doors" type="number" min="2" max="5"  value={formData.doors} onChange={e => set('doors', e.target.value)} />
                      </div>

                      <Input label="Location *" placeholder="e.g. Mumbai Central Hub" value={formData.location} onChange={e => set('location', e.target.value)} required />

                      <div className="grid grid-cols-3 gap-4">
                        <Input label="Price / Day (₹) *" type="number" min="0" placeholder="e.g. 3500" value={formData.pricePerDay} onChange={e => set('pricePerDay', e.target.value)} required />
                        <Input label="Price / Hour (₹)"  type="number" min="0" placeholder="Optional"  value={formData.pricePerHour} onChange={e => set('pricePerHour', e.target.value)} />
                        <Input label="Security Deposit (₹)" type="number" min="0" placeholder="e.g. 5000" value={formData.depositAmount} onChange={e => set('depositAmount', e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* ── PERFORMANCE ── */}
                  {activeTab === 'performance' && (
                    <>
                      <p className="text-xs text-gray-400 font-medium -mb-2">All fields optional. Leave blank if not applicable.</p>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Engine Type"  placeholder="e.g. 2.8L Turbo Diesel" value={formData.engineType} onChange={e => set('engineType', e.target.value)} />
                        <Input label="Engine Displacement (cc)" type="number" placeholder="e.g. 2755" value={formData.engineCC} onChange={e => set('engineCC', e.target.value)} />
                        <Input label="Horsepower (bhp)" type="number" placeholder="e.g. 201" value={formData.horsepower} onChange={e => set('horsepower', e.target.value)} />
                        <Input label="Torque (Nm)"      type="number" placeholder="e.g. 500" value={formData.torqueNm}   onChange={e => set('torqueNm', e.target.value)} />
                        <Input label="Top Speed (km/h)" type="number" placeholder="e.g. 200" value={formData.topSpeedKmh} onChange={e => set('topSpeedKmh', e.target.value)} />
                        <Input label="0–100 km/h (sec)" type="number" step="0.1" placeholder="e.g. 9.4" value={formData.zeroTo100} onChange={e => set('zeroTo100', e.target.value)} />
                      </div>

                      <div className="h-px bg-gray-100 my-1" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</p>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Mileage (km/l)"       type="number" step="0.1" placeholder="ICE only – e.g. 14.2" value={formData.mileage}    onChange={e => set('mileage', e.target.value)} />
                        <Input label="EV Range (km)"         type="number" placeholder="EV/Hybrid – e.g. 450"          value={formData.evRangeKm}  onChange={e => set('evRangeKm', e.target.value)} />
                        <Input label="Fuel Tank (litres)"    type="number" placeholder="e.g. 80"                       value={formData.fuelTankL}  onChange={e => set('fuelTankL', e.target.value)} />
                        <Input label="Battery (kWh)"         type="number" step="0.1" placeholder="EV only – e.g. 72.8" value={formData.batteryKwh} onChange={e => set('batteryKwh', e.target.value)} />
                        <Input label="Boot Space (litres)"   type="number" placeholder="e.g. 296"                      value={formData.bootSpaceL} onChange={e => set('bootSpaceL', e.target.value)} />
                      </div>

                      <div className="h-px bg-gray-100 my-1" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</p>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Current Odometer (km)" type="number" placeholder="e.g. 24500" value={formData.odometerKm} onChange={e => set('odometerKm', e.target.value)} />
                        <Input label="Last Serviced Date" type="date" value={formData.lastServicedAt} onChange={e => set('lastServicedAt', e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* ── FEATURES ── */}
                  {activeTab === 'features' && (
                    <>
                      <TagInput label="Safety Features"        tags={formData.safetyFeatures}        onChange={v => set('safetyFeatures', v)}        placeholder="e.g. ABS, 6 Airbags…" />
                      <TagInput label="Comfort Features"       tags={formData.comfortFeatures}       onChange={v => set('comfortFeatures', v)}       placeholder="e.g. Sunroof, Heated Seats…" />
                      <TagInput label="Entertainment Features" tags={formData.entertainmentFeatures} onChange={v => set('entertainmentFeatures', v)} placeholder="e.g. Apple CarPlay, JBL…" />
                      <TagInput label="General Features"       tags={formData.features}              onChange={v => set('features', v)}              placeholder="e.g. AC, GPS, USB…" />
                      <TagInput label="Highlights"             tags={formData.highlights}            onChange={v => set('highlights', v)}            placeholder="e.g. Best-in-class boot space…" />
                    </>
                  )}

                  {/* ── MEDIA & NOTES ── */}
                  {activeTab === 'media' && (
                    <>
                      <Input label="Image URL" type="url" placeholder="https://… (Cloudinary, imgbb, or any direct image link)"
                        value={formData.imageUrl} onChange={e => set('imageUrl', e.target.value)} />

                      {formData.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-gray-200 h-48 flex items-center justify-center bg-gray-50">
                          <img src={formData.imageUrl} alt="Preview"
                            className="max-h-full max-w-full object-contain"
                            onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                      )}

                      <Field label="Description">
                        <textarea rows={5} placeholder="Describe the vehicle — condition, comfort, ideal trips…"
                          className={inputCls + ' resize-none'}
                          value={formData.description} onChange={e => set('description', e.target.value)} />
                      </Field>
                    </>
                  )}
                </div>

                {/* Error */}
                {formError && (
                  <div className="mx-8 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">
                    {formError}
                  </div>
                )}

                {/* Modal footer — nav + submit */}
                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center gap-3">
                  <button type="button" onClick={() => setActiveTab(TABS[tabIndex - 1]?.id)}
                    disabled={isFirstTab}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black text-gray-500 hover:bg-gray-100 disabled:opacity-0 transition-all">
                    <ChevronLeft size={16} /> Back
                  </button>

                  <div className="flex gap-1.5">
                    {TABS.map(({ id }, i) => (
                      <div key={id} onClick={() => setActiveTab(id)} className={`h-1.5 rounded-full cursor-pointer transition-all
                        ${activeTab === id ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`} />
                    ))}
                  </div>

                  {isLastTab ? (
                    <button type="submit" disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-blue-200">
                      {isSubmitting ? <><RefreshCw size={15} className="animate-spin" /> Adding…</> : <><Plus size={15} /> Add Vehicle</>}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setActiveTab(TABS[tabIndex + 1]?.id)}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all">
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Small pill badge
const Pill = ({ icon, text, color = 'gray' }) => (
  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase
    ${color === 'green' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
    {icon} {text}
  </span>
);

export default VehicleManagement;