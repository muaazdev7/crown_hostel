import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, Clock, CheckCircle, AlertTriangle, Wallet, CalendarRange,
  ArrowRight, RefreshCw, BarChart3, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import { getBillStats } from '../../api';
import { typeLabel, fmtDate, fmtMoney } from './billConstants';

export default function BillingDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const base = isAdmin ? '/admin/billing' : '/staff/billing';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState(null);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const { data } = await getBillStats();
      setStats(data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (error && !loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-dark-800">Couldn't load billing dashboard</h2>
        <button onClick={load} className="btn btn-primary mt-4"><RefreshCw className="w-4 h-4" /> Retry</button>
      </div>
    );
  }

  const s = stats || {};
  const cards = isAdmin
    ? [
        { label: 'Annual Expenses',   value: fmtMoney(s.totalAnnualExpenses),  icon: Wallet,        color: 'primary' },
        { label: 'This Month',        value: fmtMoney(s.currentMonthExpenses), icon: CalendarRange, color: 'accent' },
        { label: 'Paid Bills',        value: s.paidBills,                       icon: CheckCircle,   color: 'emerald' },
        { label: 'Pending Bills',     value: s.pendingBills,                    icon: Clock,         color: 'amber' },
        { label: 'Overdue Bills',     value: s.overdueBills,                    icon: AlertTriangle, color: 'red' },
      ]
    : [
        { label: 'Total Bills',       value: s.totalBills,                      icon: Receipt,       color: 'primary' },
        { label: 'Pending Bills',     value: s.pendingBills,                    icon: Clock,         color: 'amber' },
        { label: 'Paid Bills',        value: s.paidBills,                       icon: CheckCircle,   color: 'emerald' },
        { label: 'Overdue Bills',     value: s.overdueBills,                    icon: AlertTriangle, color: 'red' },
        { label: 'This Month',        value: fmtMoney(s.currentMonthExpenses),  icon: CalendarRange, color: 'accent' },
      ];

  const recentBills = s.recentBills || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Receipt className="w-6 h-6 text-primary-500" /> Billing Dashboard</h1>
          <p className="page-subtitle">Hostel operational utility bills overview</p>
        </div>
        <div className="flex gap-2">
          <Link to={`${base}/bills`} className="btn btn-primary">Manage Bills</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <StatsCard key={c.label} label={c.label} value={loading ? null : (c.value ?? 0)} icon={c.icon} color={c.color} loading={loading} />
        ))}
      </div>

      {/* Admin report shortcuts */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to={`${base}/monthly`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="font-semibold text-dark-800 text-sm">Monthly Expense Report</p>
              <p className="text-xs text-dark-400">Category-wise monthly breakdown</p>
            </div>
            <ArrowRight className="w-4 h-4 text-dark-400" />
          </Link>
          <Link to={`${base}/yearly`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="font-semibold text-dark-800 text-sm">Yearly Expense Report</p>
              <p className="text-xs text-dark-400">Annual trends & category analysis</p>
            </div>
            <ArrowRight className="w-4 h-4 text-dark-400" />
          </Link>
        </div>
      )}

      {/* Recent Bills */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-100 flex items-center justify-between">
          <h2 className="font-semibold text-dark-800 flex items-center gap-2"><Receipt className="w-4 h-4 text-primary-500" /> Recent Bills</h2>
          <Link to={`${base}/bills`} className="text-xs text-primary-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-dark-50 rounded-lg animate-pulse" />)}</div>
        ) : recentBills.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bills yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                  <th className="px-5 py-3 font-medium">Bill Number</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Provider</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Due Date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {recentBills.map((b) => (
                  <tr key={b._id} className="hover:bg-dark-50/50">
                    <td className="px-5 py-3 font-medium text-dark-800">{b.billNumber}</td>
                    <td className="px-3 py-3 text-dark-600">{typeLabel(b.billType)}</td>
                    <td className="px-3 py-3 text-dark-600">{b.serviceProvider}</td>
                    <td className="px-3 py-3 font-medium text-dark-800">{fmtMoney(b.totalAmount)}</td>
                    <td className="px-3 py-3 text-dark-500 text-xs">{fmtDate(b.dueDate)}</td>
                    <td className="px-3 py-3"><Badge status={b.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
