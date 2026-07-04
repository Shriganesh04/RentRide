import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import {
  Search, Loader2, Users, Fuel, Gauge, AlertCircle,
  SlidersHorizontal, X, Star, Zap, MapPin, Activity,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { carService } from '../services/carService';
import DashboardNavbar from '../components/layout/DashboardNavbar';

// Local asset fallbacks
import heroCarImg   from '../assets/herocar.png';
import porscheImg   from '../assets/porsche.png';
import mercedesImg  from '../assets/mercedesg63amg.png';
import kiaImg       from '../assets/Kia.png';
import skodaImg     from '../assets/skoda.png';
import audiImg      from '../assets/AudiElectric.png';
import supraImg     from '../assets/supra.png';
import lamboImg     from '../assets/lambo.png';
import bugattiImg   from '../assets/Bugatti.png';
import rollsImg     from '../assets/rolls royce.png';
import nanoImg      from '../assets/Nano.png';
import HondaImg     from '../assets/Honda.png';

const LOCAL_MAP = {
  nano: nanoImg, tata: nanoImg, porsche: porscheImg, '911': porscheImg,
  mercedes: mercedesImg, g63: mercedesImg, amg: mercedesImg,
  kia: kiaImg, carens: kiaImg,
  skoda: skodaImg, kylaq: skodaImg,
  audi: audiImg, 'e-tron': audiImg,
  supra: supraImg, toyota: supraImg,
  honda: HondaImg,
  lambo: lamboImg, lamborghini: lamboImg,
  bugatti: bugattiImg,
  rolls: rollsImg,
};

const getImageForCar = (car) => {
  if (!car) return heroCarImg;
  // Real URL from DB
  if (car.images?.[0]?.startsWith('http')) return car.images[0];
  // Match against stored image key or brand/model
  const checks = [
    car.images?.[0], car.brand, car.model, car.name
  ].map(s => (s || '').toLowerCase());
  for (const check of checks) {
    for (const [key, src] of Object.entries(LOCAL_MAP)) {
      if (check.includes(key)) return src;
    }
  }
  return heroCarImg;
};

const PRICE_RANGES = [
  { label: 'All Prices',       value: 'All' },
  { label: 'Under ₹1,000',     value: '0-1000' },
  { label: '₹1,000 – ₹3,000', value: '1000-3000' },
  { label: '₹3,000 – ₹5,000', value: '3000-5000' },
  { label: '₹5,000 – ₹10,000',value: '5000-10000' },
  { label: 'Above ₹10,000',   value: '10000-999999' },
];

// ── Main component ─────────────────────────────────────────────────────────────
const BrowseCars = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (location.state?.unavailableMessage) {
      toast.error(location.state.unavailableMessage, { duration: 5000 });
      window.history.replaceState({}, document.title);
    }
  }, []);

  const [allCars, setAllCars]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search,       setSearch]       = useState('');
  const [brand,        setBrand]        = useState('All');
  const [category,     setCategory]     = useState('All');
  const [transmission, setTransmission] = useState('All');
  const [fuelType,     setFuelType]     = useState('All');
  const [priceRange,   setPriceRange]   = useState('All');
  const [seatsMin,     setSeatsMin]     = useState('All');
  const [sortBy,       setSortBy]       = useState('default');

  // Dynamic filter options from data
  const [brands,        setBrands]        = useState(['All']);
  const [categories,    setCategories]    = useState(['All']);
  const [transmissions, setTransmissions] = useState(['All']);
  const [fuelTypes,     setFuelTypes]     = useState(['All']);

  const theme = {
    bg:          isDarkMode ? '#0f172a' : '#f8f9fa',
    cardBg:      isDarkMode ? '#1e293b' : '#ffffff',
    text:        isDarkMode ? '#f1f5f9' : '#1F2937',
    textSecondary: isDarkMode ? '#94a3b8' : '#6B7280',
    border:      isDarkMode ? '#334155' : '#e5e7eb',
    inputBg:     isDarkMode ? '#0f172a' : '#f3f4f6',
  };

  useEffect(() => { loadCars(); }, []);

  const loadCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await carService.getAllCars();
      if (res.success && Array.isArray(res.data)) {
        setAllCars(res.data);
        setBrands(['All',        ...new Set(res.data.map(c => c.brand).filter(Boolean))]);
        setCategories(['All',    ...new Set(res.data.map(c => c.category).filter(Boolean))]);
        setTransmissions(['All', ...new Set(res.data.map(c => c.transmission).filter(Boolean))]);
        setFuelTypes(['All',     ...new Set(res.data.map(c => c.fuelType).filter(Boolean))]);
      } else {
        setError('Failed to load cars');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = useMemo(() => {
    let result = [...allCars];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        [c.name, c.brand, c.model, c.category, c.description]
          .some(s => (s || '').toLowerCase().includes(q))
      );
    }
    if (brand        !== 'All') result = result.filter(c => c.brand        === brand);
    if (category     !== 'All') result = result.filter(c => c.category     === category);
    if (transmission !== 'All') result = result.filter(c => c.transmission === transmission);
    if (fuelType     !== 'All') result = result.filter(c => c.fuelType     === fuelType);
    if (seatsMin     !== 'All') result = result.filter(c => c.seats >= Number(seatsMin));

    if (priceRange !== 'All') {
      const [min, max] = priceRange.split('-').map(Number);
      result = result.filter(c => c.pricePerDay >= min && c.pricePerDay <= max);
    }

    if (sortBy === 'price_asc')  result.sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sortBy === 'price_desc') result.sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sortBy === 'rating')     result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'newest')     result.sort((a, b) => (b.year || 0) - (a.year || 0));

    return result;
  }, [allCars, search, brand, category, transmission, fuelType, priceRange, seatsMin, sortBy]);

  const clearAll = () => {
    setSearch(''); setBrand('All'); setCategory('All');
    setTransmission('All'); setFuelType('All');
    setPriceRange('All'); setSeatsMin('All'); setSortBy('default');
  };

  const activeCount = [brand, category, transmission, fuelType, priceRange, seatsMin]
    .filter(f => f !== 'All').length;

  const handleBook = (car) => navigate('/booking-confirmation', { state: { car } });

  const selectCls = `w-full px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-green-400/30`;
  const selectStyle = { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text };

  return (
    <>
      <DashboardNavbar />
      <div className="min-h-screen pt-20 transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-green-500 mb-1">Browse Cars</h1>
            <p className="text-base" style={{ color: theme.textSecondary }}>
              {loading ? 'Loading fleet…' : `${filteredCars.length} of ${allCars.length} vehicles`}
            </p>
          </div>

          {/* Search + filter bar */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
                  style={{ color: theme.text }} />
                <input type="text" placeholder="Search brand, model, category…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400/30"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }} />
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className={selectCls + ' w-auto min-w-[160px]'} style={selectStyle}>
                <option value="default">Sort: Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest Year</option>
              </select>

              {/* Filter toggle */}
              <button onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-md relative text-sm">
                <SlidersHorizontal size={16} />
                Filters
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {activeCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>

              {activeCount > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-red-400 text-red-500 font-bold rounded-xl hover:bg-red-50 transition text-sm">
                  <X size={15} /> Clear
                </button>
              )}
            </div>

            {/* Expandable filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                  <div className="p-5 rounded-2xl border shadow-sm"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                          style={{ color: theme.textSecondary }}>Brand</label>
                        <select value={brand} onChange={e => setBrand(e.target.value)} className={selectCls} style={selectStyle}>
                          {brands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                          style={{ color: theme.textSecondary }}>Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls} style={selectStyle}>
                          {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                          style={{ color: theme.textSecondary }}>Transmission</label>
                        <select value={transmission} onChange={e => setTransmission(e.target.value)} className={selectCls} style={selectStyle}>
                          {transmissions.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                          style={{ color: theme.textSecondary }}>Fuel Type</label>
                        <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={selectCls} style={selectStyle}>
                          {fuelTypes.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                          style={{ color: theme.textSecondary }}>Min Seats</label>
                        <select value={seatsMin} onChange={e => setSeatsMin(e.target.value)} className={selectCls} style={selectStyle}>
                          {['All','2','4','5','6','7'].map(s => <option key={s} value={s}>{s === 'All' ? 'Any' : `${s}+`}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                          style={{ color: theme.textSecondary }}>Price / Day</label>
                        <select value={priceRange} onChange={e => setPriceRange(e.target.value)} className={selectCls} style={selectStyle}>
                          {PRICE_RANGES.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter chips */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {brand        !== 'All' && <FilterChip label={`Brand: ${brand}`}          onRemove={() => setBrand('All')} />}
                {category     !== 'All' && <FilterChip label={`Type: ${category}`}         onRemove={() => setCategory('All')} />}
                {transmission !== 'All' && <FilterChip label={`Gearbox: ${transmission.toUpperCase()}`} onRemove={() => setTransmission('All')} />}
                {fuelType     !== 'All' && <FilterChip label={`Fuel: ${fuelType}`}         onRemove={() => setFuelType('All')} />}
                {seatsMin     !== 'All' && <FilterChip label={`${seatsMin}+ seats`}        onRemove={() => setSeatsMin('All')} />}
                {priceRange   !== 'All' && <FilterChip label={PRICE_RANGES.find(p => p.value === priceRange)?.label} onRemove={() => setPriceRange('All')} />}
              </div>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-24 space-y-3">
              <p className="text-lg font-bold text-red-500">{error}</p>
              <button onClick={loadCars}
                className="px-6 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">
                Retry
              </button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <p className="text-xl font-bold" style={{ color: theme.text }}>No cars match your filters</p>
              <button onClick={clearAll}
                className="px-6 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredCars.map((car, i) => (
                <CarCard key={car._id || i} car={car} index={i} theme={theme}
                  onBook={() => handleBook(car)}
                  onDetails={() => navigate(`/car/${car._id}`)} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

// ── Filter chip ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-200">
    {label}
    <button onClick={onRemove} className="hover:text-red-500 transition-colors"><X size={12} /></button>
  </span>
);

// ── Car card ──────────────────────────────────────────────────────────────────
const CarCard = ({ car, index, theme, onBook, onDetails }) => {
  const imageSrc = getImageForCar(car);

  // Pick the most interesting efficiency stat
  const effStat = car.evRangeKm
    ? { label: 'Range', value: `${car.evRangeKm} km` }
    : car.mileage
    ? { label: 'Mileage', value: `${car.mileage} kmpl` }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.3 }}
      whileHover={{ y: -6 }}
      className="group h-full"
    >
      <div className="relative h-full rounded-2xl border-2 flex flex-col overflow-hidden transition-all duration-300
        group-hover:border-green-500 group-hover:shadow-xl group-hover:shadow-green-500/20"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>

        {/* Corner accents on hover */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-br-2xl" />

        {/* Availability badge */}
        {!car.available && (
          <div className="absolute top-3 right-3 z-10 bg-red-100 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
            <AlertCircle size={11} /> Unavailable
          </div>
        )}

        {/* Image area */}
        <div className="relative flex justify-center items-center pt-6 pb-2 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 scale-50 group-hover:scale-100" />
          <motion.img
            src={imageSrc} alt={car.name}
            className="w-56 h-36 object-contain relative z-10 drop-shadow-lg"
            whileHover={{ scale: 1.08, rotate: 1 }}
            transition={{ duration: 0.35 }}
            onError={e => { e.target.src = heroCarImg; }}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-5 pb-5 pt-1 space-y-3">

          {/* Identity */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                {car.brand} · {car.year}
              </span>
              {car.rating > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: theme.textSecondary }}>
                  <Star size={11} className="text-yellow-400 fill-yellow-400" /> {car.rating.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="font-black text-lg leading-tight" style={{ color: theme.text }}>
              {car.name} <span className="font-normal text-sm" style={{ color: theme.textSecondary }}>{car.model}</span>
            </h3>
          </div>

          {/* Highlights (first 2) */}
          {car.highlights?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {car.highlights.slice(0, 2).map((h, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold border border-green-100">
                  <Star size={8} className="fill-green-500 text-green-500" /> {h}
                </span>
              ))}
            </div>
          )}

          {/* Spec pills */}
          <div className="flex flex-wrap gap-1.5">
            <SpecPill icon={<Users size={10}/>}    text={`${car.seats} seats`}        theme={theme} />
            <SpecPill icon={<Fuel size={10}/>}     text={car.fuelType}                 theme={theme} />
            <SpecPill icon={<Gauge size={10}/>}    text={car.transmission?.toUpperCase()} theme={theme} />
            {car.horsepower && <SpecPill icon={<Zap size={10}/>}    text={`${car.horsepower} bhp`} theme={theme} />}
            {effStat        && <SpecPill icon={<Activity size={10}/>} text={effStat.value}         theme={theme} />}
          </div>

          {/* Description */}
          {car.description && (
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: theme.textSecondary }}>
              {car.description}
            </p>
          )}

          {/* Location */}
          {car.location && (
            <p className="text-[10px] font-bold flex items-center gap-1" style={{ color: theme.textSecondary }}>
              <MapPin size={10} className="text-green-500" /> {car.location}
            </p>
          )}

          {/* Price + CTA */}
          <div className="flex items-end justify-between pt-2 border-t mt-auto"
            style={{ borderColor: theme.border }}>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-green-500">
                  ₹{car.pricePerDay?.toLocaleString()}
                </span>
                <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>/day</span>
              </div>
              {car.pricePerHour > 0 && (
                <p className="text-[10px] font-bold text-blue-500">₹{car.pricePerHour?.toLocaleString()}/hr</p>
              )}
              {car.depositAmount > 0 && (
                <p className="text-[10px] font-bold text-orange-500">+₹{car.depositAmount?.toLocaleString()} deposit</p>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={onDetails}
                className="px-3 py-2 text-xs font-bold border border-green-500 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                Details
              </button>
              <button onClick={car.available ? onBook : undefined} disabled={!car.available}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-md
                  ${car.available
                    ? 'bg-green-500 hover:bg-green-600 text-white hover:shadow-green-500/40'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {car.available ? 'Rent Now' : 'Booked'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SpecPill = ({ icon, text, theme }) => (
  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border capitalize"
    style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textSecondary }}>
    {icon} {text}
  </span>
);

export default BrowseCars;