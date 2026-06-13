import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getMe } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ── Mock credentials for offline / demo mode ──────────────────
const MOCK_USERS = {
  'admin@hostel.com': {
    password: 'admin123',
    user: { _id: 'u-admin', name: 'Admin User', email: 'admin@hostel.com', role: 'admin', phone: '9000000001' },
  },
  'staff@hostel.com': {
    password: 'staff123',
    user: { _id: 'u-staff', name: 'Staff Warden', email: 'staff@hostel.com', role: 'staff', phone: '9000000002', designation: 'Warden' },
  },
  'student@hostel.com': {
    password: 'student123',
    user: { _id: 'u-student', name: 'Ahmed Bilal', email: 'student@hostel.com', role: 'student', phone: '9876543210' },
  },
};

const mockDelay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

const tryMockLogin = (email, password) => {
  const entry = MOCK_USERS[email.toLowerCase()];
  if (entry && entry.password === password) {
    return { token: `mock-token-${entry.user.role}`, user: entry.user };
  }
  return null;
};

// ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    // Guard against bad/legacy values: a missing field once stored the literal
    // string "undefined"/"null", which crashes JSON.parse on reload.
    const isUsable = (v) => v && v !== 'undefined' && v !== 'null';

    let parsed = null;
    if (isUsable(savedUser)) {
      try {
        parsed = JSON.parse(savedUser);
      } catch {
        parsed = null;
      }
    }

    if (isUsable(token) && parsed) {
      setUser(parsed);
      // If it's a mock token, skip server verification
      if (token.startsWith('mock-token-')) {
        setLoading(false);
        return;
      }
      getMe()
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Backend unreachable but we have saved user — keep session alive
          // (prevents logout when backend is offline)
        })
        .finally(() => setLoading(false));
    } else {
      // No valid session (or corrupt localStorage) — clean up and continue.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // 1. Try real backend first
    try {
      const { data } = await loginUser({ email, password });
      // Don't persist a malformed response (avoids storing the string "undefined").
      if (!data?.token || !data?.user) {
        throw new Error('Invalid login response from server');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
      return data;
    } catch (networkOrApiError) {
      // 2. Backend unavailable → try mock credentials
      const isNetworkError =
        !networkOrApiError.response ||
        networkOrApiError.code === 'ERR_NETWORK' ||
        networkOrApiError.code === 'ECONNREFUSED';

      if (isNetworkError) {
        await mockDelay();
        const mockData = tryMockLogin(email, password);
        if (mockData) {
          localStorage.setItem('token', mockData.token);
          localStorage.setItem('user', JSON.stringify(mockData.user));
          setUser(mockData.user);
          toast.success(`Welcome back, ${mockData.user.name}! (Demo mode)`);
          navigate(`/${mockData.user.role}`);
          return mockData;
        }
        const err = new Error('Invalid credentials');
        err.response = { data: { message: 'Invalid email or password' } };
        toast.error('Invalid email or password');
        throw err;
      }

      // Backend returned a real error (401, etc.)
      const msg = networkOrApiError.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw networkOrApiError;
    }
  };

  const register = async (formData) => {
    // 1. Try real backend
    try {
      const { data } = await registerUser(formData);

      // Student email-verification flow: no session is issued — the user must
      // verify via the emailed link before logging in.
      if (data.requiresVerification) {
        toast.success(data.message || 'Please check your email to verify your account.');
        return data;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Registration successful!');
      navigate(`/${data.user.role}`);
      return data;
    } catch (networkOrApiError) {
      const isNetworkError =
        !networkOrApiError.response ||
        networkOrApiError.code === 'ERR_NETWORK' ||
        networkOrApiError.code === 'ECONNREFUSED';

      if (isNetworkError) {
        // 2. Mock registration — create a demo user session
        await mockDelay(800);
        const mockUser = {
          _id: `u-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          role: formData.role || 'student',
          phone: formData.phone || '',
        };
        const mockToken = `mock-token-${mockUser.role}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        toast.success('Registration successful! (Demo mode)');
        navigate(`/${mockUser.role}`);
        return { token: mockToken, user: mockUser };
      }

      const msg = networkOrApiError.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw networkOrApiError;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
