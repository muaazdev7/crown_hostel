import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Users, UserCog, BedDouble,
  CreditCard, MessageSquare, Package, ClipboardList,
  Megaphone, LogOut, Menu, Wrench, UserCheck, Receipt, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: UserCog },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/fees', label: 'Fees', icon: CreditCard },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
  { to: '/admin/billing', label: 'Billing', icon: Receipt },
  { to: '/admin/salaries', label: 'Salaries', icon: Wallet },
  { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/admin/visitors', label: 'Visitor Logs', icon: UserCheck },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

function SidebarContent({ user, onLogout, onClose }) {
  return (
    <aside className="flex flex-col h-full bg-dark-900 text-white w-60">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-800">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold">Crown Hostel</p>
          <p className="text-xs text-dark-400">Admin Panel</p>
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
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-dark-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <SidebarContent user={user} onLogout={handleLogout} onClose={() => {}} />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <SidebarContent user={user} onLogout={handleLogout} onClose={() => setOpen(false)} />
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
          <span className="text-sm font-semibold text-dark-700">Admin Portal</span>
          <div className="ml-auto w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
