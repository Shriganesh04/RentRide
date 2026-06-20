import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fuel, Gauge, Users, Calendar, MapPin, CheckCircle2,
  ArrowLeft, Star, Zap, Shield, Music, Wind, Activity,
  Info, ChevronLeft, ChevronRight, Layers, Clock, Wrench
} from 'lucide-react';
import DashboardNavbar from '../components/layout/DashboardNavbar';
import { carService } from '../services/carService';
import { useTheme } from '../context/ThemeContext';

// Local asset fallbacks
import PorscheImg   from '../assets/porsche.png';
import LamboImg     from '../assets/lambo.png';
import BugattiImg   from '../assets/Bugatti.png';
import MercedesImg  from '../assets/mercedes.png';
import G63Img       from '../assets/mercedesg63amg.png';
import KiaImg       from '../assets/Kia.png';
import SkodaImg     from '../assets/skoda.png';
import SupraImg     from '../assets/supra.png';
import RollsImg     from '../assets/rolls royce.png';
import AudiImg      from '../assets/AudiElectric.png';
import HeroCarImg   from '../assets/herocar.png';
import MustangImg   from '../assets/blackcar.png';
import NanoImg      from '../assets/Nano.png';
import HondaImg     from '../assets/Honda.png';

const LOCAL_ASSETS = {
  porsche: PorscheImg, lamborghini: LamboImg, bugatti: BugattiImg,
  mercedes: MercedesImg, 'mercedes-benz': MercedesImg, g63: G63Img,
  kia: KiaImg, skoda: SkodaImg, toyota: SupraImg, supra: SupraImg,
  ford: MustangImg, 'rolls-royce': RollsImg, audi: AudiImg,
  tata: NanoImg, nano: NanoImg, honda: HondaImg,
};

const getCarImages = (car) => {
  // Real uploaded images first
  const real = (car.images || []).filter(img => img?.startsWith('http'));
  if (real.length > 0) return real;

  // Fallback to local asset
  const checks = [
    car.model?.toLowerCase(), car.name?.toLowerCase(), car.brand?.toLowerCase()
  ];
  for (const check of checks) {
    if (!check) continue;
    for (const [key, src] of Object.entries(LOCAL_ASSETS)) {
      if (check.includes(key)) return [src];
    }
  }
  return [HeroCarImg];
};

// ── Small reusable components ─────────────────────────────────────────────────
const SpecCard = ({ icon, label, value, theme }) => (
  <div className="p-4 rounded-2xl border flex items-start gap-3 hover:border-green-300 transition-colors"
    style={{ backgroundColor: theme.card, borderColor: theme.border }}>
    <div className="p-2.5 bg-green-50 rounded-xl text-green-600 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider mb-0.5"
        style={{ color: theme.textSecondary }}>{label}</p>
      <p className="font-bold capitalize" style={{ color: theme.text }}>{value}</p>
    </div>
  </div>
);

const StatPill = ({ label, value, unit, theme }) => (
  <div className="flex flex-col items-center justify-center px-5 py-4 rounded-2xl border text-center"
    style={{ backgroundColor: theme.card, borderColor: theme.border }}>
    <span className="text-xl font-black" style={{ color: theme.text }}>{value}</span>
    {unit && <span className="text-[10px] font-bold text-green-600 uppercase">{unit}</span>}
    <span className="text-[10px] font-bold uppercase tracking-wider mt-1"
      style={{ color: theme.textSecondary }}>{label}</span>
  </div>
);

