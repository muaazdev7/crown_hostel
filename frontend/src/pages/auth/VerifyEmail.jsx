import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { verifyEmail as verifyEmailApi } from '../../api';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  // status: 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  // Guard against React 18 StrictMode firing the effect twice in dev — without
  // it, the second (duplicate) request can clobber the first request's result.
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const run = async () => {
      try {
        // axios resolves only on a 2xx status …
        const { data } = await verifyEmailApi(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully. You can now log in.');
      } catch (err) {
        // … and rejects on any 4xx/5xx, so this only runs on a real failure.
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    run();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group" aria-label="Go to home">
            <div className="w-10 h-10 bg-primary-600 group-hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors duration-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-dark-900 group-hover:text-primary-600 transition-colors duration-200">
              Crown Hostel
            </span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-5">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-1">Verifying…</h2>
              <p className="text-dark-500 text-sm">Please wait while we confirm your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-9 h-9 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-2">Email verified!</h2>
              <p className="text-dark-500 text-sm">{message}</p>
              <Link to="/login" className="btn btn-primary w-full mt-6">Continue to Sign in</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <XCircle className="w-9 h-9 text-red-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-2">Verification failed</h2>
              <p className="text-dark-500 text-sm">{message}</p>
              <Link to="/register" className="btn btn-outline w-full mt-6">Back to Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
