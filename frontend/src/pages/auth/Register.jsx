import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone, Building2, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', confirmPassword: '',
    role: 'student', // fixed — this page only registers students
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [verifySent, setVerifySent] = useState(false); // student check-email screen

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.phone && !/^\d{10}$/.test(form.phone)) errs.phone = 'Enter a 10-digit phone number';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword, ...payload } = form;
      const result = await register(payload);
      // Students must verify their email — show the check-inbox screen
      if (result?.requiresVerification) {
        setVerifySent(true);
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        'Registration failed. Make sure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ── Student "check your email" confirmation screen ──
  if (verifySent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                <MailCheck className="w-9 h-9 text-primary-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-dark-900 mb-2">Check your email</h2>
            <p className="text-dark-500 text-sm">
              We've sent a verification link to <span className="font-medium text-dark-700">{form.email}</span>.
              Click it to activate your account, then sign in.
            </p>
            <Link to="/login" className="btn btn-primary w-full mt-6">Go to Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 p-6">
      <div className="w-full max-w-lg animate-fade-in">

        {/* Mobile/desktop logo */}
        <div className="flex items-center mb-8 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group"
            aria-label="Go to Landing Page"
          >
            <div className="w-10 h-10 bg-primary-600 group-hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors duration-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-200">
              HostelMS
            </span>
          </button>
        </div>

        {/* Register card */}
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8">
          <h2 className="text-2xl font-bold text-dark-900 mb-1">Create account</h2>
          <p className="text-dark-500 text-sm mb-6">
            Register to access the hostel management portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <Input
              label="Full name"
              type="text"
              icon={User}
              placeholder="John Doe"
              value={form.name}
              onChange={setField('name')}
              error={errors.name}
              autoComplete="name"
              style={{ paddingLeft: "40px" }}
            />

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={setField('email')}
              error={errors.email}
              autoComplete="email"
              style={{ paddingLeft: "40px" }}
            />

            {/* Phone */}
            <Input
              label="Phone number (optional)"
              type="tel"
              icon={Phone}
              placeholder="9876543210"
              value={form.phone}
              onChange={setField('phone')}
              error={errors.phone}
              style={{ paddingLeft: "40px" }}
            />

            {/* Password */}
            <div className="relative w-full">
              <label className="input-label">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={setField('password')}
                  className={`input w-full pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  autoComplete="new-password"
                  style={{ paddingLeft: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="relative w-full">
              <label className="input-label">Confirm password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  className={`input w-full pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  autoComplete="new-password"
                  style={{ paddingLeft: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* API Error */}
            {apiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Create account
            </Button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-dark-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}