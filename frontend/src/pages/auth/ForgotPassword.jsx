import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Building2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const API_BASE        = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTO_DISMISS_MS = 5000;

/* ─────────────────────────────────────────────────────────────────────────────
   Demo-mode mock — only fires when the real server is unreachable.
   Remove this function (and the catch branch that calls it) once the backend
   is running in production.
───────────────────────────────────────────────────────────────────────────── */
const MOCK_EMAILS = new Set(['admin@hostel.com', 'staff@hostel.com', 'student@hostel.com']);

const mockForgotPassword = (email) =>
  new Promise((resolve) => {
    setTimeout(() => {
      /*
       * Real backend always returns 200 regardless of whether the email
       * exists (security).  We mirror that here — always succeed in mock mode.
       */
      resolve({ success: true });
    }, 1200);
  });

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');      // API / network errors
  const [fieldError, setFieldError] = useState('');    // inline input error

  /* Auto-dismiss the API error banner after 5 s */
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [error]);

  /* ── Client-side validation ── */
  const validate = () => {
    if (!email.trim()) {
      setFieldError('Email address is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFieldError('Please enter a valid email address.');
      return false;
    }
    setFieldError('');
    return true;
  };

  /* ── Submit — real API with mock fallback ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setSubmitted(true);
      } else {
        /* Server returned a specific error (e.g. 500 from email failure) */
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      if (err instanceof TypeError) {
        /* Network unreachable → use demo mock */
        const result = await mockForgotPassword(email);
        if (result.success) {
          setSubmitted(true);
        } else {
          setError(result.message || 'Something went wrong. Please try again.');
        }
      } else {
        setError('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setEmail('');
    setError('');
    setFieldError('');
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-dark-50">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center mb-8 lg:hidden">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
              aria-label="Go to Landing Page"
            >
              <div className="w-10 h-10 bg-primary-600 group-hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors duration-200">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-200">
                Crown Hostel
              </span>
            </button>
          </div>

          {/* ── Card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8">

            {!submitted ? (
              <>
                <h2 className="text-2xl font-bold text-dark-900 mb-1">Reset password</h2>
                <p className="text-dark-500 text-sm mb-8">
                  Enter your registered email and we&apos;ll send you a reset link.
                </p>

                {/* API error banner — auto-dismisses after 5 s */}
                {error && (
                  <div className="flex items-start gap-3 mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <Input
                    label="Email address"
                    type="email"
                    icon={Mail}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError('');
                      if (error)      setError('');
                    }}
                    error={fieldError}
                    autoComplete="email"
                    disabled={loading}
                    style={{ paddingLeft: "40px" }}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </Button>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="text-center py-4">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-9 h-9 text-emerald-500" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-dark-900 mb-2">Check your inbox</h2>
                <p className="text-dark-500 text-sm leading-relaxed">
                  If{' '}
                  <span className="font-semibold text-dark-700">{email}</span>{' '}
                  is registered, you&apos;ll receive a reset link shortly.
                </p>
                <p className="mt-2 text-xs text-dark-400">
                  Didn&apos;t receive it? Check your spam folder.
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-5 text-xs text-dark-400 hover:text-primary-600 underline underline-offset-2 transition-colors"
                >
                  Try a different email
                </button>
              </div>
            )}

            {/* Back to sign in */}
            <div className="mt-6 pt-5 border-t border-dark-100">
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm text-dark-500 hover:text-primary-600 font-medium transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                Back to sign in
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