const FeatureChip = ({ text, theme }) => (
  <div className="flex items-center gap-2 text-sm font-medium"
    style={{ color: theme.textSecondary }}>
    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
    {text}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');

  const themeCtx = useTheme();
  const theme = themeCtx?.theme ?? {
    background: '#f9fafb', card: '#ffffff', text: '#111827',
    textSecondary: '#6b7280', border: '#e5e7eb', hover: '#f3f4f6'
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await carService.getCarById(id);
        if (res.success) setCar(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: theme.background }}>
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!car) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: theme.background }}>
      <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Car not found</h2>
      <button onClick={() => navigate('/browsecars')} className="text-green-600 underline font-medium">
        Browse Fleet
      </button>
    </div>
  );

  const images     = getCarImages(car);
  const prevImg    = () => setImgIndex(i => (i - 1 + images.length) % images.length);
  const nextImg    = () => setImgIndex(i => (i + 1) % images.length);

  const hasPerformance = car.horsepower || car.torqueNm || car.topSpeedKmh || car.zeroTo100 || car.engineType;
  const hasEfficiency  = car.mileage || car.evRangeKm || car.fuelTankL || car.batteryKwh;

  const handleBookNow = () => navigate('/booking-confirmation', { state: { car } });

  const SECTIONS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'performance',  label: 'Performance', hide: !hasPerformance && !hasEfficiency },
    { id: 'features',     label: 'Features',    hide: !car.safetyFeatures?.length && !car.comfortFeatures?.length && !car.entertainmentFeatures?.length && !car.features?.length },
  ].filter(s => !s.hide);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.background, color: theme.text }}>
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <button onClick={() => navigate('/browsecars')}
          className="flex items-center gap-2 mb-6 font-medium hover:text-green-600 transition-colors"
          style={{ color: theme.textSecondary }}>
          <ArrowLeft size={18} /> Back to Fleet
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── LEFT: Image gallery ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

            {/* Main image */}
            <div className="relative rounded-[2rem] border overflow-hidden flex items-center justify-center min-h-[360px] group"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={imgIndex}
                  src={images[imgIndex]}
                  alt={car.name}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="max-h-[320px] max-w-[90%] object-contain drop-shadow-2xl z-10"
                  onError={e => { e.target.src = HeroCarImg; }}
                />
              </AnimatePresence>

              {/* Gallery nav — only if multiple images */}
              {images.length > 1 && (
                <>
                  <button onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition z-20">
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <button onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition z-20">
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-5 bg-green-500' : 'w-1.5 bg-gray-300'}`} />
                    ))}
                  </div>
                </>
              )}

              {/* Availability badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full
                  ${car.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {car.available ? '✓ Available' : 'Not Available'}
                </span>
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all
                      ${i === imgIndex ? 'border-green-500' : 'border-transparent opacity-60 hover:opacity-90'}`}>
                    <img src={src} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.src = HeroCarImg; }} />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="flex gap-3 flex-wrap">
              {['Verified', 'Insured', 'Sanitized'].map(badge => (
                <span key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold"
                  style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.textSecondary }}>
                  <CheckCircle2 size={13} className="text-green-500" /> {badge}
                </span>
              ))}
              {car.lastServicedAt && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold"
                  style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.textSecondary }}>
                  <Wrench size={13} className="text-blue-500" />
                  Serviced {new Date(car.lastServicedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT: Details panel ────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">

            {/* Identity */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black uppercase tracking-widest">
                  {car.brand}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest"
                  style={{ backgroundColor: theme.hover, color: theme.textSecondary }}>
                  {car.year}
                </span>
                {car.color && (
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest"
                    style={{ backgroundColor: theme.hover, color: theme.textSecondary }}>
                    {car.color}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black leading-tight" style={{ color: theme.text }}>
                {car.name}
              </h1>
              <p className="text-xl font-medium mt-1" style={{ color: theme.textSecondary }}>
                {car.model}
              </p>

              <div className="flex flex-wrap items-center gap-5 mt-3 pt-4 border-t text-sm font-medium"
                style={{ borderColor: theme.border, color: theme.textSecondary }}>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-green-500" /> {car.location || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  {car.rating > 0 ? `${car.rating.toFixed(1)} (${car.totalReviews} reviews)` : 'New listing'}
                </span>
                {car.odometerKm && (
                  <span className="flex items-center gap-1.5">
                    <Activity size={16} className="text-blue-400" />
                    {car.odometerKm.toLocaleString()} km
                  </span>
                )}
              </div>
            </div>

            {/* Highlights */}
            {car.highlights?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {car.highlights.map((h, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100">
                    <Star size={10} className="fill-green-500 text-green-500" /> {h}
                  </span>
                ))}
              </div>
            )}

            {/* Section tabs */}
            {SECTIONS.length > 1 && (
              <div className="flex gap-1 mb-5 p-1 rounded-xl border"
                style={{ backgroundColor: theme.hover, borderColor: theme.border }}>
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all
                      ${activeSection === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── OVERVIEW ── */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Core specs 2×2 */}
                <div className="grid grid-cols-2 gap-3">
                  <SpecCard icon={<Gauge size={18}/>}    label="Transmission" value={car.transmission}        theme={theme} />
                  <SpecCard icon={<Fuel size={18}/>}     label="Fuel Type"    value={car.fuelType}             theme={theme} />
                  <SpecCard icon={<Users size={18}/>}    label="Seats"        value={`${car.seats} persons`}   theme={theme} />
                  <SpecCard icon={<Layers size={18}/>}   label="Category"     value={car.category}             theme={theme} />
                  {car.doors   && <SpecCard icon={<Info size={18}/>}     label="Doors"       value={`${car.doors} doors`}         theme={theme} />}
                  {car.bootSpaceL && <SpecCard icon={<Wind size={18}/>}  label="Boot Space"  value={`${car.bootSpaceL} L`}        theme={theme} />}
                </div>

                {/* Description */}
                {car.description && (
                  <div>
                    <h3 className="font-bold text-base mb-2" style={{ color: theme.text }}>About this vehicle</h3>
                    <p className="leading-relaxed text-sm" style={{ color: theme.textSecondary }}>{car.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PERFORMANCE ── */}
            {activeSection === 'performance' && (
              <div className="space-y-5">
                {/* Engine */}
                {(car.engineType || car.engineCC) && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Engine</p>
                    <p className="font-bold text-base" style={{ color: theme.text }}>
                      {[car.engineType, car.engineCC && `${car.engineCC} cc`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}

                {/* Performance stats grid */}
                {(car.horsepower || car.torqueNm || car.topSpeedKmh || car.zeroTo100) && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Performance</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {car.horsepower  && <StatPill label="Power"     value={car.horsepower}        unit="bhp"   theme={theme} />}
                      {car.torqueNm    && <StatPill label="Torque"    value={car.torqueNm}          unit="Nm"    theme={theme} />}
                      {car.topSpeedKmh && <StatPill label="Top Speed" value={car.topSpeedKmh}       unit="km/h"  theme={theme} />}
                      {car.zeroTo100   && <StatPill label="0–100"     value={`${car.zeroTo100}s`}   unit="sec"   theme={theme} />}
                    </div>
                  </div>
                )}

                {/* Efficiency */}
                {hasEfficiency && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Efficiency</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {car.mileage    && <StatPill label="Mileage"   value={car.mileage}    unit="km/l"  theme={theme} />}
                      {car.evRangeKm  && <StatPill label="EV Range"  value={car.evRangeKm}  unit="km"    theme={theme} />}
                      {car.fuelTankL  && <StatPill label="Tank"      value={car.fuelTankL}  unit="litres" theme={theme} />}
                      {car.batteryKwh && <StatPill label="Battery"   value={car.batteryKwh} unit="kWh"   theme={theme} />}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FEATURES ── */}
            {activeSection === 'features' && (
              <div className="space-y-5">
                {[
                  { label: 'Safety',        icon: <Shield size={14}/>,   items: car.safetyFeatures },
                  { label: 'Comfort',       icon: <Wind size={14}/>,     items: car.comfortFeatures },
                  { label: 'Entertainment', icon: <Music size={14}/>,    items: car.entertainmentFeatures },
                  { label: 'General',       icon: <Info size={14}/>,     items: car.features },
                ].filter(g => g.items?.length > 0).map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-green-600">{group.icon}</span>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.label}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      {group.items.map((f, i) => <FeatureChip key={i} text={f} theme={theme} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Price footer ── */}
            <div className="mt-auto pt-6">
              <div className="bg-gray-900 rounded-[1.5rem] p-5 text-white flex items-center justify-between gap-4 shadow-xl shadow-gray-900/20">
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">Rental Price</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">₹{car.pricePerDay?.toLocaleString()}</span>
                    <span className="text-gray-500 font-medium text-sm">/day</span>
                  </div>
                  {car.pricePerHour > 0 && (
                    <p className="text-green-400 text-xs font-bold mt-0.5">₹{car.pricePerHour?.toLocaleString()}/hr also available</p>
                  )}
                  {car.depositAmount > 0 && (
                    <p className="text-orange-400 text-xs font-bold mt-0.5 flex items-center gap-1">
                      <Clock size={11}/> ₹{car.depositAmount?.toLocaleString()} refundable deposit
                    </p>
                  )}
                </div>
                <button onClick={handleBookNow}
                  className="flex-shrink-0 bg-green-500 hover:bg-green-400 text-gray-900 px-7 py-3.5 rounded-xl font-black text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Book Now <Calendar size={18} />
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CarDetails;
