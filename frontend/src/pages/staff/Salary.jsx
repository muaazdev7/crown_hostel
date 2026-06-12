import { useState, useEffect } from 'react';
import { Wallet, Bell, Loader2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import { getMySalary, getNotifications } from '../../api';

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function StaffSalary() {
  const [records, setRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [salaryRes, notifRes] = await Promise.all([getMySalary(), getNotifications({ limit: 30 })]);
        setRecords(salaryRes.data.data || []);
        // Only salary-related notifications on this page
        setNotifications((notifRes.data.data || []).filter((n) => n.type === 'salary'));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load salary information');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalPaid = records.filter((r) => r.paymentStatus === 'paid').reduce((s, r) => s + (r.salaryAmount || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-accent-500" /></div>;
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wallet className="w-6 h-6 text-accent-500" /> My Salary</h1>
          <p className="page-subtitle">Your salary payment history and notifications</p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-1.5 rounded-full">
          Total Received: {fmtMoney(totalPaid)}
        </span>
      </div>

      {/* Salary Notifications */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-500" />
          <h2 className="font-semibold text-dark-800 text-sm">Salary Notifications</h2>
        </div>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-dark-400 text-sm">No salary notifications yet</div>
        ) : (
          <div className="divide-y divide-dark-50">
            {notifications.map((n) => (
              <div key={n._id} className="p-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-dark-200' : 'bg-accent-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-800">{n.title}</p>
                  <p className="text-xs text-dark-500">{n.message}</p>
                  <p className="text-[10px] text-dark-300 mt-0.5">{fmtTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-100">
          <h2 className="font-semibold text-dark-800 text-sm">Payment History</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No salary records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                  <th className="px-5 py-3 font-medium">Month</th>
                  <th className="px-3 py-3 font-medium text-right">Amount</th>
                  <th className="px-3 py-3 font-medium">Payment Date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-dark-50/50">
                    <td className="px-5 py-3 font-medium text-dark-800">{r.monthName} {r.paymentYear}</td>
                    <td className="px-3 py-3 text-right font-medium text-dark-800">{fmtMoney(r.salaryAmount)}</td>
                    <td className="px-3 py-3 text-dark-500 text-xs">{fmtDate(r.paymentDate)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1">
                        {r.paymentStatus === 'paid' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                        <Badge status={r.paymentStatus} />
                      </span>
                    </td>
                    <td className="px-3 py-3 text-dark-500">{r.remarks || '—'}</td>
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
