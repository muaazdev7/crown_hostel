import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, Building2 } from 'lucide-react';

// Shown right after a successful student registration. No session/token exists
// yet — the user must click the link emailed to them, then sign in.
export default function VerifyNotice() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

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
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
              <MailCheck className="w-9 h-9 text-primary-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-dark-900 mb-2">Verify your email</h2>
          <p className="text-dark-500 text-sm">
            {email ? (
              <>We've sent a verification link to <span className="font-medium text-dark-700">{email}</span>. </>
            ) : (
              <>We've sent a verification link to your email. </>
            )}
            Click it to activate your account, then sign in.
          </p>
          <p className="text-xs text-dark-400 mt-3">
            Didn't get it? Check your spam folder.
          </p>
          <Link to="/login" className="btn btn-primary w-full mt-6">Go to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
