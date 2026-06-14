import React from 'react'
import { motion } from 'framer-motion'
import { Send, Phone, Mail, MapPin } from 'lucide-react'
import banner from '../../assets/banner.jpg'

const Banner = () => {
  return (
    <section id="contact" className="relative overflow-hidden">
      {/* Background image — dimmed */}
      <div className="absolute inset-0">
        <img src={banner} alt="" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gray-950" style={{ opacity: 0.9 }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left — contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-green-500 text-sm font-semibold tracking-widest uppercase mb-4">Contact us</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Let's get you
              <br />on the road.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
              Have a question about a booking, a specific vehicle, or pricing? Our team responds within the hour.
            </p>

            <div className="space-y-5">
              {[
                { icon: <Phone size={18} />, label: 'Call us', value: '+91 98765 43210' },
                { icon: <Mail size={18} />, label: 'Email', value: 'hello@rentride.in' },
                { icon: <MapPin size={18} />, label: 'Head office', value: 'Mumbai, Maharashtra' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{label}</p>
                    <p className="text-white font-semibold mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <form className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">First Name</label>
                  <input type="text" placeholder="Rahul"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Last Name</label>
                  <input type="text" placeholder="Sharma"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Email</label>
                <input type="email" placeholder="rahul@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Phone</label>
                <input type="tel" placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Message</label>
                <textarea rows={4} placeholder="Tell us about your trip or requirements…"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition resize-none" />
              </div>

              <button type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-green-500/25">
                <Send size={17} /> Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Banner
