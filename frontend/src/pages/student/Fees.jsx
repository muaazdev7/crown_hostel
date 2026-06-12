import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Receipt, Clock, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, DollarSign, FileText,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { getInvoices, getPayments, getFeeStructures } from '../../api';
import toast from 'react-hot-toast';

export default function Fees() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [showStructure, setShowStructure] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, payRes, fsRes] = await Promise.all([
        getInvoices({ limit: 50 }),
        getPayments({ limit: 50 }),
        getFeeStructures(),
      ]);
      setInvoices(invRes.data.data);
      setPayments(payRes.data.data);
      setFeeStructures(fsRes.data.data);
    } catch {
      toast.error('Failed to load fee data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalOutstanding = invoices.reduce(
    (s, i) => s + (i.totalAmount + (i.fine || 0) - (i.discount || 0) - (i.paidAmount || 0)),
    0
  );
  const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);

  const formatPkr = (n) => `Rs ${(n || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-48 bg-dark-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-dark-50" />)}
        </div>
        <div className="card h-40 animate-pulse bg-dark-50" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">View invoices, payments, and fee structure</p>
        </div>
        <Button onClick={() => setShowStructure(true)} icon={FileText} variant="outline">Fee Structure</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Outstanding', value: formatPkr(totalOutstanding), icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
          { label: 'Total Paid', value: formatPkr(totalPaid), icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Invoices', value: invoices.length, icon: Receipt, color: 'bg-primary-50 text-primary-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900">{value}</p>
              <p className="text-sm text-dark-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="px-5 py-4 border-b border-dark-100">
          <h3 className="font-semibold text-dark-800">Invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No invoices found</p>
            <p className="text-dark-400 text-sm mt-1">Your invoices will appear here once generated.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-50">
            {invoices.map(inv => {
              const outstanding = inv.totalAmount + (inv.fine || 0) - (inv.discount || 0) - (inv.paidAmount || 0);
              const expanded = expandedInvoice === inv._id;
              return (
                <div key={inv._id} className="hover:bg-dark-50/30 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedInvoice(expanded ? null : inv._id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600'
                        : inv.status === 'overdue' ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {inv.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark-800">{inv.invoiceNumber}</p>
                        <Badge status={inv.status} />
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{inv.description || inv.feeStructure?.name || 'Invoice'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-dark-900">{formatPkr(inv.totalAmount)}</p>
                      {outstanding > 0 && (
                        <p className="text-xs text-amber-600 font-medium">Due: {formatPkr(outstanding)}</p>
                      )}
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 animate-fade-in">
                      <div className="bg-dark-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-dark-400">Total Amount</p>
                          <p className="font-medium text-dark-800">{formatPkr(inv.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Discount</p>
                          <p className="font-medium text-emerald-600">- {formatPkr(inv.discount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Late Fine</p>
                          <p className="font-medium text-red-600">+ {formatPkr(inv.fine)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Paid</p>
                          <p className="font-medium text-dark-800">{formatPkr(inv.paidAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Outstanding</p>
                          <p className="font-bold text-dark-900">{formatPkr(outstanding)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Due Date</p>
                          <p className="font-medium text-dark-800">
                            {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {inv.academicYear && (
                          <div>
                            <p className="text-xs text-dark-400">Academic Year</p>
                            <p className="font-medium text-dark-800">{inv.academicYear}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="px-5 py-4 border-b border-dark-100">
          <h3 className="font-semibold text-dark-800">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No payments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-50">
            {payments.map(pay => (
              <div key={pay._id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-800">{pay.receiptNumber}</p>
                  <p className="text-xs text-dark-400">
                    {pay.invoice?.description || pay.invoice?.invoiceNumber || 'Payment'} — {(pay.method || '').toUpperCase()}
                  </p>
                  <p className="text-xs text-dark-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">{formatPkr(pay.amountPaid)}</p>
                  {pay.transactionId && (
                    <p className="text-xs text-dark-400">TXN: {pay.transactionId.length > 12 ? pay.transactionId.slice(0, 12) + '...' : pay.transactionId}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee Structure Modal */}
      <Modal isOpen={showStructure} onClose={() => setShowStructure(false)} title="Fee Structure" size="lg">
        {feeStructures.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-dark-500">No fee structures available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feeStructures.map(fs => {
              const additionalTotal = Object.values(fs.additionalCharges || {}).reduce((s, v) => s + (Number(v) || 0), 0);
              const componentsTotal = (fs.components || []).reduce((s, c) => s + c.amount, 0);
              const grandTotal = fs.baseFee + (fs.securityDeposit || 0) + componentsTotal + additionalTotal;
              return (
                <div key={fs._id} className="bg-dark-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-dark-800">{fs.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full capitalize">{fs.type}</span>
                      <span className="text-xs bg-dark-100 text-dark-600 px-2 py-0.5 rounded-full">{fs.academicYear}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-600">Base Fee</span>
                      <span className="font-medium text-dark-800">{formatPkr(fs.baseFee)}</span>
                    </div>
                    {fs.securityDeposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-dark-600">Security Deposit</span>
                        <span className="font-medium text-dark-800">{formatPkr(fs.securityDeposit)}</span>
                      </div>
                    )}
                    {(fs.components || []).map(c => (
                      <div key={c.name} className="flex justify-between">
                        <span className="text-dark-600">{c.name}</span>
                        <span className="font-medium text-dark-800">{formatPkr(c.amount)}</span>
                      </div>
                    ))}
                    {Object.entries(fs.additionalCharges || {}).filter(([, v]) => Number(v) > 0).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-dark-600 capitalize">{key}</span>
                        <span className="font-medium text-dark-800">{formatPkr(val)}</span>
                      </div>
                    ))}
                    <div className="border-t border-dark-200 pt-2 mt-2 flex justify-between font-bold">
                      <span className="text-dark-800">Total</span>
                      <span className="text-dark-900">{formatPkr(grandTotal)}</span>
                    </div>
                    {fs.lateFineRules && fs.lateFineRules.finePerDay > 0 && (
                      <p className="text-xs text-dark-400 mt-1">
                        Late fine: Rs {fs.lateFineRules.finePerDay}/day after {fs.lateFineRules.gracePeriodDays || 0} day grace period
                        {fs.lateFineRules.maxFine > 0 ? ` (max Rs ${fs.lateFineRules.maxFine})` : ''}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
