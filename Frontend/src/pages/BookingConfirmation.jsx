import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar, Clock, MapPin, Car, ArrowRight, CheckCircle,
  Loader, ArrowLeft
} from 'lucide-react';

// Asset map
import heroCarImg  from '../assets/herocar.png';
import porscheImg  from '../assets/porsche.png';
import mercedesImg from '../assets/mercedesg63amg.png';
import kiaImg      from '../assets/Kia.png';
import skodaImg    from '../assets/skoda.png';
import audiImg     from '../assets/AudiElectric.png';
import supraImg    from '../assets/supra.png';
import lamboImg    from '../assets/lambo.png';
import bugattiImg  from '../assets/Bugatti.png';
import rollsImg    from '../assets/rolls royce.png';
import nanoImg     from '../assets/Nano.png';
import HondaImg    from '../assets/Honda.png';

const ASSET_MAP = {
  nano: nanoImg, tata: nanoImg, porsche: porscheImg, '911': porscheImg,
  mercedes: mercedesImg, g63: mercedesImg, amg: mercedesImg,
  kia: kiaImg, skoda: skodaImg, audi: audiImg,
  supra: supraImg, toyota: supraImg, honda: HondaImg,
  lambo: lamboImg, lamborghini: lamboImg, bugatti: bugattiImg, rolls: rollsImg,
};

const getCarImage = (car) => {
  if (!car) return heroCarImg;
  if (car.images?.[0]?.startsWith('http')) return car.images[0];
  const checks = [car.images?.[0], car.brand, car.model, car.name].map(s => (s || '').toLowerCase());
  for (const check of checks)
    for (const [key, src] of Object.entries(ASSET_MAP))
      if (check.includes(key)) return src;
  return heroCarImg;
};

// ── Date/time helpers ────────────────────────────────────────────
const today          = () => new Date().toISOString().slice(0, 10);
const nowTimeRounded  = () => {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0); // round up to nearest 30 min
  return d.toTimeString().slice(0, 5);
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => {
  const msPerDay = 86400000;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / msPerDay));
};
// Hours between two date+time combos, rounded up, minimum 1
const hoursBetween = (dateA, timeA, dateB, timeB) => {
  const start = new Date(`${dateA}T${timeA}:00`);
  const end   = new Date(`${dateB}T${timeB}:00`);
  const diffMs = end - start;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
};
const addHoursToTime = (dateStr, timeStr, hrs) => {
  const d = new Date(`${dateStr}T${timeStr}:00`);
  d.setHours(d.getHours() + hrs);
  return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) };
};

const TAX_RATE = 0.12;
const MIN_DEPOSIT = 500;

