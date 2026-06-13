import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]             = useState({ email: '', password: '' });
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [apiError, setApiError]     = useState('');

  /* ── validation ── */
  const validate = () => {
    const errs = {};
    if (!form.email)                          errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email  = 'Enter a valid email';
    if (!form.password)                        errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        'Login failed. Make sure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ────────────────────────────────────────────────
          LEFT PANEL — hostel image + branding
      ──────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col text-white relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/55" />

        {/* ── Logo — top left ── */}
        <div className="relative z-10 p-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group w-fit"
            aria-label="Go to Landing Page"
          >
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-all duration-200">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-wide group-hover:text-white/80 transition-colors duration-200">
              Crown Hostel
            </span>
          </button>
        </div>

        {/* ── Centered welcome message ── */}
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-10 pb-10">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-3">
            Welcome to<br />Crown Hostel
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Sign in or create an account to continue.
          </p>
        </div>

        {/* ── Back to Landing Page — absolute bottom-left ── */}
        <button
          onClick={() => navigate('/')}
          className="absolute bottom-8 left-10 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back to Landing Page
        </button>
      </div>

      {/* ────────────────────────────────────────────────
          RIGHT PANEL — sign-in form
      ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-dark-50">
        <div className="w-full max-w-md">

          {/* ── Mobile: top bar with logo only ── */}
          <div className="flex items-center mb-8 lg:hidden">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
              aria-label="Go to Landing Page"
            >
              <div className="w-9 h-9 bg-primary-600 group-hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors duration-200">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-200">
                Crown Hostel
              </span>
            </button>
          </div>

          {/* ── Sign-in card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 animate-fade-in">

            {/* Card header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-900 mb-1">Sign in</h2>
              <p className="text-dark-500 text-sm">
                Enter your credentials to access the portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pl-10">
              <Input
                label="Email address"
                type="email"
                icon={Mail}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                autoComplete="email"
                style={{ paddingLeft: "40px" }}
              />

              {/* Password field */}
              <div className="w-full">
                <label className="input-label">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    autoComplete="current-password"
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
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* API error */}
              {apiError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Sign in
              </Button>
            </form>

            {/* Create account */}
            <p className="mt-6 text-center text-sm text-dark-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Create account
              </Link>
            </p>

          </div>


        </div>
      </div>
    </div>
  );
}
