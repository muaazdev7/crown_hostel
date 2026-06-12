import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Download, Loader2, Wallet, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '../../components/common/Select';
import { getBillYearlyReport } from '../../api';
import { MONTHS, typeLabel, fmtMoney } from './billConstants';

const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

export default function YearlyReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBillYearlyReport({ year });
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!data) return;
    const lines = [['Category', 'Total', 'Bills']];
    data.categoryBreakdown.forEach((c) => lines.push([typeLabel(c.billType), c.total, c.count]));
    lines.push([]);
    lines.push(['Month', 'Total']);
    data.monthlyBreakdown.forEach((m) => lines.push([MONTHS[m.month - 1], m.total]));
    const csv = lines.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `yearly-expense-report-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const maxMonth = data ? Math.max(...data.monthlyBreakdown.map((m) => m.total), 1) : 1;
  const maxCat = data ? Math.max(...data.categoryBreakdown.map((c) => c.total), 1) : 1;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-purple-500" /> Yearly Expense Report</h1>
          <p className="page-subtitle">Annual trends and category analysis</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <button onClick={exportCSV} className="btn btn-secondary" disabled={loading || !data}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
              <div><p className="text-xs text-dark-400">Total Annual Expenses</p><p className="text-xl font-bold text-dark-900">{fmtMoney(data.totalAnnualExpenses)}</p></div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle className="w-5 h-5" /></div>
              <div><p className="text-xs text-dark-400">Paid Amount</p><p className="text-xl font-bold text-emerald-600">{fmtMoney(data.paidAmount)}</p></div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
              <div><p className="text-xs text-dark-400">Outstanding</p><p className="text-xl font-bold text-amber-600">{fmtMoney(data.outstandingAmount)}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Monthly trend */}
            <div className="card p-5">
              <h2 className="font-semibold text-dark-800 mb-4">Monthly Expense Trend</h2>
              <div className="space-y-2">
                {data.monthlyBreakdown.map((m) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-dark-500 w-9">{MONTHS[m.month - 1]}</span>
                    <div className="flex-1 h-3 bg-dark-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(m.total / maxMonth) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-dark-700 w-24 text-right">{fmtMoney(m.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card p-5">
              <h2 className="font-semibold text-dark-800 mb-4">Category Breakdown</h2>
              {data.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-8">No expenses recorded for {year}</p>
              ) : (
                <div className="space-y-3">
                  {data.categoryBreakdown.map((c) => (
                    <div key={c.billType}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-dark-600">{typeLabel(c.billType)} <span className="text-dark-400">({c.count})</span></span>
                        <span className="font-medium text-dark-800">{fmtMoney(c.total)}</span>
                      </div>
                      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-500 rounded-full" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Most expensive categories */}
          <div className="card p-5">
            <h2 className="font-semibold text-dark-800 mb-4">Most Expensive Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.mostExpensiveCategories.length === 0 ? (
                <p className="text-sm text-dark-400">No data</p>
              ) : data.mostExpensiveCategories.map((c, i) => (
                <div key={c.billType} className="rounded-xl border border-dark-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark-400">#{i + 1}</span>
                    <span className="text-[10px] bg-dark-100 text-dark-500 px-2 py-0.5 rounded-full">{c.count} bills</span>
                  </div>
                  <p className="font-semibold text-dark-800 mt-1">{typeLabel(c.billType)}</p>
                  <p className="text-lg font-bold text-primary-600">{fmtMoney(c.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
