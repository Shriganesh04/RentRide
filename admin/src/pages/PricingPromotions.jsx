import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import {
  Tag,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Bell,
  Calendar,
  Percent,
  DollarSign,
  TrendingUp,
  Check,
  X,
  Loader
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const PricingPromotions = () => {
  return (
    <>
      <Header />
      <ContentArea />
    </>
  )
}

const Header = () => {
  return (
    <header className="flex h-20 items-center justify-between px-8 py-4 bg-white border-b border-border-light z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 text-xs font-black tracking-widest uppercase text-text-secondary/60">
          <span className="hover:text-primary cursor-pointer transition-colors">Workspace</span>
          <ChevronRight size={12} />
          <span className="text-text-primary">Offers & Promotions</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary size-4" />
          <input
            className="h-11 w-72 rounded-2xl border border-border-light bg-background-secondary/50 px-10 text-sm font-bold text-text-primary placeholder:text-text-secondary/40 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
            placeholder="Search promo codes..."
            type="text"
          />
        </div>
        <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border-light bg-white text-text-secondary hover:bg-background-secondary hover:text-primary transition-all shadow-sm">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary border-2 border-white"></span>
        </button>
      </div>
    </header>
  )
}

const ContentArea = () => {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterActive, setFilterActive] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingPromoId, setEditingPromoId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minBookingAmount: '',
    maxDiscount: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    active: true
  })
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalUsage: 0,
    totalSavings: 0
  })

  // Fetch promotions from backend
  useEffect(() => {
    fetchPromotions()
  }, [filterActive, page])

  const fetchPromotions = async () => {
    try {
      setLoading(true)

      const params = {
        page,
        limit: 10
      }

      if (filterActive === 'active') {
        params.active = 'true'
      }

      const response = await axios.get(`${API_URL}/admin/promotions`, {
        headers: getAuthHeader(),
        params
      })

      if (response.data.success) {
        setPromotions(response.data.data || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalCount(response.data.total || 0)

        // Calculate stats
        const totalUsage = response.data.data?.reduce((sum, promo) => sum + (promo.usedCount || 0), 0) || 0
        const activeCount = response.data.data?.filter(p => {
          const now = new Date()
          return p.active && new Date(p.validFrom) <= now && new Date(p.validTo) >= now
        }).length || 0

        setStats({
          totalPromotions: response.data.total || 0,
          activePromotions: activeCount,
          totalUsage: totalUsage,
          totalSavings: 0 // Calculate from bookings if needed
        })
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
      alert('Failed to fetch promotions. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minBookingAmount: '',
      maxDiscount: '',
      validFrom: '',
      validTo: '',
      usageLimit: '',
      active: true
    })
    setFormError('')
  }

  const handleFormChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingPromoId(null)
    resetForm()
  }

  const toDateInputValue = (isoString) => {
    if (!isoString) return ''
    return new Date(isoString).toISOString().slice(0, 10)
  }

  const openEditModal = (promo) => {
    setEditingPromoId(promo._id)
    setFormData({
      code: promo.code || '',
      name: promo.name || '',
      description: promo.description || '',
      type: promo.type || 'percentage',
      value: promo.value ?? '',
      minBookingAmount: promo.minBookingAmount ?? '',
      maxDiscount: promo.maxDiscount ?? '',
      validFrom: toDateInputValue(promo.validFrom),
      validTo: toDateInputValue(promo.validTo),
      usageLimit: promo.usageLimit ?? '',
      active: promo.active ?? true
    })
    setFormError('')
    setShowCreateModal(true)
  }

  const handleDeletePromotion = async (promo) => {
    if (!confirm(`Delete promo "${promo.code}"? This cannot be undone.`)) return
    try {
      setDeletingId(promo._id)
      const response = await axios.delete(`${API_URL}/admin/promotions/${promo._id}`, {
        headers: getAuthHeader()
      })
      if (response.data.success) {
        fetchPromotions()
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      alert(error.response?.data?.message || 'Failed to delete promotion.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreatePromotion = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.code || !formData.name || !formData.description || !formData.value ||
        !formData.validFrom || !formData.validTo || !formData.usageLimit) {
      setFormError('Please fill in all required fields.')
      return
    }

    if (new Date(formData.validTo) <= new Date(formData.validFrom)) {
      setFormError('Valid To date must be after Valid From date.')
      return
    }

    try {
      setCreating(true)

      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        value: Number(formData.value),
        minBookingAmount: formData.minBookingAmount ? Number(formData.minBookingAmount) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
        usageLimit: Number(formData.usageLimit),
        active: formData.active
      }

      const response = editingPromoId
        ? await axios.put(`${API_URL}/admin/promotions/${editingPromoId}`, payload, {
            headers: getAuthHeader()
          })
        : await axios.post(`${API_URL}/admin/promotions`, payload, {
            headers: getAuthHeader()
          })

      if (response.data.success) {
        handleCloseModal()
        if (!editingPromoId) setPage(1)
        fetchPromotions()
      }
    } catch (error) {
      console.error('Error saving promotion:', error)
      setFormError(error.response?.data?.message || `Failed to ${editingPromoId ? 'update' : 'create'} promotion. Please try again.`)
    } finally {
      setCreating(false)
    }
  }

  const statsData = [
    {
      label: 'Total Codes',
      value: stats.totalPromotions.toString(),
      icon: Tag,
      color: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    {
      label: 'Active Codes',
      value: stats.activePromotions.toString(),
      trend: '+8%',
      icon: Check,
      color: 'bg-green-50 text-green-600 border-green-100'
    },
    {
      label: 'Total Usage',
      value: stats.totalUsage.toString(),
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      label: 'Total Savings',
      value: `₹${stats.totalSavings.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-orange-50 text-orange-600 border-orange-100'
    },
  ]

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const getStatusBadge = (promo) => {
    const now = new Date()
    const validFrom = new Date(promo.validFrom)
    const validUntil = new Date(promo.validTo)

    if (!promo.active) {
      return { text: 'Inactive', color: 'bg-gray-50 text-gray-600 border-gray-200' }
    }

    if (now < validFrom) {
      return { text: 'Scheduled', color: 'bg-blue-50 text-blue-600 border-blue-200' }
    }

    if (now > validUntil) {
      return { text: 'Expired', color: 'bg-red-50 text-red-600 border-red-200' }
    }

    return { text: 'Active', color: 'bg-green-50 text-green-600 border-green-200' }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDiscountDisplay = (promo) => {
    if (promo.type === 'percentage') {
      return `${promo.value}% OFF`
    }
    return `₹${promo.value} OFF`
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
      <div className="max-w-[1600px] mx-auto space-y-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <h2 className="text-4xl font-black text-text-primary tracking-tight uppercase">
              Offers <span className="text-primary italic">& Promotions</span>
            </h2>
            <p className="text-text-secondary text-lg mt-1 font-medium">
              Manage discount codes and promotional campaigns.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover uppercase tracking-widest"
          >
            <Plus size={20} />
            <span>Create Promo</span>
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-7 border border-border-light shadow-xl shadow-black/5 group hover:border-primary/40 transition-all cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                    {stat.label}
                  </p>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} border flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-text-primary tracking-tight">
                    {stat.value}
                  </span>
                  {stat.trend && (
                    <span className="text-green-600 text-[10px] font-black bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      {stat.trend} <TrendingUp size={10} />
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Promotions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[32px] border border-border-light shadow-2xl shadow-black/5 overflow-hidden flex flex-col"
        >
          {/* Filters */}
          <div className="flex flex-col gap-6 p-8 border-b border-border-light lg:flex-row lg:items-center lg:justify-between bg-background-secondary/20">
            <div className="flex gap-2">
              {['all', 'active', 'expired'].map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setFilterActive(f)
                    setPage(1)
                  }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${filterActive === f
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white border-border-light text-text-secondary hover:bg-background-secondary hover:text-text-primary'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-border-light text-xs font-black text-text-secondary hover:text-primary hover:border-primary/30 transition-all uppercase tracking-widest">
              <Filter size={16} /> Sort by Usage
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light bg-background-secondary/10">
                  <th className="px-8 py-5">Promo Code</th>
                  <th className="px-8 py-5">Name</th>
                  <th className="px-8 py-5">Discount</th>
                  <th className="px-8 py-5">Valid Period</th>
                  <th className="px-8 py-5">Usage</th>
                  <th className="px-8 py-5">Min Amount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader className="animate-spin h-8 w-8 text-primary" />
                        <span className="text-text-secondary font-bold">Loading promotions...</span>
                      </div>
                    </td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-12 text-center text-text-secondary font-bold">
                      No promotions found
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => {
                    const status = getStatusBadge(promo)
                    return (
                      <motion.tr
                        key={promo._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-background-secondary/40 transition-colors cursor-default"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Tag size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-black text-text-primary text-sm uppercase">
                                {promo.code}
                              </p>
                              <p className="text-[10px] text-text-secondary font-bold opacity-60">
                                Code
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-text-primary text-sm">
                            {promo.name || 'N/A'}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <Percent size={14} className="text-primary" />
                            <span className="text-lg font-black text-primary">
                              {getDiscountDisplay(promo)}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                              <Calendar size={12} className="text-green-600" />
                              {formatDate(promo.validFrom)}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                              <Calendar size={12} className="text-red-600" />
                              {formatDate(promo.validTo)}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="text-lg font-black text-text-primary">
                              {promo.usedCount || 0}
                            </p>
                            <p className="text-[10px] text-text-secondary font-bold opacity-60">
                              {promo.usageLimit ? `/ ${promo.usageLimit} max` : 'Unlimited'}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-text-primary">
                            ₹{promo.minBookingAmount || 0}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${status.color}`}>
                            {status.text === 'Active' ? <Check size={14} /> : <X size={14} />}
                            {status.text}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(promo)}
                              className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-all border border-border-light">
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePromotion(promo)}
                              disabled={deletingId === promo._id}
                              className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all border border-border-light disabled:opacity-50">
                              {deletingId === promo._id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-8 border-t border-border-light bg-background-secondary/10">
            <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.1em] opacity-60 mb-4 sm:mb-0">
              Showing {promotions.length} of {totalCount} promotions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl border border-border-light flex items-center justify-center text-text-secondary hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>

              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const pageNum = page > 2 ? page - 1 + i : i + 1
                if (pageNum > totalPages) return null

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${page === pageNum
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border border-border-light text-text-secondary hover:bg-white'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl border border-border-light flex items-center justify-center text-text-secondary hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Create Promotion Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white shadow-2xl"
            >
              <form onSubmit={handleCreatePromotion}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-8 border-b border-border-light">
                  <div>
                    <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">
                      {editingPromoId ? <>Edit <span className="text-primary italic">Promo</span></> : <>Create <span className="text-primary italic">Promo</span></>}
                    </h3>
                    <p className="text-text-secondary text-sm font-medium mt-1">
                      {editingPromoId ? 'Update the details of this discount code.' : 'Set up a new discount code for customers.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-5">
                  {formError && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold px-5 py-3">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Promo Code *
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleFormChange('code', e.target.value)}
                        placeholder="SUMMER25"
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold uppercase focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="Summer Sale"
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Get 25% off on all bookings this summer"
                      rows={2}
                      className="w-full rounded-xl border border-border-light px-4 py-3 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Discount Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleFormChange('type', e.target.value)}
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Value *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.value}
                        onChange={(e) => handleFormChange('value', e.target.value)}
                        placeholder={formData.type === 'percentage' ? '25' : '500'}
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Min Booking Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minBookingAmount}
                        onChange={(e) => handleFormChange('minBookingAmount', e.target.value)}
                        placeholder="0"
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Max Discount Cap
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxDiscount}
                        onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                        placeholder="No cap"
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Valid From *
                      </label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => handleFormChange('validFrom', e.target.value)}
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Valid To *
                      </label>
                      <input
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => handleFormChange('validTo', e.target.value)}
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 items-end">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        Usage Limit *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usageLimit}
                        onChange={(e) => handleFormChange('usageLimit', e.target.value)}
                        placeholder="100"
                        className="w-full h-12 rounded-xl border border-border-light px-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                    <label className="flex items-center gap-3 h-12 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleFormChange('active', e.target.checked)}
                        className="w-5 h-5 rounded-md border-border-light text-primary focus:ring-primary/20"
                      />
                      <span className="text-xs font-black uppercase tracking-widest text-text-secondary">
                        Active immediately
                      </span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-8 border-t border-border-light bg-background-secondary/20 rounded-b-[32px]">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-background-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating && <Loader className="animate-spin" size={14} />}
                    {creating ? 'Saving...' : editingPromoId ? 'Save Changes' : 'Create Promo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PricingPromotions