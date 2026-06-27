import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle, XCircle, Car, User, Calendar,
  AlertTriangle, RefreshCw, X, Loader2, Wallet, Wrench
} from 'lucide-react'
import { returnService } from '../services/returnService'

const STATUS_META = {
  pending:  { label: 'Pending Review', color: '#f59e0b', bg: '#fef3c7' },
  approved: { label: 'Approved',       color: '#22c55e', bg: '#dcfce7' },
  rejected: { label: 'Rejected',       color: '#ef4444', bg: '#fee2e2' },
}

const ReturnManagement = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selected, setSelected] = useState(null)

  // Review form state
  const [damageCost, setDamageCost] = useState('')
  const [fineOverride, setFineOverride] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchReturns = async (status = filterStatus) => {
    try {
      setLoading(true)
      const res = await returnService.getAllReturns(status === 'all' ? undefined : status)
      setReturns(res.data || [])
    } catch (err) {
      console.error('Failed to fetch returns:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReturns(filterStatus) }, [filterStatus])

  const openReview = (r) => {
    setSelected(r)
    setDamageCost(r.damageCost || '')
    setFineOverride(r.lateFineAmount || '')
    setAdminNotes('')
  }

  const closeReview = () => {
    setSelected(null)
    setDamageCost('')
    setFineOverride('')
    setAdminNotes('')
  }

  const handleApprove = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      // Save damage cost first if it was edited
      if (Number(damageCost) !== (selected.damageCost || 0)) {
        await returnService.linkDamage(selected._id, { damageCost: Number(damageCost) || 0 })
      }
      await returnService.approveReturn(selected._id, {
        adminFineOverride: fineOverride !== '' ? Number(fineOverride) : null,
        adminNotes
      })
      closeReview()
      fetchReturns()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve return')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    if (!confirm('Reject this return request? The user will need to submit a new one.')) return
    setProcessing(true)
    try {
      await returnService.rejectReturn(selected._id, adminNotes)
      closeReview()
      fetchReturns()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject return')
    } finally {
      setProcessing(false)
    }
  }

  // Live preview of settlement math while admin edits the form
  const previewTotalFine = Math.max(0, (Number(fineOverride) || 0) + (Number(damageCost) || 0))
  const previewDeposit = selected?.depositAmount || 0
  const previewDeducted = Math.min(previewDeposit, previewTotalFine)
  const previewRefund = Math.max(0, previewDeposit - previewTotalFine)
  const previewOutstanding = Math.max(0, previewTotalFine - previewDeposit)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Returns</h1>
            <p className="text-sm text-gray-400 mt-0.5">Review late fees, damage costs, and settle deposits</p>
          </div>
          <div className="flex items-center gap-2">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all
                  ${filterStatus === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}>
                {s}
              </button>
            ))}
            <button onClick={() => fetchReturns()} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <Car size={48} className="mb-3 opacity-30" />
            <p className="text-base font-semibold text-gray-500">No return requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {returns.map(r => {
              const meta = STATUS_META[r.status]
              return (
                <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => r.status === 'pending' && openReview(r)}
                  className={`bg-white rounded-2xl border border-gray-100 p-5 transition-all ${r.status === 'pending' ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''}`}>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <Car size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{r.car?.name || r.car?.brand || 'Vehicle'}</p>
                        <p className="text-xs text-gray-400">{r.car?.model}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <User size={12} /> {r.user?.name || 'Unknown'}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar size={12} />
                    Due {new Date(r.scheduledEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {r.lateDays > 0 && <span className="text-red-500 font-semibold ml-1">· {r.lateDays}d late</span>}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="text-xs text-gray-400">
                      Deposit: <span className="font-semibold text-gray-700">₹{(r.depositAmount || 0).toLocaleString()}</span>
                    </div>
                    {r.status === 'pending' ? (
                      <div className="text-xs font-bold text-amber-600">
                        Est. fine: ₹{(r.lateFineAmount || 0).toLocaleString()}
                      </div>
                    ) : r.status === 'approved' ? (
                      <div className="text-xs font-bold text-gray-700">
                        Total: ₹{(r.totalFine || 0).toLocaleString()}
                        {r.outstandingFine > 0 && <span className="text-red-500 ml-1">(₹{r.outstandingFine} owed)</span>}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900">Review Return Request</h2>
                  <p className="text-xs text-gray-400">{selected.car?.name} · {selected.user?.name}</p>
                </div>
                <button onClick={closeReview} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Lateness summary */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-1">
                    <Clock size={14} /> Lateness
                  </div>
                  <p className="text-xs text-amber-600">
                    Scheduled return: {new Date(selected.scheduledEndDate).toLocaleString('en-IN')}<br />
                    Requested: {new Date(selected.requestedReturnAt).toLocaleString('en-IN')}<br />
                    <span className="font-bold">{selected.lateDays} day(s) late</span>
                  </p>
                  {selected.userNotes && (
                    <p className="text-xs text-amber-700 mt-2 italic">"{selected.userNotes}"</p>
                  )}
                </div>

                {/* Fine override */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Late Fine Amount (₹)</label>
                  <input type="number" min="0" value={fineOverride} onChange={e => setFineOverride(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  <p className="text-[11px] text-gray-400 mt-1">System-calculated: ₹{selected.lateFineAmount}. Edit to override.</p>
                </div>

                {/* Damage cost */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Wrench size={12} /> Damage Cost (₹) — if any
                  </label>
                  <input type="number" min="0" value={damageCost} onChange={e => setDamageCost(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>

                {/* Settlement preview */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-1">
                    <Wallet size={14} /> Settlement Preview
                  </div>
                  <Row label="Total fine + damage" value={previewTotalFine} />
                  <Row label="Deposit available" value={previewDeposit} />
                  <Row label="Deducted from deposit" value={previewDeducted} />
                  {previewRefund > 0 && <Row label="Refunded to wallet" value={previewRefund} positive />}
                  {previewOutstanding > 0 && <Row label="Outstanding (user owes)" value={previewOutstanding} negative />}
                </div>

                {/* Admin notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Admin Notes</label>
                  <textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Optional notes visible internally"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={handleReject} disabled={processing}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <XCircle size={15} /> Reject
                </button>
                <button onClick={handleApprove} disabled={processing}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {processing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approve & Settle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Row = ({ label, value, positive, negative }) => (
  <div className="flex justify-between text-xs">
    <span className="text-blue-600">{label}</span>
    <span className={`font-bold ${positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-blue-800'}`}>
      ₹{value.toLocaleString()}
    </span>
  </div>
)

export default ReturnManagement