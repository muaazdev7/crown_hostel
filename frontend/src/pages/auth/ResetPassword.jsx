import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Building2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResetPassword() {
  const { token }   = useParams();
  const navigate    = useNavigate();

  const [form, setForm]             = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPass] = useState(false);
  const [showConfirm, setShowConf]  = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  /* Auto-dismiss API error after 5 s */
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  /* Redirect to login 3 s after success */
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.password)                      errs.password        = 'Password is required.';
    else if (form.password.length < 6)       errs.password        = 'Minimum 6 characters.';
    if (!form.confirmPassword)               errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
                                             errs.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: form.password, confirmPassword: form.confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: '' });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 p-6">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group"
            aria-label="Go to home"
          >
            <div className="w-10 h-10 bg-primary-600 group-hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors duration-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-200">
              Crown Hostel
            </span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8">

          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-dark-900 mb-1">Set new password</h2>
              <p className="text-dark-500 text-sm mb-8">
                Choose a strong password for your account.
              </p>

              {/* API error banner */}
              {error && (
                <div className="flex items-start gap-3 mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* New password */}
                <div>
                  <label className="input-label">New password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={set('password')}
                      disabled={loading}
                      className={`input pl-10 pr-10 w-full ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      autoComplete="new-password"
                      style={{ paddingLeft: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="input-label">Confirm password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      disabled={loading}
                      className={`input pl-10 pr-10 w-full ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                      autoComplete="new-password"
                      style={{ paddingLeft: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConf(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Resetting…' : 'Reset password'}
                </Button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-9 h-9 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-2">Password updated!</h2>
              <p className="text-dark-500 text-sm">
                Your password has been reset successfully.
              </p>
              <p className="mt-1 text-xs text-dark-400">
                Redirecting you to sign in…
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-dark-100">
            <Link
              to="/login"
              className="text-sm text-dark-500 hover:text-primary-600 font-medium transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
