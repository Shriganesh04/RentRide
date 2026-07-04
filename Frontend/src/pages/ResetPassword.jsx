import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const { resetToken } = useParams();
  const navigate       = useNavigate();

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [done,            setDone]            = useState(false);

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

  const strength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6)  return { label: 'Too short', color: '#ef4444', width: '25%' };
    if (password.length < 8)  return { label: 'Weak',      color: '#f59e0b', width: '50%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
                               return { label: 'Fair',      color: '#f59e0b', width: '65%' };
    return                            { label: 'Strong',    color: '#10b981', width: '100%' };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${resetToken}`, { password });
      setDone(true);
      // Auto-redirect to sign in after 3 seconds
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'This reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-green-500 outline-none pr-12';
  const inputStyle = { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text };

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
            <KeyRound className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
            Reset Password
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Choose a strong new password for your account.
          </p>
        </div>

        {/* Success state */}
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>
              Password reset!
            </h2>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Your password has been updated. Redirecting you to sign in…
            </p>
            <Link
              to="/signin"
              className="inline-block text-sm font-semibold hover:underline mt-2"
              style={{ color: theme.primary }}
            >
              Go to Sign In now
            </Link>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border flex items-start gap-3" style={{
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
                borderColor: '#EF4444'
              }}>
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* New password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: theme.textSecondary }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Strength bar */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      />
                    </div>
                    <p className="text-xs mt-1 font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderColor: confirmPassword && confirmPassword !== password ? '#ef4444' : theme.border
                    }}
                    placeholder="Repeat your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: theme.textSecondary }}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-xs text-green-500 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary }}
              >
                {loading
                  ? <><Loader className="w-5 h-5 animate-spin" /> Resetting…</>
                  : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Back link */}
        {!done && (
          <div className="mt-8 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: theme.textSecondary }}
            >
              <ArrowLeft size={16} /> Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}