import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  AlertTriangle, CheckCircle, X, Loader, History, Banknote
} from 'lucide-react';
import { walletService } from '../services/walletService';
import { returnService } from '../services/returnService';
import DashboardNavbar from '../components/layout/DashboardNavbar';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const TYPE_META = {
  deposit_refund: { label: 'Deposit Refund', color: 'green', icon: ArrowDownCircle },
  fine_deduction: { label: 'Fine Deduction', color: 'red', icon: ArrowUpCircle },
  fine_payment: { label: 'Fine Payment', color: 'red', icon: ArrowUpCircle },
  withdrawal: { label: 'Withdrawal', color: 'gray', icon: ArrowLeftRight },
  adjustment: { label: 'Adjustment', color: 'blue', icon: ArrowLeftRight },
};

const MyWallet = () => {
  const { isDarkMode } = useTheme();

  const [balance, setBalance] = useState(0);
  const [bookingBlocked, setBookingBlocked] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [outstandingReturns, setOutstandingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8f9fa',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f1f5f9' : '#1F2937',
    textSecondary: isDarkMode ? '#cbd5e1' : '#6B7280',
    border: isDarkMode ? '#334155' : '#e5e7eb',
    inputBg: isDarkMode ? '#0f172a' : '#f8f9fa',
  };

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const [walletRes, returnsRes] = await Promise.all([
        walletService.getWallet(),
        returnService.getMyReturnRequests().catch(() => ({ data: [] }))
      ]);

      setBalance(walletRes.data.balance || 0);
      setBookingBlocked(walletRes.data.bookingBlocked || false);
      setTransactions(walletRes.data.transactions || []);

      const owed = (returnsRes.data || []).filter(r => r.outstandingFine > 0);
      setOutstandingReturns(owed);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (amt > balance) {
      setError('Amount exceeds your available balance.');
      return;
    }

    setActionLoading(true);
    try {
      await walletService.withdraw(amt);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSuccessMsg(`₹${amt.toLocaleString()} withdrawn successfully (demo).`);
      fetchWallet();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayFine = async (vehicleReturnId, amount) => {
    if (!confirm(`Pay ₹${amount.toLocaleString()} fine from your wallet balance?`)) return;
    setActionLoading(true);
    try {
      await walletService.payFineFromWallet(vehicleReturnId);
      setSuccessMsg('Fine paid successfully!');
      fetchWallet();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pay fine.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Loader className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor: theme.bg }}>
      <DashboardNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: theme.text }}>
            My Balance
          </h1>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Deposit refunds, fines, and withdrawal history
          </p>
        </motion.div>

        {/* Success toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-semibold">
              <CheckCircle size={16} /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking blocked warning */}
        {bookingBlocked && (
          <motion.div variants={fadeUp} initial="hidden" animate="show"
            className="mb-5 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-red-700 text-sm">New bookings are currently blocked</p>
              <p className="text-red-600 text-xs mt-0.5">
                You have an unpaid fine. Pay it below to resume booking. You can still browse cars and view your booking history.
              </p>
            </div>
          </motion.div>
        )}

        {/* Outstanding fines */}
        {outstandingReturns.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6 space-y-3">
            {outstandingReturns.map(r => (
              <div key={r._id} className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-red-700 text-sm">
                    Outstanding fine — {r.car?.name || r.car?.brand || 'Vehicle'}
                  </p>
                  <p className="text-red-600 text-xs mt-0.5">
                    {r.lateDays > 0 ? `${r.lateDays} day(s) late · ` : ''}Deposit didn't fully cover the fine
                  </p>
                </div>
                <button
                  onClick={() => handlePayFine(r._id, r.outstandingFine)}
                  disabled={actionLoading || balance < r.outstandingFine}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  Pay ₹{r.outstandingFine.toLocaleString()}
                </button>
              </div>
            ))}
            {balance < Math.max(...outstandingReturns.map(r => r.outstandingFine)) && (
              <p className="text-xs text-red-500 font-medium pl-1">
                Your wallet balance is too low to cover this fine. Top up isn't available in this demo — contact support.
              </p>
            )}
          </motion.div>
        )}

        {/* Balance card */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">Available Balance</p>
              <p className="text-4xl font-bold">₹{balance.toLocaleString()}</p>
            </div>
            <Wallet size={40} className="text-white/30" />
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance <= 0}
            className="mt-5 px-5 py-2.5 bg-white text-green-700 font-bold rounded-xl text-sm hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <Banknote size={16} /> Withdraw
          </button>
        </motion.div>

        {/* Transaction history */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-2xl border p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide" style={{ color: theme.textSecondary }}>
            <History size={15} className="text-green-500" /> Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: theme.textSecondary }}>
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const meta = TYPE_META[tx.type] || TYPE_META.adjustment;
                const Icon = meta.icon;
                const isCredit = tx.signedAmount >= 0;
                return (
                  <div key={tx._id} className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0" style={{ borderColor: theme.border }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${meta.color === 'green' ? 'bg-green-50 text-green-600' :
                          meta.color === 'red' ? 'bg-red-50 text-red-500' :
                          meta.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>{meta.label}</p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {tx.description ? ` · ${tx.description}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}₹{Math.abs(tx.signedAmount).toLocaleString()}
                      </p>
                      <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                        Bal: ₹{tx.balanceAfter.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Withdraw modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: theme.cardBg }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg" style={{ color: theme.text }}>Withdraw Funds</h3>
                <button onClick={() => { setShowWithdrawModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs mb-4 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                Demo feature — funds are deducted instantly but no real transfer occurs.
              </p>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.textSecondary }}>
                    Amount (Available: ₹{balance.toLocaleString()})
                  </label>
                  <input
                    type="number" min="1" max={balance}
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400/30"
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                <button type="submit" disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading ? <><Loader size={16} className="animate-spin" /> Processing…</> : 'Confirm Withdrawal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyWallet;