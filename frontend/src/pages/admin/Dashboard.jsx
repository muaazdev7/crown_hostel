import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BedDouble, CreditCard, MessageSquare,
  ClipboardList, Package, UserCog, TrendingUp,
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Title,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { getDashboardStats, getMonthlyRevenue } from '../../api';
import toast from 'react-hot-toast';
import heroImg from '../../assets/hero.png';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Filler, Title
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear());
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch real revenue data
  useEffect(() => {
    setRevenueLoading(true);
    getMonthlyRevenue({ year: revenueYear })
      .then(res => setRevenueData(res.data.data))
      .catch(() => toast.error('Failed to load revenue data'))
      .finally(() => setRevenueLoading(false));
  }, [revenueYear]);

  const s = stats?.stats || {};

  // ── Room Doughnut Chart ──
  const roomChartData = {
    labels: ['Available', 'Full'],
    datasets: [{
      data: [s.availableRooms || 0, s.fullRooms || 0],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } },
    cutout: '70%',
  };

  // ── Revenue Bar Chart (REAL DATA) ──
  const revenueBarData = {
    labels: revenueData.map(d => d.monthName),
    datasets: [{
      label: 'Revenue (Pkr)',
      data: revenueData.map(d => d.totalRevenue),
      backgroundColor: 'rgba(99, 102, 241, 0.85)',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 40,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Pkr ${ctx.raw?.toLocaleString() || 0}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b', font: { size: 11 },
          callback: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v,
        },
      },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
    },
  };

  // ── Revenue Line Chart (area variant) ──
  const revenueLineData = {
    labels: revenueData.map(d => d.monthName),
    datasets: [{
      label: 'Revenue (Pkr)',
      data: revenueData.map(d => d.totalRevenue),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Pkr ${ctx.raw?.toLocaleString() || 0}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b', font: { size: 11 },
          callback: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v,
        },
      },
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
    },
  };

  // Total revenue for the year
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.totalRevenue, 0);
  const totalPayments = revenueData.reduce((sum, d) => sum + d.count, 0);

  const STAT_CARDS = [
    { label: 'Total Students', value: s.totalStudents, icon: Users, color: 'primary' },
    { label: 'Total Staff', value: s.totalStaff, icon: UserCog, color: 'accent' },
    { label: 'Available Rooms', value: s.availableRooms, icon: BedDouble, color: 'emerald' },
    { label: 'Pending Fees', value: s.pendingFees, icon: CreditCard, color: 'amber' },
    { label: 'Open Complaints', value: s.openComplaints, icon: MessageSquare, color: 'red' },
    { label: 'Full Rooms', value: s.fullRooms, icon: BedDouble, color: 'red' },
    { label: 'Applications', value: s.pendingApplications, icon: ClipboardList, color: 'blue' },
    { label: 'Total Rooms', value: s.totalRooms, icon: Package, color: 'indigo' },
  ];

  // Year selector options
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="animate-fade-in space-y-6">
      {/* ═══════════ HERO BANNER ═══════════ */}
      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52">
        {/* Gradient background with pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-500" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        {/* Hero image */}
        <img
          src={heroImg}
          alt=""
          className="absolute right-4 bottom-0 h-40 sm:h-48 opacity-20 sm:opacity-30 pointer-events-none select-none"
          loading="lazy"
        />
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 to-transparent" />
        {/* Content */}
        <div className="relative h-full flex items-center px-6 sm:px-8">
          <div>
            <p className="text-primary-200 text-xs font-semibold uppercase tracking-widest mb-1.5">Admin Panel</p>
            <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
              Manage your hostel<br />smarter, faster.
            </h2>
            <p className="text-primary-100/80 text-sm mt-2 max-w-md">
              Welcome back, <span className="font-semibold text-white">{user?.name?.split(' ')[0]}</span>. Here&apos;s your hostel overview for today.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════ STATS GRID ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <StatsCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* ═══════════ REVENUE SECTION ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Bar Chart — REAL DATA */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-dark-700">Monthly Fee Revenue</h2>
              <p className="text-xs text-dark-400 mt-0.5">
                Total: <span className="font-semibold text-dark-700">Pkr {totalRevenue.toLocaleString()}</span>
                {' '}&middot;{' '}{totalPayments} payment{totalPayments !== 1 ? 's' : ''}
              </p>
            </div>
            <select
              value={revenueYear}
              onChange={e => setRevenueYear(Number(e.target.value))}
              className="text-xs border border-dark-200 rounded-lg px-2.5 py-1.5 text-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="h-64">
            {revenueLoading ? (
              <div className="h-full bg-dark-50 rounded-xl animate-pulse" />
            ) : (
              <Bar data={revenueBarData} options={barOptions} />
            )}
          </div>
        </div>

        {/* Room Status Doughnut */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-dark-700 mb-4">Room Status</h2>
          <div className="h-64">
            <Doughnut data={roomChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* ═══════════ REVENUE TREND LINE CHART ═══════════ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-dark-700">Revenue Trend — {revenueYear}</h2>
            <p className="text-xs text-dark-400 mt-0.5">Payment collection over the year</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs text-dark-500">Revenue</span>
          </div>
        </div>
        <div className="h-56">
          {revenueLoading ? (
            <div className="h-full bg-dark-50 rounded-xl animate-pulse" />
          ) : (
            <Line data={revenueLineData} options={lineOptions} />
          )}
        </div>
      </div>

      {/* ═══════════ RECENT ACTIVITY ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Complaints */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-700">Recent Complaints</h2>
            <Link to="/admin/complaints" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => (
              <div key={i} className="h-12 bg-dark-100 rounded-lg animate-pulse" />
            ))}</div>
          ) : stats?.recentComplaints?.length ? (
            <div className="space-y-2">
              {stats.recentComplaints.map(c => (
                <div key={c._id} className="flex items-center justify-between py-2 border-b border-dark-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-800 truncate">{c.title}</p>
                    <p className="text-xs text-dark-400">{c.student?.user?.name} &middot; {c.category}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-6">No open complaints</p>
          )}
        </div>

        {/* Recent Applications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-700">Pending Applications</h2>
            <Link to="/admin/applications" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => (
              <div key={i} className="h-12 bg-dark-100 rounded-lg animate-pulse" />
            ))}</div>
          ) : stats?.recentApplications?.length ? (
            <div className="space-y-2">
              {stats.recentApplications.map(a => (
                <div key={a._id} className="flex items-center justify-between py-2 border-b border-dark-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-800 truncate">{a.applicantName}</p>
                    <p className="text-xs text-dark-400">{a.department} &middot; Sem {a.semester}</p>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400 text-center py-6">No pending applications</p>
          )}
        </div>
      </div>

      {/* ═══════════ QUICK ACTIONS ═══════════ */}
      <div>
        <h2 className="text-sm font-semibold text-dark-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Student', to: '/admin/students', icon: Users, color: 'text-primary-600 bg-primary-50' },
            { label: 'Manage Rooms', to: '/admin/rooms', icon: BedDouble, color: 'text-accent-600 bg-accent-50' },
            { label: 'Generate Invoice', to: '/admin/fees', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
            { label: 'View Complaints', to: '/admin/complaints', icon: MessageSquare, color: 'text-red-600 bg-red-50' },
          ].map(({ label, to, icon: Icon, color }) => (
            <Link
              key={label}
              to={to}
              className="card p-4 flex items-center gap-3 hover:border-primary-200 hover:shadow-md transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-dark-700 group-hover:text-primary-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
