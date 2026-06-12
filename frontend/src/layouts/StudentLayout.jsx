import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, BedDouble, CreditCard,
  MessageSquare, CalendarOff, User, LogOut, Menu, ClipboardList, Megaphone,
  Wrench, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const NAV = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/application', label: 'Application', icon: ClipboardList },
  { to: '/student/room', label: 'My Room', icon: BedDouble },
  { to: '/student/fees', label: 'Fees', icon: CreditCard },
  { to: '/student/complaints', label: 'Complaints', icon: MessageSquare },
  { to: '/student/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/student/leave', label: 'Leave', icon: CalendarOff },
  { to: '/student/visitors', label: 'Visitor Requests', icon: Users },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/student/profile', label: 'Profile', icon: User },
];

function SidebarContent({ user, profileImage, onLogout, onClose }) {
  return (
    <aside className="flex flex-col h-full bg-dark-900 text-white w-60">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-800">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold">Crown Hostel</p>
          <p className="text-xs text-dark-400">Student Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-dark-400 hover:bg-dark-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-dark-800 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          {profileImage ? (
            <img
              src={profileImage}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-500 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-dark-400 hover:bg-dark-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Fetch the student's uploaded profile image from MongoDB
  useEffect(() => {
    getMyProfile()
      .then(({ data }) => {
        if (data.data?.profileImage) setProfileImage(`${API_BASE}${data.data.profileImage}`);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="theme-student flex h-screen bg-dark-50 overflow-hidden">
      <div className="hidden lg:flex shrink-0">
        <SidebarContent user={user} profileImage={profileImage} onLogout={handleLogout} onClose={() => {}} />
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <SidebarContent user={user} profileImage={profileImage} onLogout={handleLogout} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-dark-100 flex items-center px-4 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg text-dark-500 hover:bg-dark-100 mr-3"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-dark-700">Student Portal</span>
          
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
