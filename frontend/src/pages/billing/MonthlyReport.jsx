import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '../../components/common/Select';
import { getBillMonthlyReport } from '../../api';
import { MONTHS, typeLabel, fmtMoney } from './billConstants';

const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
// Categories highlighted in the report per the spec
const REPORT_TYPES = ['electricity', 'internet', 'water', 'gas', 'maintenance_services', 'security_services'];

export default function MonthlyReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBillMonthlyReport({ year });
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const months = data?.months || [];

  const exportCSV = () => {
    const header = ['Month', ...REPORT_TYPES.map(typeLabel), 'Monthly Total', 'Paid', 'Outstanding'];
    const rows = months.map((m) => [
      MONTHS[m.month - 1],
      ...REPORT_TYPES.map((t) => m.categories[t] || 0),
      m.total, m.paid, m.outstanding,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `monthly-expense-report-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const yearTotal = months.reduce((s, m) => s + m.total, 0);
  const yearPaid = months.reduce((s, m) => s + m.paid, 0);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-500" /> Monthly Expense Report</h1>
          <p className="page-subtitle">Category-wise monthly breakdown of operational bills</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <button onClick={exportCSV} className="btn btn-secondary" disabled={loading || !months.length}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4"><p className="text-xs text-dark-400">Annual Total ({year})</p><p className="text-xl font-bold text-dark-900">{fmtMoney(yearTotal)}</p></div>
            <div className="card p-4"><p className="text-xs text-dark-400">Paid</p><p className="text-xl font-bold text-emerald-600">{fmtMoney(yearPaid)}</p></div>
            <div className="card p-4"><p className="text-xs text-dark-400">Outstanding</p><p className="text-xl font-bold text-amber-600">{fmtMoney(yearTotal - yearPaid)}</p></div>
          </div>

          {/* Table */}
          <div className="card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                  <th className="px-3 py-3 font-medium">Month</th>
                  {REPORT_TYPES.map((t) => <th key={t} className="px-3 py-3 font-medium text-right">{typeLabel(t)}</th>)}
                  <th className="px-3 py-3 font-medium text-right">Total</th>
                  <th className="px-3 py-3 font-medium text-right">Paid</th>
                  <th className="px-3 py-3 font-medium text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {months.map((m) => (
                  <tr key={m.month} className={`hover:bg-dark-50/50 ${m.total === 0 ? 'text-dark-300' : ''}`}>
                    <td className="px-3 py-2.5 font-medium text-dark-700">{MONTHS[m.month - 1]}</td>
                    {REPORT_TYPES.map((t) => <td key={t} className="px-3 py-2.5 text-right text-dark-600">{m.categories[t] ? fmtMoney(m.categories[t]) : '—'}</td>)}
                    <td className="px-3 py-2.5 text-right font-semibold text-dark-800">{fmtMoney(m.total)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600">{fmtMoney(m.paid)}</td>
                    <td className="px-3 py-2.5 text-right text-amber-600">{fmtMoney(m.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
