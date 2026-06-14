import { Link } from 'react-router-dom'
import { Search, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import herocar from '../../assets/herocar1.png'

export default function Hero() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-white dark:bg-gray-950">
      {/* Single subtle background gradient — not multiple blobs */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-green-600 font-semibold text-sm tracking-widest uppercase"
            >
              AI-powered car rentals
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white"
            >
              Find your
              <br />
              <span className="text-green-500">perfect ride.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-md"
            >
              Premium cars at honest prices. Smart recommendations, instant booking, and secure payments — all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to="/browsecars"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-green-500/25 active:scale-95"
              >
                Browse Fleet <ArrowRight size={17} />
              </Link>
              <Link
                to="/offers"
                className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-400 hover:text-green-600 px-7 py-3.5 rounded-xl font-semibold transition-all"
              >
                View Offers
              </Link>
            </motion.div>

            {/* Minimal trust stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-8 pt-2 border-t border-gray-100 dark:border-gray-800"
            >
              {[
                { label: 'Vehicles', value: '200+' },
                { label: 'Cities', value: '12' },
                { label: 'Happy renters', value: '8k+' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — car image, no gimmicks */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative flex items-center justify-center"
          >
            {/* Single clean shadow under the car */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-green-500/15 blur-2xl rounded-full" />
            <motion.img
              src={herocar}
              alt="Premium rental car"
              className="relative w-full max-w-xl drop-shadow-xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>

        {/* Search card — shown when logged in */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm max-w-3xl"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick search</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
                  <MapPin size={13} /> Location
                </label>
                <input type="text" placeholder="Enter city"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/40 transition" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
                  <Calendar size={13} /> Pick-up
                </label>
                <input type="date"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/40 transition" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
                  <Calendar size={13} /> Return
                </label>
                <input type="date"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400/40 transition" />
              </div>
            </div>
            <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
              <Search size={17} /> Search Available Cars
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
