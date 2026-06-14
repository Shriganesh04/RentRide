import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import RollsRoyce from '../../assets/rolls royce.png'
import Mercedes  from '../../assets/mercedes.png'
import Bugatti   from '../../assets/Bugatti.png'
import luxury    from '../../assets/luxury.png'
import bluecar   from '../../assets/bluecar.png'
import blackcar  from '../../assets/blackcar.png'

const cars = [
  { id: 1, name: 'Rolls-Royce Phantom',      category: 'Luxury',  price: '₹15,000',  img: RollsRoyce },
  { id: 2, name: 'Mercedes-Benz S-Class',     category: 'Sedan',   price: '₹8,000',   img: Mercedes  },
  { id: 3, name: 'Ferrari 488 GTB',           category: 'Sports',  price: '₹35,000',  img: Bugatti   },
  { id: 4, name: 'Bentley Continental GT',    category: 'Luxury',  price: '₹18,000',  img: luxury    },
  { id: 5, name: 'Lamborghini Huracán EVO',   category: 'Sports',  price: '₹40,000',  img: bluecar   },
  { id: 6, name: 'Porsche 911 Turbo S',       category: 'Sports',  price: '₹25,000',  img: blackcar  },
]

const Inventory = () => {
  const { isDarkMode } = useTheme()

  return (
    <section
      id="inventory"
      className="py-24 px-6 lg:px-12"
      style={{ background: isDarkMode ? '#0f172a' : '#f9fafb' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Section header — left-aligned, not centred */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-green-500 text-sm font-semibold tracking-widest uppercase mb-3">Our fleet</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
              Exceptional vehicles,<br />every category.
            </h2>
          </div>
          <Link to="/browsecars"
            className="inline-flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all flex-shrink-0">
            View full fleet <ArrowRight size={17} />
          </Link>
        </div>

        {/* Grid — 3 col, clean cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car, i) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
              style={{
                background: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e5e7eb',
              }}
            >
              {/* Image area */}
              <div className="h-48 flex items-center justify-center px-6 pt-6"
                style={{ background: isDarkMode ? '#0f172a' : '#f3f4f6' }}>
                <img src={car.img} alt={car.name}
                  className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-md" />
              </div>

              {/* Info */}
              <div className="p-5">
                <span className="text-[11px] font-semibold text-green-600 uppercase tracking-widest">{car.category}</span>
                <h3 className="font-semibold text-base mt-1 mb-3"
                  style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>{car.name}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-green-500">{car.price}</span>
                    <span className="text-xs text-gray-400 ml-1">/day</span>
                  </div>
                  <Link to="/browsecars"
                    className="text-xs font-semibold px-4 py-2 rounded-lg border border-green-400 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all">
                    Rent
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Inventory
