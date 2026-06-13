import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, Package, AlertTriangle, CheckCircle, Clock, ArrowRight,
  CalendarCheck, Users, Megaphone, ClipboardList, Bell, TrendingDown,
  ShieldAlert, Pin, Plane, RefreshCw, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { getStaffDashboard } from '../../api';

import { getImageUrl } from '../../utils/imageUrl';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function StaffDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await getStaffDashboard();
      if (data.success) setDashboard(data.data);
      else setError(true);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = dashboard?.stats || {};
  const recentReports = dashboard?.recentInventoryReports || [];
  const recentLeaves = dashboard?.recentLeaves || [];
  const recentNotifications = dashboard?.recentNotifications || [];
  const recentMaintenance = dashboard?.recentMaintenance || [];
  const announcements = dashboard?.announcements || [];
  const staffInfo = dashboard?.staff;
  const isWarden = staffInfo?.isWarden ?? (user?.designation === 'Warden');

  const profileImg = getImageUrl(staffInfo?.profileImage);

  // ── Error state ──
  if (error && !loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-dark-800">Couldn't load your dashboard</h2>
        <p className="text-sm text-dark-400 mt-1 mb-4">There was a problem reaching the server.</p>
        <button onClick={load} className="btn btn-primary">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Stat cards — visitor card only for wardens (single role theme color)
  const statCards = [
    { label: 'Pending Tasks',    value: stats.pendingMaintenance, icon: Wrench,        color: 'accent' },
    { label: 'Inventory Alerts', value: stats.inventoryAlerts,    icon: AlertTriangle, color: 'accent' },
    { label: 'Leave Requests',   value: stats.leaveRequests,      icon: CalendarCheck, color: 'accent' },
    ...(isWarden ? [{ label: 'Visitor Requests', value: stats.visitorRequests, icon: Users, color: 'accent' }] : []),
    { label: 'Announcements',    value: stats.announcements,      icon: Megaphone,     color: 'accent' },
  ];

  const quickActions = [
    { to: '/staff/inventory',   label: 'Inventory',   icon: Package },
    { to: '/staff/attendance',  label: 'Attendance',  icon: CalendarCheck, wardenOnly: true },
    { to: '/staff/complaints',  label: 'Complaints',  icon: MessageSquare },
    { to: '/staff/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/staff/visitors',    label: 'Visitors',    icon: Users, wardenOnly: true },
  ].filter((a) => !a.wardenOnly || isWarden);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ── */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 relative px-6 py-6 flex items-center gap-4">
          {profileImg ? (
            <img src={profileImg} alt={staffInfo?.name} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/30 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-2xl ring-4 ring-white/30 shrink-0">
              {(staffInfo?.name || user?.name)?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          )}
          <div className="text-white min-w-0">
            <p className="text-sm text-white/80">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold truncate">Welcome back, {(staffInfo?.name || user?.name)?.split(' ')[0]}!</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">{staffInfo?.designation || user?.designation || 'Staff'}</span>
              {staffInfo?.assignedBlock && (
                <span className="text-xs text-white/80">· Block {staffInfo.assignedBlock}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((c) => (
          <StatsCard key={c.label} label={c.label} value={loading ? null : (c.value ?? 0)} icon={c.icon} color={c.color} loading={loading} />
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="card p-5">
        <h2 className="font-semibold text-dark-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dark-100 hover:border-primary-200 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-accent-50 text-accent-600">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-dark-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── My Maintenance Requests ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent-500" /> My Maintenance Requests
          </h2>
          <Link to="/staff/maintenance" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-dark-50 rounded-lg animate-pulse" />)}</div>
        ) : recentMaintenance.length === 0 ? (
          <EmptyState icon={Wrench} text="No maintenance requests assigned to you" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                  <th className="px-2 py-2 font-medium">Student</th>
                  <th className="px-2 py-2 font-medium">Room</th>
                  <th className="px-2 py-2 font-medium">Issue</th>
                  <th className="px-2 py-2 font-medium">Priority</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {recentMaintenance.map((m) => (
                  <tr key={m._id} className="hover:bg-dark-50/50">
                    <td className="px-2 py-2.5 text-dark-700">{m.studentName || '—'}</td>
                    <td className="px-2 py-2.5 text-dark-500">{m.roomNumber || '—'}</td>
                    <td className="px-2 py-2.5 font-medium text-dark-800 truncate max-w-[160px]">{m.issueTitle}</td>
                    <td className="px-2 py-2.5"><Badge status={m.priority} /></td>
                    <td className="px-2 py-2.5"><Badge status={m.status} /></td>
                    <td className="px-2 py-2.5 text-dark-400 text-xs">{fmtDate(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Latest Inventory Reports */}
        <ActivityCard
          title="Latest Inventory Reports"
          icon={ClipboardList}
          iconColor="text-accent-500"
          link="/staff/inventory"
          loading={loading}
          empty={recentReports.length === 0}
          emptyText="No inventory reports yet"
        >
          {recentReports.map((r) => (
            <div key={r._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                r.reportType === 'SHORTAGE' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
              }`}>
                {r.reportType === 'SHORTAGE' ? <TrendingDown className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-800 truncate">{r.item?.name || r.itemName}</p>
                <p className="text-xs text-dark-400 truncate">{r.reportedByName} · {fmtDate(r.createdAt)}</p>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </ActivityCard>

        {/* Latest Leave Requests */}
        <ActivityCard
          title="Latest Leave Requests"
          icon={Plane}
          iconColor="text-accent-500"
          link={isWarden ? '/staff/attendance' : null}
          loading={loading}
          empty={recentLeaves.length === 0}
          emptyText="No pending leave requests"
        >
          {recentLeaves.map((l) => (
            <div key={l._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center font-bold text-xs shrink-0">
                {l.student?.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-800 truncate">{l.student?.user?.name || 'Unknown'}</p>
                <p className="text-xs text-dark-400 truncate capitalize">
                  {l.leaveType?.replace('_', ' ') || 'Leave'} · {fmtDate(l.fromDate)}–{fmtDate(l.toDate)}
                </p>
              </div>
              <Badge status={l.status} />
            </div>
          ))}
        </ActivityCard>

        {/* Recent Notifications */}
        <ActivityCard
          title="Recent Notifications"
          icon={Bell}
          iconColor="text-primary-500"
          loading={loading}
          empty={recentNotifications.length === 0}
          emptyText="No notifications"
        >
          {recentNotifications.map((n) => (
            <div key={n._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-dark-200' : 'bg-accent-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-800 truncate">{n.title}</p>
                <p className="text-xs text-dark-400 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-dark-300 mt-0.5">{fmtTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </ActivityCard>
      </div>

      {/* ── Announcements + Complaint Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-accent-500" /> Latest Announcements
            </h2>
            <Link to="/staff/announcements" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-dark-50 rounded-lg animate-pulse" />)}</div>
          ) : announcements.length === 0 ? (
            <EmptyState icon={Megaphone} text="No announcements" />
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a._id} className="rounded-xl border border-dark-100 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-dark-800 truncate">{a.title}</p>
                    {a.isPinned
                      ? <span className="flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full shrink-0"><Pin className="w-2.5 h-2.5" /> Priority</span>
                      : <span className="text-[10px] font-medium bg-dark-100 text-dark-500 px-2 py-0.5 rounded-full shrink-0">Normal</span>
                    }
                  </div>
                  <p className="text-xs text-dark-500 line-clamp-2 mt-1">{a.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-dark-400">{a.createdBy?.name || 'Admin'}</span>
                    <span className="text-[10px] text-dark-400">{fmtDate(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaint Status Summary */}
        <div className="card p-5">
          <h2 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-500" /> Complaint Status
          </h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-dark-50 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Resolved',    count: stats.resolvedComplaints || 0,   icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'In Progress', count: stats.inProgressComplaints || 0, icon: Clock,         color: 'text-blue-600',    bg: 'bg-blue-50' },
                { label: 'Pending',     count: stats.pendingComplaints || 0,    icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50' },
              ].map(({ label, count, icon: Icon, color, bg }) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-sm font-medium text-dark-700 flex-1">{label}</span>
                  <span className={`text-lg font-bold ${color}`}>{count}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-dark-100 flex items-center justify-between text-sm">
                <span className="text-dark-500">Total Complaints</span>
                <span className="font-bold text-dark-800">{stats.totalComplaints || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reusable activity card with loading skeleton + empty state ──
function ActivityCard({ title, icon: Icon, iconColor, link, loading, empty, emptyText, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-dark-800 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
        </h2>
        {link && (
          <Link to={link} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-dark-50 rounded-lg animate-pulse" />)}</div>
      ) : empty ? (
        <EmptyState icon={Icon} text={emptyText} />
      ) : (
        <div className="divide-y divide-dark-50">{children}</div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="py-8 text-center">
      <Icon className="w-10 h-10 mx-auto mb-2 text-dark-200" />
      <p className="text-sm text-dark-400">{text}</p>
    </div>
  );
}
