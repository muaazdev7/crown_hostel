import { useState, useEffect } from 'react';
import { CalendarDays, CalendarRange, Loader2, RefreshCw, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getMonthlyInventoryExpense, getYearlyInventoryExpense,
  deleteMonthlyInventoryReport, deleteYearlyInventoryReport,
} from '../../api';

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function InventoryExpenseReports() {
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Details modal: { kind: 'month'|'year', report }
  const [detail, setDetail] = useState(null);
  // Delete confirm: { kind, report }
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const [m, y] = await Promise.all([getMonthlyInventoryExpense(), getYearlyInventoryExpense()]);
      setMonthly(m.data.data || []);
      setYearly(y.data.data || []);
    } catch (err) {
      setError(true);
      toast.error(err.response?.data?.message || 'Failed to load expense reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.kind === 'month') {
        await deleteMonthlyInventoryReport(confirm.report.year, confirm.report.month);
      } else {
        await deleteYearlyInventoryReport(confirm.report.year);
      }
      toast.success('Report deleted');
      setConfirm(null);
      await load(); // refresh from DB so it doesn't reappear
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }
  if (error) {
    return (
      <div className="card p-12 text-center text-dark-400">
        <p className="font-medium mb-3">Couldn't load expense reports</p>
        <button onClick={load} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> Retry</button>
      </div>
    );
  }

  const ReportCard = ({ kind, period, sub, total, onView, onDelete }) => (
    <div className="rounded-xl border border-dark-100 p-4 hover:shadow-md transition-shadow flex flex-col">
      <p className="text-sm font-semibold text-dark-800">{period}</p>
      <p className="text-[11px] text-dark-400 mb-2">{sub}</p>
      <p className="text-xs text-dark-400">Total Inventory Expense</p>
      <p className="text-lg font-bold text-emerald-600 mb-3">{fmtMoney(total)}</p>
      <div className="flex gap-2 mt-auto">
        <button onClick={onView} className="btn btn-secondary text-xs py-1.5 flex-1"><Eye className="w-3.5 h-3.5" /> View Details</button>
        <button onClick={onDelete} className="btn btn-secondary text-xs py-1.5 px-3 text-red-600" title="Delete report"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );

  const ItemsTable = ({ items, showSupplier }) => (
    <div className="overflow-x-auto rounded-lg border border-dark-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-dark-400 bg-dark-50">
            <th className="px-3 py-2 font-medium">Item Name</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium text-right">Quantity</th>
            <th className="px-3 py-2 font-medium text-right">Purchase Price</th>
            <th className="px-3 py-2 font-medium text-right">Total Cost</th>
            <th className="px-3 py-2 font-medium">Date Added</th>
            {showSupplier && <th className="px-3 py-2 font-medium">Supplier</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-50">
          {items.length === 0 ? (
            <tr><td colSpan={showSupplier ? 7 : 6} className="px-3 py-3 text-center text-dark-400">No inventory records</td></tr>
          ) : items.map((it, i) => (
            <tr key={i}>
              <td className="px-3 py-2 text-dark-700">{it.itemName}</td>
              <td className="px-3 py-2 text-dark-500 capitalize">{it.category || '—'}</td>
              <td className="px-3 py-2 text-right text-dark-600">{it.quantity}</td>
              <td className="px-3 py-2 text-right text-dark-600">{fmtMoney(it.purchasePrice)}</td>
              <td className="px-3 py-2 text-right font-medium text-dark-800">{fmtMoney(it.totalCost)}</td>
              <td className="px-3 py-2 text-dark-500 text-xs">{fmtDate(it.dateAdded)}</td>
              {showSupplier && <td className="px-3 py-2 text-dark-500">{it.supplier || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={load} className="btn btn-secondary text-xs"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {/* Monthly Reports */}
      <div className="card p-5">
        <h2 className="font-semibold text-dark-800 flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-primary-500" /> Monthly Expense Reports
        </h2>
        {monthly.length === 0 ? (
          <div className="py-10 text-center text-dark-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No inventory expense data yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {monthly.map((r) => (
              <ReportCard
                key={`${r.year}-${r.month}`}
                period={`${r.monthName} ${r.year}`}
                sub={`${fmtDate(r.monthStart)} — ${fmtDate(r.monthEnd)}`}
                total={r.totalExpense}
                onView={() => setDetail({ kind: 'month', report: r })}
                onDelete={() => setConfirm({ kind: 'month', report: r })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Yearly Reports */}
      <div className="card p-5">
        <h2 className="font-semibold text-dark-800 flex items-center gap-2 mb-4">
          <CalendarRange className="w-4 h-4 text-primary-500" /> Yearly Expense Reports
        </h2>
        {yearly.length === 0 ? (
          <div className="py-10 text-center text-dark-400">
            <CalendarRange className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No inventory expense data yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {yearly.map((r) => (
              <ReportCard
                key={r.year}
                period={String(r.year)}
                sub={`${fmtDate(r.yearStart)} — ${fmtDate(r.yearEnd)}`}
                total={r.totalExpense}
                onView={() => setDetail({ kind: 'year', report: r })}
                onDelete={() => setConfirm({ kind: 'year', report: r })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? (detail.kind === 'month' ? `${detail.report.monthName} ${detail.report.year} — Report Details` : `${detail.report.year} — Report Details`) : ''}
        size="lg"
      >
        {detail && detail.kind === 'month' && (
          <div className="space-y-4">
            <ItemsTable items={detail.report.items} showSupplier />
            <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-dark-700">Monthly Total</span>
              <span className="text-lg font-bold text-emerald-600">{fmtMoney(detail.report.totalExpense)}</span>
            </div>
          </div>
        )}
        {detail && detail.kind === 'year' && (
          <div className="space-y-5">
            {/* A. Month-by-month breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-dark-800 mb-2">Month-by-Month Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {detail.report.monthlyBreakdown.length === 0 ? (
                  <p className="text-sm text-dark-400">No monthly data</p>
                ) : detail.report.monthlyBreakdown.map((m) => (
                  <div key={m.month} className="rounded-lg border border-dark-100 px-3 py-2">
                    <p className="text-xs text-dark-500">{m.monthName} {detail.report.year}</p>
                    <p className="text-sm font-semibold text-dark-800">{fmtMoney(m.totalExpense)}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* B. Detailed inventory records */}
            <div>
              <h3 className="text-sm font-semibold text-dark-800 mb-2">Inventory Records</h3>
              <ItemsTable items={detail.report.items} />
            </div>
            <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-dark-700">Yearly Total</span>
              <span className="text-lg font-bold text-emerald-600">{fmtMoney(detail.report.totalExpense)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Report"
        message="Are you sure you want to delete this report?"
      />
    </div>
  );
}
