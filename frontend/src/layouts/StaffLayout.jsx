import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, CalendarCheck, MessageSquare,
  Users, Wrench, LogOut, Menu, Package, Megaphone, User, Receipt, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStaffProfile } from '../api';
import { getImageUrl } from '../utils/imageUrl';

const NAV = [
  { to: '/staff',             label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/staff/attendance',  label: 'Attendance', icon: CalendarCheck, wardenOnly: true },
  { to: '/staff/complaints',  label: 'Complaints', icon: MessageSquare },
  { to: '/staff/inventory',   label: 'Inventory',  icon: Package },
  { to: '/staff/maintenance', label: 'Maintenance',icon: Wrench },
  { to: '/staff/salary',      label: 'My Salary',  icon: Wallet },
  { to: '/staff/visitors',    label: 'Visitors',   icon: Users, wardenOnly: true },
  { to: '/staff/billing',     label: 'Billing',    icon: Receipt, wardenOnly: true },
  { to: '/staff/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/staff/profile',    label: 'My Profile', icon: User },
];

function SidebarContent({ user, profileImage, onLogout, onClose }) {
  const isWarden = user?.designation === 'Warden';
  const visibleNav = NAV.filter(item => !item.wardenOnly || isWarden);

  return (
    <aside className="flex flex-col h-full bg-dark-900 text-white w-60">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-800">
        <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold">Crown Hostel</p>
          <p className="text-xs text-dark-400">Staff Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-accent-600 text-white' : 'text-dark-400 hover:bg-dark-800 hover:text-white'
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
              className="w-9 h-9 rounded-full object-cover ring-2 ring-accent-500 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent-600 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 capitalize">{user?.designation || user?.role}</p>
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

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    getStaffProfile()
      .then(({ data }) => {
        if (data.data?.profileImage) setProfileImage(getImageUrl(data.data.profileImage));
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="theme-staff flex h-screen bg-dark-50 overflow-hidden">
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
          <span className="text-sm font-semibold text-dark-700">Staff Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
