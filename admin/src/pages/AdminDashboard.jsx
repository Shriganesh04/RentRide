import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { statsService } from '../services/statsService'
import { paymentEventService } from '../services/paymentService'
import {
  Bell, RefreshCw, Calendar, TrendingUp, TrendingDown,
  PlusCircle, Tag, AlertTriangle, Coins, CarFront, ArrowUpRight, Clock
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [notifications, setNotifications] = useState(0)

  const formatGrowth = (value) => {
    if (value === undefined || value === null) return '—'
    return `${value > 0 ? '+' : ''}${value}%`
  }

  const growthTrend = (value) => {
    if (!value) return 'neutral'
    return value > 0 ? 'up' : 'down'
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const statsRes = await statsService.getDashboardStats()
      const d = statsRes.data
      setStats([
        {
          title: 'Total Revenue',
          value: `₹${(d.totalRevenue || 0).toLocaleString()}`,
          sub: 'selected period',
          change: formatGrowth(d.revenueGrowth),
          trend: growthTrend(d.revenueGrowth),
          icon: Coins,
          accent: '#22c55e',
        },
        {
          title: 'Active Bookings',
          value: d.activeBookings || 0,
          sub: 'currently active',
          change: formatGrowth(d.bookingsGrowth),
          trend: growthTrend(d.bookingsGrowth),
          icon: Calendar,
          accent: '#3b82f6',
        },
        {
          title: 'Fleet Utilization',
          value: `${d.fleetUtilization || 0}%`,
          sub: 'of total fleet currently rented',
          change: '—',
          trend: 'neutral',
          icon: CarFront,
          accent: '#f59e0b',
        },
        {
          title: 'Pending Claims',
          value: d.pendingRequests || 0,
          sub: 'damage reports',
          change: (d.pendingRequests || 0) > 0 ? 'Review needed' : 'All clear',
          trend: (d.pendingRequests || 0) > 0 ? 'down' : 'neutral',
          icon: AlertTriangle,
          accent: '#ef4444',
        },
      ])

      const activityRes = await statsService.getRecentActivity(5)
      setRecentActivity(activityRes.data.bookings || [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
      // Honest failure state — no fabricated numbers. A dashboard that
      // silently shows fake KPIs on error is more dangerous than one that
      // says it couldn't load.
      setError('Unable to load live dashboard stats. Showing may be stale — try refreshing.')
      setStats([
        { title: 'Total Revenue',    value: '—', sub: 'selected period',    change: '—', trend: 'neutral', icon: Coins,         accent: '#22c55e' },
        { title: 'Active Bookings',  value: '—', sub: 'currently active',   change: '—', trend: 'neutral', icon: Calendar,      accent: '#3b82f6' },
        { title: 'Fleet Utilization',value: '—', sub: 'of total fleet',     change: '—', trend: 'neutral', icon: CarFront,      accent: '#f59e0b' },
        { title: 'Pending Claims',   value: '—', sub: 'damage reports',     change: '—', trend: 'neutral', icon: AlertTriangle, accent: '#ef4444' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const unsub = paymentEventService.subscribe(event => {
      if (['PAYMENT_RECEIVED', 'SETTLEMENT_UPDATE', 'BOOKING_UPDATE'].includes(event.type)) {
        fetchData()
        setNotifications(n => n + 1)
      }
    })
    return unsub
  }, [])

  const quickActions = [
    { icon: PlusCircle, title: 'Add Vehicle',   desc: 'Register to fleet',   path: '/admin/vehicles' },
    { icon: Tag,        title: 'Create Promo',  desc: 'New campaign',         path: '/admin/promotions' },
    { icon: AlertTriangle, title: 'Damage Review', desc: 'Review claims',    path: '/admin/damage' },
    { icon: RefreshCw,  title: 'Settlements',   desc: 'View payouts',         path: '/admin/payments' },
  ]

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">
              <RefreshCw size={16} />
            </button>
            <div className="relative">
              <button onClick={() => setNotifications(0)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">
                <Bell size={16} />
              </button>
              {notifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl px-5 py-3">
            <AlertTriangle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: stat.accent + '18' }}>
                    <Icon size={18} style={{ color: stat.accent }} />
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1
                    ${stat.trend === 'up'    ? 'bg-green-50 text-green-600' :
                      stat.trend === 'down'  ? 'bg-red-50 text-red-500'    :
                                              'bg-gray-100 text-gray-500'}`}>
                    {stat.trend === 'up'   && <TrendingUp size={11} />}
                    {stat.trend === 'down' && <TrendingDown size={11} />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">{stat.title}</p>
                <p className="text-[11px] text-gray-300 mt-0.5">{stat.sub}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(({ icon: Icon, title, desc, path }, i) => (
              <button key={i} onClick={() => navigate(path)}
                className="group bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-blue-200 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors mb-3">
                  <Icon size={18} />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent bookings table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
            <button onClick={() => navigate('/admin/bookings')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Vehicle', 'Customer', 'Date', 'Status', 'Amount'].map(h => (
                    <th key={h} className={`px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Clock size={28} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-300 font-medium">No recent bookings</p>
                    </td>
                  </tr>
                ) : recentActivity.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <CarFront size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{b.car?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{b.car?.model || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold flex-shrink-0">
                          {b.user?.name?.[0] || 'U'}
                        </div>
                        <span className="text-sm text-gray-700">{b.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold
                        ${b.status === 'confirmed' || b.status === 'active' ? 'bg-green-50 text-green-600' :
                          b.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                          'bg-orange-50 text-orange-500'}`}>
                        {b.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      {b.totalPrice ? `₹${b.totalPrice.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard