import { useState, useEffect, useCallback } from 'react';
import { Wallet, CheckCircle, Clock, Loader2, CalendarRange, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getSalaryMonthlyReport, getSalaryYearlyReport, paySalary,
} from '../../api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function ManageSalaries() {
  const now = new Date();
  const [view, setView] = useState('log'); // 'log' | 'yearly'
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [yearForYearly, setYearForYearly] = useState(now.getFullYear());

  const [report, setReport] = useState(null);
  const [yearly, setYearly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // staff record to pay
  const [paying, setPaying] = useState(false);

  const loadLog = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getSalaryMonthlyReport({ month, year });
      setReport(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load salary log');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const loadYearly = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getSalaryYearlyReport({ year: yearForYearly });
      setYearly(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load yearly report');
    } finally {
      setLoading(false);
    }
  }, [yearForYearly]);

  useEffect(() => {
    if (view === 'log') loadLog();
    else loadYearly();
  }, [view, loadLog, loadYearly]);

  const handleConfirmPay = async () => {
    if (!confirm) return;
    setPaying(true);
    try {
      await paySalary({ staffId: confirm.staffId, paymentMonth: month, paymentYear: year, salaryAmount: confirm.salaryAmount });
      toast.success(`Salary confirmed for ${confirm.staffName}`);
      setConfirm(null);
      loadLog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setPaying(false);
    }
  };

  const records = report?.records || [];
  const paidCount = records.filter((r) => r.paymentStatus === 'paid').length;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wallet className="w-6 h-6 text-primary-500" /> Salary Management</h1>
          <p className="page-subtitle">Confirm staff salary payments and view reports</p>
        </div>
      </div>

      {/* View toggle */}
      <div className="card p-1 flex gap-1 w-fit">
        <button onClick={() => setView('log')} className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${view === 'log' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'}`}>
          <Users className="w-3.5 h-3.5" /> Monthly Salary Log
        </button>
        <button onClick={() => setView('yearly')} className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${view === 'yearly' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'}`}>
          <CalendarRange className="w-3.5 h-3.5" /> Yearly Report
        </button>
      </div>

      {view === 'log' ? (
        <>
          {/* Month/Year selectors + summary */}
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input bg-white w-40">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input bg-white w-28">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {report && (
              <div className="flex items-center gap-3 ml-auto text-sm">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-4 h-4" /> {paidCount} Paid</span>
                <span className="flex items-center gap-1 text-amber-600"><Clock className="w-4 h-4" /> {records.length - paidCount} Pending</span>
                <span className="font-semibold text-dark-800">Total: {fmtMoney(report.monthlyTotal)}</span>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-dark-100">
              <h2 className="font-semibold text-dark-800 text-sm">{MONTHS[month - 1]} {year} — Salary Log</h2>
            </div>
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-dark-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No staff found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                      <th className="px-5 py-3 font-medium">Staff Name</th>
                      <th className="px-3 py-3 font-medium">Employee ID</th>
                      <th className="px-3 py-3 font-medium">Designation</th>
                      <th className="px-3 py-3 font-medium text-right">Salary Amount</th>
                      <th className="px-3 py-3 font-medium">Payment Date</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-50">
                    {records.map((r) => (
                      <tr key={r.staffId} className="hover:bg-dark-50/50">
                        <td className="px-5 py-3 font-medium text-dark-800">{r.staffName}</td>
                        <td className="px-3 py-3 text-dark-600">{r.employeeId || '—'}</td>
                        <td className="px-3 py-3 text-dark-600">{r.designation || '—'}</td>
                        <td className="px-3 py-3 text-right font-medium text-dark-800">{fmtMoney(r.salaryAmount)}</td>
                        <td className="px-3 py-3 text-dark-500 text-xs">{fmtDate(r.paymentDate)}</td>
                        <td className="px-3 py-3"><Badge status={r.paymentStatus} /></td>
                        <td className="px-3 py-3 text-right">
                          {r.paymentStatus === 'paid' ? (
                            <span className="text-xs text-emerald-600 font-medium">Confirmed</span>
                          ) : (
                            <button onClick={() => setConfirm(r)} className="btn btn-primary text-xs py-1.5 px-3">Confirm Payment</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Yearly */}
          <div className="card p-4 flex items-center gap-3">
            <select value={yearForYearly} onChange={(e) => setYearForYearly(Number(e.target.value))} className="input bg-white w-28">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {yearly && <span className="ml-auto font-semibold text-dark-800">Annual Total: {fmtMoney(yearly.annualTotal)}</span>}
          </div>

          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : yearly ? (
            <>
              <div className="card p-5">
                <h2 className="font-semibold text-dark-800 mb-4">Month-wise Salary Totals — {yearly.year}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {yearly.monthlyTotals.map((m) => (
                    <div key={m.month} className="rounded-xl border border-dark-100 px-3 py-2">
                      <p className="text-xs text-dark-500">{m.monthName}</p>
                      <p className="text-sm font-semibold text-dark-800">{fmtMoney(m.total)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 mt-4">
                  <span className="text-sm font-medium text-dark-700">Total Annual Salary Expense</span>
                  <span className="text-lg font-bold text-emerald-600">{fmtMoney(yearly.annualTotal)}</span>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-dark-100"><h2 className="font-semibold text-dark-800 text-sm">Salary Payment Records</h2></div>
                {yearly.records.length === 0 ? (
                  <div className="p-10 text-center text-dark-400 text-sm">No paid salary records for {yearly.year}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                          <th className="px-5 py-3 font-medium">Staff Name</th>
                          <th className="px-3 py-3 font-medium">Employee ID</th>
                          <th className="px-3 py-3 font-medium">Designation</th>
                          <th className="px-3 py-3 font-medium">Month</th>
                          <th className="px-3 py-3 font-medium text-right">Amount</th>
                          <th className="px-3 py-3 font-medium">Payment Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-50">
                        {yearly.records.map((r) => (
                          <tr key={r._id} className="hover:bg-dark-50/50">
                            <td className="px-5 py-3 font-medium text-dark-800">{r.staffName}</td>
                            <td className="px-3 py-3 text-dark-600">{r.employeeId || '—'}</td>
                            <td className="px-3 py-3 text-dark-600">{r.designation || '—'}</td>
                            <td className="px-3 py-3 text-dark-600">{MONTHS[r.paymentMonth - 1]} {r.paymentYear}</td>
                            <td className="px-3 py-3 text-right font-medium text-dark-800">{fmtMoney(r.salaryAmount)}</td>
                            <td className="px-3 py-3 text-dark-500 text-xs">{fmtDate(r.paymentDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Confirm payment dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirmPay}
        loading={paying}
        title="Confirm Salary Payment"
        message={confirm ? `Mark ${confirm.staffName}'s salary (${fmtMoney(confirm.salaryAmount)}) for ${MONTHS[month - 1]} ${year} as paid?` : ''}
      />
    </div>
  );
}
