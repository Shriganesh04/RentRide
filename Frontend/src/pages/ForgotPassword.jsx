import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, CheckCircle, Loader, ArrowLeft, Mail } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const { isDarkMode } = useTheme();

  const theme = {
    bg:            isDarkMode ? '#0f172a' : '#FFFFFF',
    cardBg:        isDarkMode ? '#1e293b' : '#FFFFFF',
    text:          isDarkMode ? '#f1f5f9' : '#1F2937',
    textSecondary: isDarkMode ? '#cbd5e1' : '#6B7280',
    border:        isDarkMode ? '#334155' : '#E5E7EB',
    inputBg:       isDarkMode ? '#1e293b' : '#F8F9FA',
    primary:       '#10b981',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      // Always show success — the backend never reveals whether the email exists
      setSent(true);
    } catch (err) {
      // Only show an error for genuine server failures (500), not 404-style
      // "user not found" responses (the backend always returns 200 for those)
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      <div
        className="max-w-md w-full rounded-2xl shadow-2xl p-8 transition-all duration-300"
        style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
            Forgot Password?
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Success state */}
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>
              Check your inbox
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent. It expires in 30 minutes.
            </p>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="font-semibold hover:underline"
                style={{ color: theme.primary }}
              >
                try again
              </button>.
            </p>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border flex items-center gap-3" style={{
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
                borderColor: '#EF4444'
              }}>
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-green-500 outline-none"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary }}
              >
                {loading
                  ? <><Loader className="w-5 h-5 animate-spin" /> Sending…</>
                  : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        {/* Back to sign in */}
        <div className="mt-8 text-center">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: theme.textSecondary }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}