const BookingConfirmation = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isDarkMode } = useTheme();

  const { car } = location.state || {};

  if (!car) {
    navigate('/browsecars');
    return null;
  }

  const hourlyAvailable = car.pricePerHour > 0;

  // ── Rental mode ───────────────────────────────────────────────
  const [mode, setMode] = useState('daily'); // 'daily' | 'hourly'

  // ── Daily mode state ─────────────────────────────────────────
  const [startDate, setStartDate] = useState(today());
  const [endDate,   setEndDate]   = useState(addDays(today(), 1));

  // ── Hourly mode state ────────────────────────────────────────
  const [hStartDate, setHStartDate] = useState(today());
  const [hStartTime, setHStartTime] = useState(nowTimeRounded());
  const [hEndDate,   setHEndDate]   = useState(today());
  const [hEndTime,   setHEndTime]   = useState(() => {
    const r = addHoursToTime(today(), nowTimeRounded(), 4); // default 4-hour rental
    return r.time;
  });

  const [pickup,    setPickup]    = useState(car.location || '');
  const [dropoff,   setDropoff]   = useState(car.location || '');
  const [loading,   setLoading]   = useState(false);
  const [dateError, setDateError] = useState('');

  // ── Derived calculations ─────────────────────────────────────
  const days  = daysBetween(startDate, endDate);
  const hours = hoursBetween(hStartDate, hStartTime, hEndDate, hEndTime);

  const baseFare = mode === 'hourly'
    ? car.pricePerHour * hours
    : car.pricePerDay * days;

  const tax         = Math.round(baseFare * TAX_RATE);
  const deposit      = car.depositAmount > 0 ? car.depositAmount : MIN_DEPOSIT;
  const totalAmount  = baseFare + tax + deposit;

  // Resolve final start/end ISO timestamps depending on mode (used for booking + display)
  const finalStartISO = mode === 'hourly'
    ? new Date(`${hStartDate}T${hStartTime}:00`).toISOString()
    : new Date(`${startDate}T00:00:00`).toISOString();
  const finalEndISO = mode === 'hourly'
    ? new Date(`${hEndDate}T${hEndTime}:00`).toISOString()
    : new Date(`${endDate}T00:00:00`).toISOString();

  // ── Handlers — daily mode ────────────────────────────────────
  const handleStartDateChange = (val) => {
    setDateError('');
    setStartDate(val);
    if (val >= endDate) setEndDate(addDays(val, 1));
  };
  const handleEndDateChange = (val) => {
    if (val <= startDate) {
      setDateError('Return date must be after pick-up date.');
      return;
    }
    setDateError('');
    setEndDate(val);
  };

  // ── Handlers — hourly mode ───────────────────────────────────
  const handleHStartChange = (date, time) => {
    setDateError('');
    if (date !== undefined) setHStartDate(date);
    if (time !== undefined) setHStartTime(time);

    const newDate = date ?? hStartDate;
    const newTime = time ?? hStartTime;
    const startTs = new Date(`${newDate}T${newTime}:00`);
    const endTs   = new Date(`${hEndDate}T${hEndTime}:00`);

    // Push end time forward by 1hr if it's now before/equal to start
    if (endTs <= startTs) {
      const r = addHoursToTime(newDate, newTime, 1);
      setHEndDate(r.date);
      setHEndTime(r.time);
    }
  };

  const handleHEndChange = (date, time) => {
    const newDate = date ?? hEndDate;
    const newTime = time ?? hEndTime;
    const startTs = new Date(`${hStartDate}T${hStartTime}:00`);
    const endTs   = new Date(`${newDate}T${newTime}:00`);

    if (endTs <= startTs) {
      setDateError('Return time must be after pick-up time.');
      if (date !== undefined) setHEndDate(date);
      if (time !== undefined) setHEndTime(time);
      return;
    }
    setDateError('');
    if (date !== undefined) setHEndDate(date);
    if (time !== undefined) setHEndTime(time);
  };

  const handleConfirm = () => {
    if (mode === 'daily' && endDate <= startDate) {
      setDateError('Return date must be after pick-up date.');
      return;
    }
    if (mode === 'hourly' && new Date(finalEndISO) <= new Date(finalStartISO)) {
      setDateError('Return time must be after pick-up time.');
      return;
    }
    setLoading(true);

    navigate('/payment', {
      state: {
        carId:           car._id,
        carName:         car.name || `${car.brand} ${car.model}`,
        carImage:        car.images?.[0],
        startDate:       finalStartISO,
        endDate:         finalEndISO,
        rentalMode:      mode,
        days:            mode === 'daily'  ? days  : null,
        hours:           mode === 'hourly' ? hours : null,
        pricePerDay:     car.pricePerDay,
        pricePerHour:    car.pricePerHour,
        baseFare,
        taxesFees:       tax,
        deposit,
        totalAmount,
        pickupLocation:  pickup,
        dropoffLocation: dropoff,
      }
    });
  };

  const theme = {
    bg:            isDarkMode ? '#0f172a' : '#f8f9fa',
    cardBg:        isDarkMode ? '#1e293b' : '#ffffff',
    text:          isDarkMode ? '#f1f5f9' : '#1F2937',
    textSecondary: isDarkMode ? '#cbd5e1' : '#6B7280',
    border:        isDarkMode ? '#334155' : '#e5e7eb',
    inputBg:       isDarkMode ? '#0f172a' : '#f8f9fa',
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400/30 transition`;
  const inputStyle = { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text };

  const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 font-medium hover:text-green-500 transition-colors text-sm"
          style={{ color: theme.textSecondary }}>
          <ArrowLeft size={18} /> Back
        </button>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: theme.text }}>
            Confirm Booking
          </h1>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Choose your rental period and review the price before paying.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Car card */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }}
              className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"
                style={{ color: theme.textSecondary }}>
                <Car size={15} className="text-green-500" /> Vehicle
              </h2>
              <div className="flex gap-4 items-center">
                <img src={getCarImage(car)} alt={car.name}
                  className="w-28 h-20 object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-1"
                  onError={e => { e.target.src = heroCarImg; }} />
                <div>
                  <h3 className="font-bold text-lg leading-tight" style={{ color: theme.text }}>
                    {car.name || `${car.brand} ${car.model}`}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
                    {car.brand} · {car.year}
                  </p>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>
                    {car.fuelType} · {car.transmission} · {car.seats} seats
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold">
                    <CheckCircle size={12} /> Available
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Rental period ──────────────────────────────── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
              className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                  Rental Period
                </h2>

                {/* Mode toggle — only shown if hourly rate exists */}
                {hourlyAvailable && (
                  <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: theme.inputBg }}>
                    <button onClick={() => { setMode('daily'); setDateError(''); }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'daily' ? 'bg-green-500 text-white shadow-sm' : ''}`}
                      style={mode !== 'daily' ? { color: theme.textSecondary } : {}}>
                      Daily
                    </button>
                    <button onClick={() => { setMode('hourly'); setDateError(''); }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'hourly' ? 'bg-green-500 text-white shadow-sm' : ''}`}
                      style={mode !== 'hourly' ? { color: theme.textSecondary } : {}}>
                      Hourly
                    </button>
                  </div>
                )}
              </div>

              {mode === 'daily' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.textSecondary }}>
                        Pick-up Date
                      </label>
                      <input type="date" value={startDate} min={today()}
                        onChange={e => handleStartDateChange(e.target.value)}
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.textSecondary }}>
                        Return Date
                      </label>
                      <input type="date" value={endDate} min={addDays(startDate, 1)}
                        onChange={e => handleEndDateChange(e.target.value)}
                        className={inputCls}
                        style={{ ...inputStyle, borderColor: dateError ? '#ef4444' : theme.border }} />
                    </div>
                  </div>

                  {dateError && <p className="text-xs text-red-500 font-medium mb-3">{dateError}</p>}

                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl w-fit">
                    <Clock size={15} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      {days} {days === 1 ? 'day' : 'days'} rental · ₹{car.pricePerDay.toLocaleString()}/day
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.textSecondary }}>
                        Pick-up Date & Time
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={hStartDate} min={today()}
                          onChange={e => handleHStartChange(e.target.value, undefined)}
                          className={inputCls} style={inputStyle} />
                        <input type="time" value={hStartTime}
                          onChange={e => handleHStartChange(undefined, e.target.value)}
                          className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.textSecondary }}>
                        Return Date & Time
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={hEndDate} min={hStartDate}
                          onChange={e => handleHEndChange(e.target.value, undefined)}
                          className={inputCls} style={{ ...inputStyle, borderColor: dateError ? '#ef4444' : theme.border }} />
                        <input type="time" value={hEndTime}
                          onChange={e => handleHEndChange(undefined, e.target.value)}
                          className={inputCls} style={{ ...inputStyle, borderColor: dateError ? '#ef4444' : theme.border }} />
                      </div>
                    </div>
                  </div>

                  {dateError && <p className="text-xs text-red-500 font-medium mb-3">{dateError}</p>}

                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl w-fit">
                    <Clock size={15} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      {hours} {hours === 1 ? 'hour' : 'hours'} rental · ₹{car.pricePerHour.toLocaleString()}/hr
                    </span>
                  </div>
                </>
              )}
            </motion.div>

            {/* ── Locations ────────────────────────────────────── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}
              className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                Locations
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: theme.textSecondary }}>
                    <MapPin size={12} className="text-green-500" /> Pick-up Location
                  </label>
                  <input type="text" value={pickup} onChange={e => setPickup(e.target.value)}
                    placeholder="Enter pick-up location" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: theme.textSecondary }}>
                    <MapPin size={12} className="text-green-500" /> Drop-off Location
                  </label>
                  <input type="text" value={dropoff} onChange={e => setDropoff(e.target.value)}
                    placeholder="Same as pick-up?" className={inputCls} style={inputStyle} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right: Price Summary ──────────────────────────── */}
          <div className="lg:col-span-1">
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
              className="rounded-2xl border p-5 shadow-sm sticky top-24" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>

              <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                Price Summary
              </h2>

              <div className="space-y-3 text-sm">
                {mode === 'hourly' ? (
                  <Row label={`₹${car.pricePerHour.toLocaleString()} × ${hours} ${hours === 1 ? 'hour' : 'hours'}`}
                    value={`₹${baseFare.toLocaleString()}`} theme={theme} />
                ) : (
                  <Row label={`₹${car.pricePerDay.toLocaleString()} × ${days} ${days === 1 ? 'day' : 'days'}`}
                    value={`₹${baseFare.toLocaleString()}`} theme={theme} />
                )}
                <Row label="Taxes & Fees (12%)" value={`₹${tax.toLocaleString()}`} theme={theme} />
                <Row label={<span>Security Deposit <span className="text-xs opacity-60">(Refundable)</span></span>}
                  value={`₹${deposit.toLocaleString()}`} theme={theme} />

                <div className="h-px" style={{ backgroundColor: theme.border }} />

                <div className="flex justify-between items-end pt-1">
                  <div>
                    <p className="font-semibold" style={{ color: theme.text }}>Total Amount</p>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>Incl. all taxes & deposit</p>
                  </div>
                  <p className="text-2xl font-bold text-green-500">₹{totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <button onClick={handleConfirm} disabled={loading || !!dateError}
                className="w-full mt-6 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-500/20">
                {loading
                  ? <><Loader size={18} className="animate-spin" /> Processing…</>
                  : <>Proceed to Payment <ArrowRight size={18} /></>}
              </button>

              <p className="text-xs text-center mt-3" style={{ color: theme.textSecondary, opacity: 0.7 }}>
                Coupon codes can be applied on the next page
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, theme }) => (
  <div className="flex justify-between items-center">
    <span style={{ color: theme.textSecondary }}>{label}</span>
    <span className="font-semibold" style={{ color: theme.text }}>{value}</span>
  </div>
);

export default BookingConfirmation;
