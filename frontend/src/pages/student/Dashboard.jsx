import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble, CreditCard, MessageSquare, CalendarOff,
  Bell, ChevronRight, Clock, CheckCircle, AlertTriangle,
  FileText, ClipboardList, Loader2, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import { getStudentDashboard } from '../../api';
import { getImageUrl } from '../../utils/imageUrl';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getStudentDashboard();
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-500">Could not load dashboard.</p>
        <button onClick={fetchDashboard} className="btn btn-outline mt-4">Retry</button>
      </div>
    );
  }

  const { stats, recentComplaints, notifications, student } = data;

  // Build profile image source
  const profileImg = getImageUrl(student?.profileImage);

  const statCards = [
    {
      label: 'Room Number',
      value: stats.room ? stats.room.roomNumber : 'Not Assigned',
      sub: stats.room ? `${stats.room.blockName || '—'} / Floor ${stats.room.floor}` : 'Apply for a room',
      icon: BedDouble,
      color: 'bg-primary-50 text-primary-600',
      to: '/student/room',
    },
    {
      label: 'Outstanding Fee',
      value: `Rs ${(stats.fee.outstandingFee || 0).toLocaleString()}`,
      sub: `${stats.fee.pendingInvoices} pending invoice(s)`,
      icon: CreditCard,
      color: 'bg-primary-50 text-primary-600',
      to: '/student/fees',
    },
    {
      label: 'Open Complaints',
      value: stats.complaints.open,
      sub: `${stats.complaints.total} total filed`,
      icon: MessageSquare,
      color: 'bg-primary-50 text-primary-600',
      to: '/student/complaints',
    },
    {
      label: 'Attendance',
      value: `${stats.attendance.percent}%`,
      sub: `${stats.attendance.daysTracked} days tracked`,
      icon: CalendarOff,
      color: 'bg-primary-50 text-primary-600',
      to: '/student/leave',
    },
  ];

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-700  relative px-6 py-6 flex items-center gap-4">
          {profileImg ? (
            <img
              src={profileImg}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover border-2 border-primary-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-primary-200 bg-primary-50 flex items-center justify-center">
              <User className="w-7 h-7 text-primary-600" />
            </div>
          )}
          <div className="text-white min-w-0">
            <h1 className="text-2xl font-bold truncate">Hello, {user?.name?.split(' ')[0] || 'Student'}!</h1>
            <p className="flex items-center gap-2 mt-1">Your hostel portal overview</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-dark-900">{value}</p>
              <p className="text-xs text-dark-500 truncate">{sub}</p>
              <p className="text-xs text-dark-400 mt-0.5">{label}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-dark-300 group-hover:text-dark-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {/* Two columns: Notifications + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-dark-500" />
              <h3 className="font-semibold text-dark-800">Notifications</h3>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-dark-400 text-sm">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-dark-50">
              {notifications.map(n => (
                <div key={n._id} className={`flex items-start gap-3 px-5 py-3 ${!n.isRead ? 'bg-primary-50/40' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'fee' ? 'bg-amber-100 text-amber-600'
                      : n.type === 'complaint' ? 'bg-red-100 text-red-600'
                      : n.type === 'leave' ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-primary-100 text-primary-600'
                  }`}>
                    {n.type === 'fee' ? <CreditCard className="w-4 h-4" />
                      : n.type === 'complaint' ? <AlertTriangle className="w-4 h-4" />
                      : n.type === 'leave' ? <CheckCircle className="w-4 h-4" />
                      : <Bell className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-dark-900' : 'text-dark-700'}`}>{n.title}</p>
                    <p className="text-xs text-dark-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-dark-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Recent Complaints */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-dark-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/student/application" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-sm font-medium">
                <ClipboardList className="w-4 h-4" /> Apply for Room
              </Link>
              <Link to="/student/complaints" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-sm font-medium">
                <MessageSquare className="w-4 h-4" /> File Complaint
              </Link>
              <Link to="/student/leave" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium">
                <CalendarOff className="w-4 h-4" /> Apply for Leave
              </Link>
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="card">
            <div className="px-5 py-3 border-b border-dark-100">
              <h3 className="font-semibold text-dark-800 text-sm">Recent Complaints</h3>
            </div>
            {recentComplaints.length === 0 ? (
              <div className="p-5 text-center text-dark-400 text-sm">No complaints filed.</div>
            ) : (
              recentComplaints.map(c => (
                <div key={c._id} className="px-5 py-3 border-b border-dark-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-dark-800 truncate">{c.title}</p>
                    <Badge status={c.status === 'in_progress' ? 'in-progress' : c.status} />
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
