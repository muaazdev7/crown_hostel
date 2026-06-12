import { useState, useEffect, useCallback } from 'react';
import {
  Plus, CreditCard, FileText, Receipt, Edit2, Trash2,
  BarChart3, AlertTriangle, TrendingUp, DollarSign, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatsCard from '../../components/common/StatsCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getPayments, recordPayment, applyLateFines,
  getFeeSummary, getPendingDues,
  getStudents,
} from '../../api';

const ROOM_TYPES = ['single', 'double', 'triple', 'dormitory'];
const FEE_TYPES = ['monthly', 'semester', 'yearly'];
const PAYMENT_MODES = ['cash', 'online', 'cheque'];
const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [`${CURRENT_YEAR}-${CURRENT_YEAR + 1}`, `${CURRENT_YEAR - 1}-${CURRENT_YEAR}`];

const EMPTY_STRUCTURE = {
  name: '', type: 'monthly', roomType: '', baseFee: '', securityDeposit: '',
  finePerDay: '', gracePeriodDays: '', maxFine: '',
  mess: '', electricity: '', damages: '',
  academicYear: ACADEMIC_YEARS[0],
};
const EMPTY_INVOICE = { studentId: '', feeStructureId: '', totalAmount: '', discount: '', dueDate: '', description: '', academicYear: ACADEMIC_YEARS[0] };
const EMPTY_PAYMENT = { amount: '', paymentMode: 'cash', transactionId: '', remarks: '' };

export default function ManageFees() {
  const [tab, setTab] = useState('structures');

  // Fee Structures
  const [structures, setStructures] = useState([]);
  const [structLoading, setStructLoading] = useState(false);
  const [showStructForm, setShowStructForm] = useState(false);
  const [editingStruct, setEditingStruct] = useState(null);
  const [structForm, setStructForm] = useState(EMPTY_STRUCTURE);
  const [confirmStruct, setConfirmStruct] = useState({ open: false, id: null });
  const [deletingStruct, setDeletingStruct] = useState(false);

  // Invoices
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePages, setInvoicePages] = useState(1);
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState('');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE);
  const [confirmInvoice, setConfirmInvoice] = useState({ open: false, id: null });
  const [deletingInvoice, setDeletingInvoice] = useState(false);

  // Record Payment
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);

  // Payments
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPages, setPaymentPages] = useState(1);

  // Reports
  const [reportData, setReportData] = useState(null);
  const [pendingDues, setPendingDues] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Shared
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [applyingFines, setApplyingFines] = useState(false);

  // ── Fetchers ──

  const fetchStructures = useCallback(async () => {
    setStructLoading(true);
    try {
      const res = await getFeeStructures();
      setStructures(res.data.data);
    } catch { toast.error('Failed to load fee structures'); }
    finally { setStructLoading(false); }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setInvoiceLoading(true);
    try {
      const params = { page: invoicePage, limit: 15 };
      if (filterInvoiceStatus) params.status = filterInvoiceStatus;
      const res = await getInvoices(params);
      setInvoices(res.data.data);
      setInvoicePages(res.data.pages);
    } catch { toast.error('Failed to load invoices'); }
    finally { setInvoiceLoading(false); }
  }, [invoicePage, filterInvoiceStatus]);

  const fetchPayments = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const res = await getPayments({ page: paymentPage, limit: 15 });
      setPayments(res.data.data);
      setPaymentPages(res.data.pages);
    } catch { toast.error('Failed to load payments'); }
    finally { setPaymentLoading(false); }
  }, [paymentPage]);

  const fetchReports = useCallback(async () => {
    setReportLoading(true);
    try {
      const [summaryRes, duesRes] = await Promise.all([getFeeSummary(), getPendingDues()]);
      setReportData(summaryRes.data.data);
      setPendingDues(duesRes.data.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setReportLoading(false); }
  }, []);

  useEffect(() => { fetchStructures(); }, [fetchStructures]);
  useEffect(() => { if (tab === 'invoices') fetchInvoices(); }, [fetchInvoices, tab]);
  useEffect(() => { if (tab === 'payments') fetchPayments(); }, [fetchPayments, tab]);
  useEffect(() => { if (tab === 'reports') fetchReports(); }, [fetchReports, tab]);

  useEffect(() => {
    if (tab !== 'invoices') return;
    getStudents({ limit: 200 }).then(res => setStudents(res.data.data)).catch(() => {});
  }, [tab]);

  // ── Form helpers ──
  const setS = (field) => (e) => setStructForm(f => ({ ...f, [field]: e.target.value }));
  const setI = (field) => (e) => setInvoiceForm(f => ({ ...f, [field]: e.target.value }));
  const setP = (field) => (e) => setPaymentForm(f => ({ ...f, [field]: e.target.value }));

  // ── Fee Structure CRUD ──

  const openAddStructure = () => {
    setEditingStruct(null);
    setStructForm(EMPTY_STRUCTURE);
    setShowStructForm(true);
  };

  const openEditStructure = (s) => {
    setEditingStruct(s);
    setStructForm({
      name: s.name || '',
      type: s.type || 'monthly',
      roomType: s.roomType || '',
      baseFee: String(s.baseFee || ''),
      securityDeposit: String(s.securityDeposit || ''),
      finePerDay: String(s.lateFineRules?.finePerDay || ''),
      gracePeriodDays: String(s.lateFineRules?.gracePeriodDays || ''),
      maxFine: String(s.lateFineRules?.maxFine || ''),
      mess: String(s.additionalCharges?.mess || ''),
      electricity: String(s.additionalCharges?.electricity || ''),
      damages: String(s.additionalCharges?.damages || ''),
      academicYear: s.academicYear || ACADEMIC_YEARS[0],
    });
    setShowStructForm(true);
  };

  const handleStructSubmit = async (e) => {
    e.preventDefault();
    if (!structForm.name || !structForm.baseFee || !structForm.academicYear) {
      return toast.error('Name, base fee and academic year are required');
    }
    setSaving(true);
    try {
      const payload = {
        name: structForm.name,
        type: structForm.type,
        roomType: structForm.roomType || undefined,
        baseFee: Number(structForm.baseFee),
        securityDeposit: Number(structForm.securityDeposit) || 0,
        lateFineRules: {
          finePerDay: Number(structForm.finePerDay) || 0,
          gracePeriodDays: Number(structForm.gracePeriodDays) || 0,
          maxFine: Number(structForm.maxFine) || 0,
        },
        additionalCharges: {
          mess: Number(structForm.mess) || 0,
          electricity: Number(structForm.electricity) || 0,
          damages: Number(structForm.damages) || 0,
        },
        academicYear: structForm.academicYear,
      };
      if (editingStruct) {
        await updateFeeStructure(editingStruct._id, payload);
        toast.success('Fee structure updated');
      } else {
        await createFeeStructure(payload);
        toast.success('Fee structure created');
      }
      setShowStructForm(false);
      setEditingStruct(null);
      fetchStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDeleteStructure = async () => {
    setDeletingStruct(true);
    try {
      await deleteFeeStructure(confirmStruct.id);
      toast.success('Fee structure deleted');
      setConfirmStruct({ open: false, id: null });
      fetchStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeletingStruct(false); }
  };

  // ── Invoice CRUD ──

  const openAddInvoice = () => {
    setEditingInvoice(null);
    setInvoiceForm(EMPTY_INVOICE);
    setShowInvoiceForm(true);
  };

  const openEditInvoice = (inv) => {
    setEditingInvoice(inv);
    setInvoiceForm({
      studentId: inv.student?._id || '',
      feeStructureId: inv.feeStructure?._id || '',
      totalAmount: String(inv.totalAmount || ''),
      discount: String(inv.discount || ''),
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
      description: inv.description || '',
      academicYear: inv.academicYear || ACADEMIC_YEARS[0],
    });
    setShowInvoiceForm(true);
  };

  // Auto-fill amount when fee structure is selected
  const handleFeeStructureSelect = (e) => {
    const fsId = e.target.value;
    setInvoiceForm(f => ({ ...f, feeStructureId: fsId }));
    if (fsId) {
      const fs = structures.find(s => s._id === fsId);
      if (fs) {
        const additionalTotal = Object.values(fs.additionalCharges || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
        const componentsTotal = (fs.components || []).reduce((sum, c) => sum + c.amount, 0);
        const total = fs.baseFee + (fs.securityDeposit || 0) + componentsTotal + additionalTotal;
        setInvoiceForm(f => ({ ...f, totalAmount: String(total) }));
      }
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (editingInvoice) {
      // Update only discount, due date, description
      setSaving(true);
      try {
        await updateInvoice(editingInvoice._id, {
          discount: Number(invoiceForm.discount) || 0,
          dueDate: invoiceForm.dueDate,
          description: invoiceForm.description,
        });
        toast.success('Invoice updated');
        setShowInvoiceForm(false);
        setEditingInvoice(null);
        fetchInvoices();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Update failed');
      } finally { setSaving(false); }
      return;
    }

    if (!invoiceForm.studentId || !invoiceForm.dueDate) {
      return toast.error('Student and due date are required');
    }
    if (!invoiceForm.totalAmount && !invoiceForm.feeStructureId) {
      return toast.error('Select a fee structure or enter an amount');
    }
    setSaving(true);
    try {
      await createInvoice({
        studentId: invoiceForm.studentId,
        feeStructureId: invoiceForm.feeStructureId || undefined,
        totalAmount: Number(invoiceForm.totalAmount) || undefined,
        discount: Number(invoiceForm.discount) || 0,
        dueDate: invoiceForm.dueDate,
        description: invoiceForm.description,
        academicYear: invoiceForm.academicYear,
      });
      toast.success('Invoice generated');
      setShowInvoiceForm(false);
      setInvoiceForm(EMPTY_INVOICE);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally { setSaving(false); }
  };

  const handleDeleteInvoice = async () => {
    setDeletingInvoice(true);
    try {
      await deleteInvoice(confirmInvoice.id);
      toast.success('Invoice deleted');
      setConfirmInvoice({ open: false, id: null });
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeletingInvoice(false); }
  };

  // ── Record Payment ──

  const openRecordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    const outstanding = invoice.totalAmount + (invoice.fine || 0) - (invoice.discount || 0) - (invoice.paidAmount || 0);
    setPaymentForm({ ...EMPTY_PAYMENT, amount: String(outstanding) });
    setShowRecordPayment(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.paymentMode) {
      return toast.error('Amount and payment mode are required');
    }
    setSaving(true);
    try {
      await recordPayment({
        invoiceId: selectedInvoice._id,
        studentId: selectedInvoice.student?._id,
        amount: Number(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        transactionId: paymentForm.transactionId,
        remarks: paymentForm.remarks,
      });
      toast.success('Payment recorded');
      setShowRecordPayment(false);
      setPaymentForm(EMPTY_PAYMENT);
      fetchInvoices();
      if (tab === 'payments') fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  // ── Apply Late Fines ──
  const handleApplyLateFines = async () => {
    setApplyingFines(true);
    try {
      const res = await applyLateFines();
      toast.success(res.data.message);
      fetchInvoices();
      if (tab === 'reports') fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply late fines');
    } finally { setApplyingFines(false); }
  };

  // ── Computed ──
  const invoiceStatusStyle = {
    pending: 'bg-amber-50 text-amber-700',
    partial: 'bg-blue-50 text-blue-700',
    paid: 'bg-emerald-50 text-emerald-700',
    overdue: 'bg-red-50 text-red-700',
  };

  const formatPkr = (n) => `Pkr ${(n || 0).toLocaleString()}`;

  // ── Column Definitions ──

  const structureColumns = [
    { key: 'name', label: 'Name', render: r => <span className="font-medium text-dark-800">{r.name}</span> },
    { key: 'type', label: 'Type', render: r => <span className="capitalize">{r.type}</span> },
    { key: 'roomType', label: 'Room Type', render: r => <span className="capitalize">{r.roomType || '—'}</span> },
    { key: 'baseFee', label: 'Base Fee', render: r => <span className="font-semibold text-dark-900">{formatPkr(r.baseFee)}</span> },
    { key: 'securityDeposit', label: 'Security', render: r => formatPkr(r.securityDeposit) },
    {
      key: 'additionalCharges', label: 'Additional',
      render: r => {
        const total = Object.values(r.additionalCharges || {}).reduce((s, v) => s + (Number(v) || 0), 0);
        return total > 0 ? formatPkr(total) : '—';
      },
    },
    { key: 'academicYear', label: 'Year' },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditStructure(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmStruct({ open: true, id: r._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const invoiceColumns = [
    {
      key: 'invoiceNumber', label: 'Invoice',
      render: r => (
        <div>
          <p className="font-medium text-dark-800">{r.invoiceNumber}</p>
          <p className="text-xs text-dark-400">{r.student?.user?.name}</p>
        </div>
      ),
    },
    { key: 'feeStructure', label: 'Structure', render: r => r.feeStructure?.name || r.description || '—' },
    { key: 'totalAmount', label: 'Total', render: r => formatPkr(r.totalAmount) },
    { key: 'discount', label: 'Discount', render: r => r.discount > 0 ? <span className="text-emerald-600">-{formatPkr(r.discount)}</span> : '—' },
    { key: 'fine', label: 'Fine', render: r => r.fine > 0 ? <span className="text-red-600">+{formatPkr(r.fine)}</span> : '—' },
    {
      key: 'paidAmount', label: 'Paid',
      render: r => <span className="text-emerald-700 font-medium">{formatPkr(r.paidAmount)}</span>,
    },
    { key: 'dueDate', label: 'Due Date', render: r => new Date(r.dueDate).toLocaleDateString('en-IN') },
    {
      key: 'status', label: 'Status',
      render: r => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${invoiceStatusStyle[r.status] || 'bg-dark-100 text-dark-600'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openRecordPayment(r)}
            disabled={r.status === 'paid'}
            className="px-2.5 py-1 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Pay
          </button>
          <button onClick={() => openEditInvoice(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmInvoice({ open: true, id: r._id })}
            disabled={r.paidAmount > 0}
            className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title={r.paidAmount > 0 ? 'Cannot delete invoice with payments' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const paymentColumns = [
    {
      key: 'receiptNumber', label: 'Receipt',
      render: r => (
        <div>
          <p className="font-medium text-dark-800">{r.receiptNumber}</p>
          <p className="text-xs text-dark-400">{r.student?.user?.name}</p>
        </div>
      ),
    },
    { key: 'invoice', label: 'Invoice', render: r => r.invoice?.invoiceNumber || '—' },
    { key: 'amountPaid', label: 'Amount', render: r => <span className="font-semibold text-emerald-700">{formatPkr(r.amountPaid)}</span> },
    { key: 'method', label: 'Mode', render: r => <span className="uppercase text-xs font-medium">{r.method}</span> },
    { key: 'transactionId', label: 'Transaction ID', render: r => r.transactionId || '—' },
    { key: 'remarks', label: 'Remarks', render: r => r.remarks || '—' },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  const TABS = [
    { id: 'structures', label: 'Fee Structures', icon: CreditCard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  // ── Render ──

  return (
    <div className="animate-fade-in space-y-4">
      {/* Banner */}
      

      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">Manage fee structures, invoices, payments and reports</p>
        </div>
        <div className="flex gap-2">
          {tab === 'structures' && <Button icon={Plus} onClick={openAddStructure}>Add Structure</Button>}
          {tab === 'invoices' && (
            <>
              <Button variant="outline" onClick={handleApplyLateFines} loading={applyingFines} icon={AlertTriangle}>Apply Late Fines</Button>
              <Button icon={Plus} onClick={openAddInvoice}>Generate Invoice</Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dark-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-dark-500 hover:text-dark-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Fee Structures Tab ── */}
      {tab === 'structures' && (
        <div className="card p-4">
          <Table columns={structureColumns} data={structures} loading={structLoading} emptyTitle="No fee structures" emptyDesc="Create your first fee structure" page={1} pages={1} onPageChange={() => {}} />
        </div>
      )}

      {/* ── Invoices Tab ── */}
      {tab === 'invoices' && (
        <>
          <div className="card p-4 flex flex-wrap gap-3">
            <Select value={filterInvoiceStatus} onChange={e => { setFilterInvoiceStatus(e.target.value); setInvoicePage(1); }} className="w-36">
              <option value="">All Status</option>
              {['pending', 'partial', 'paid', 'overdue'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </Select>
          </div>
          <div className="card p-4">
            <Table columns={invoiceColumns} data={invoices} loading={invoiceLoading} emptyTitle="No invoices found" emptyDesc="Generate an invoice to get started" page={invoicePage} pages={invoicePages} onPageChange={setInvoicePage} />
          </div>
        </>
      )}

      {/* ── Payments Tab ── */}
      {tab === 'payments' && (
        <div className="card p-4">
          <Table columns={paymentColumns} data={payments} loading={paymentLoading} emptyTitle="No payments recorded" emptyDesc="Payments will appear here once recorded" page={paymentPage} pages={paymentPages} onPageChange={setPaymentPage} />
        </div>
      )}

      {/* ── Reports Tab ── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {reportLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-dark-50" />)}
            </div>
          ) : reportData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard label="Total Billed" value={formatPkr(reportData.summary.totalBilled)} icon={FileText} color="primary" />
                <StatsCard label="Total Collected" value={formatPkr(reportData.summary.totalPaid)} icon={DollarSign} color="emerald" />
                <StatsCard label="Outstanding" value={formatPkr(reportData.summary.totalOutstanding)} icon={AlertTriangle} color="amber" />
                <StatsCard label="Fine Collected" value={formatPkr(reportData.summary.totalFine)} icon={Clock} color="red" />
              </div>

              {/* Status Breakdown */}
              <div className="card p-5">
                <h3 className="font-semibold text-dark-800 mb-3">Invoice Status Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Pending', count: reportData.summary.pendingCount, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Paid', count: reportData.summary.paidCount, color: 'text-emerald-600 bg-emerald-50' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
                      <p className="text-2xl font-bold">{s.count}</p>
                      <p className="text-sm font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Breakdown */}
              {reportData.paymentByMethod?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-dark-800 mb-3">Collection by Payment Method</h3>
                  <div className="space-y-2">
                    {reportData.paymentByMethod.map(pm => {
                      const pct = reportData.summary.totalPaid > 0 ? (pm.totalAmount / reportData.summary.totalPaid * 100) : 0;
                      return (
                        <div key={pm._id} className="flex items-center gap-3">
                          <span className="w-16 text-sm font-medium text-dark-600 uppercase">{pm._id}</span>
                          <div className="flex-1 bg-dark-100 rounded-full h-4 overflow-hidden">
                            <div className="bg-primary-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-dark-800 w-32 text-right">{formatPkr(pm.totalAmount)} ({pm.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly Trend */}
              {reportData.monthlyTrend?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-dark-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Monthly Collection Trend
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-100">
                          <th className="text-left py-2 text-dark-500 font-medium">Month</th>
                          <th className="text-right py-2 text-dark-500 font-medium">Collected</th>
                          <th className="text-right py-2 text-dark-500 font-medium">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.monthlyTrend.map(m => (
                          <tr key={`${m._id.year}-${m._id.month}`} className="border-b border-dark-50">
                            <td className="py-2 text-dark-800">{new Date(m._id.year, m._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                            <td className="py-2 text-right font-semibold text-emerald-700">{formatPkr(m.totalCollected)}</td>
                            <td className="py-2 text-right text-dark-600">{m.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pending Dues */}
              {pendingDues && pendingDues.dues?.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-dark-800">Pending Dues ({pendingDues.count})</h3>
                    <span className="text-sm font-bold text-red-600">Total: {formatPkr(pendingDues.totalOutstanding)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-100">
                          <th className="text-left py-2 text-dark-500 font-medium">Student</th>
                          <th className="text-left py-2 text-dark-500 font-medium">Invoice</th>
                          <th className="text-right py-2 text-dark-500 font-medium">Total</th>
                          <th className="text-right py-2 text-dark-500 font-medium">Paid</th>
                          <th className="text-right py-2 text-dark-500 font-medium">Outstanding</th>
                          <th className="text-left py-2 text-dark-500 font-medium">Due Date</th>
                          <th className="text-left py-2 text-dark-500 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDues.dues.map(d => (
                          <tr key={d._id} className="border-b border-dark-50">
                            <td className="py-2 text-dark-800 font-medium">{d.studentName}</td>
                            <td className="py-2 text-dark-600">{d.invoiceNumber}</td>
                            <td className="py-2 text-right">{formatPkr(d.totalAmount)}</td>
                            <td className="py-2 text-right text-emerald-600">{formatPkr(d.paidAmount)}</td>
                            <td className="py-2 text-right font-bold text-red-600">{formatPkr(d.outstanding)}</td>
                            <td className="py-2">{new Date(d.dueDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-2"><Badge status={d.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ── Add / Edit Fee Structure Modal ── */}
      <Modal isOpen={showStructForm} onClose={() => { setShowStructForm(false); setEditingStruct(null); }} title={editingStruct ? 'Edit Fee Structure' : 'Add Fee Structure'} size="lg">
        <form onSubmit={handleStructSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Structure Name *" value={structForm.name} onChange={setS('name')} placeholder="e.g. Hostel Fee 2024-25" />
            <Select label="Fee Type *" value={structForm.type} onChange={setS('type')}>
              {FEE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
            <Select label="Room Type" value={structForm.roomType} onChange={setS('roomType')}>
              <option value="">Any</option>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
            <Select label="Academic Year *" value={structForm.academicYear} onChange={setS('academicYear')}>
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Input label="Base Fee (Pkr) *" type="number" value={structForm.baseFee} onChange={setS('baseFee')} placeholder="5000" />
            <Input label="Security Deposit (Pkr)" type="number" value={structForm.securityDeposit} onChange={setS('securityDeposit')} placeholder="0" />
          </div>

          <div className="border-t border-dark-100 pt-3">
            <p className="text-sm font-semibold text-dark-700 mb-2">Additional Charges</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Mess (Pkr)" type="number" value={structForm.mess} onChange={setS('mess')} placeholder="0" />
              <Input label="Electricity (Pkr)" type="number" value={structForm.electricity} onChange={setS('electricity')} placeholder="0" />
              <Input label="Damages (Pkr)" type="number" value={structForm.damages} onChange={setS('damages')} placeholder="0" />
            </div>
          </div>

          <div className="border-t border-dark-100 pt-3">
            <p className="text-sm font-semibold text-dark-700 mb-2">Late Fine Rules</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Fine Per Day (Pkr)" type="number" value={structForm.finePerDay} onChange={setS('finePerDay')} placeholder="0" />
              <Input label="Grace Period (Days)" type="number" value={structForm.gracePeriodDays} onChange={setS('gracePeriodDays')} placeholder="0" />
              <Input label="Max Fine (Pkr)" type="number" value={structForm.maxFine} onChange={setS('maxFine')} placeholder="0" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowStructForm(false); setEditingStruct(null); }}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingStruct ? 'Update' : 'Create'} Structure</Button>
          </div>
        </form>
      </Modal>

      {/* ── Generate / Edit Invoice Modal ── */}
      <Modal isOpen={showInvoiceForm} onClose={() => { setShowInvoiceForm(false); setEditingInvoice(null); }} title={editingInvoice ? 'Edit Invoice' : 'Generate Invoice'} size="md">
        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {!editingInvoice && (
              <>
                <Select label="Student *" value={invoiceForm.studentId} onChange={setI('studentId')} className="col-span-2">
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.user?.name} — {s.rollNumber}</option>)}
                </Select>
                <Select label="Fee Structure" value={invoiceForm.feeStructureId} onChange={handleFeeStructureSelect}>
                  <option value="">None (custom amount)</option>
                  {structures.map(s => <option key={s._id} value={s._id}>{s.name} — {formatPkr(s.baseFee)}</option>)}
                </Select>
                <Input label="Total Amount (Pkr) *" type="number" value={invoiceForm.totalAmount} onChange={setI('totalAmount')} placeholder="Auto or manual" />
              </>
            )}
            <Input label="Discount (Pkr)" type="number" value={invoiceForm.discount} onChange={setI('discount')} placeholder="0" />
            <Input label="Due Date *" type="date" value={invoiceForm.dueDate} onChange={setI('dueDate')} />
            {!editingInvoice && (
              <Select label="Academic Year" value={invoiceForm.academicYear} onChange={setI('academicYear')}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            )}
            <Input label="Description" value={invoiceForm.description} onChange={setI('description')} placeholder="e.g. Hostel fee for Jul–Dec" className="col-span-2" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowInvoiceForm(false); setEditingInvoice(null); }}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingInvoice ? 'Update Invoice' : 'Generate Invoice'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal isOpen={showRecordPayment} onClose={() => setShowRecordPayment(false)} title="Record Payment" size="md">
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-dark-50 rounded-xl text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-dark-500">Invoice</span>
                <span className="font-medium text-dark-800">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">Student</span>
                <span className="font-medium text-dark-800">{selectedInvoice.student?.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">Total Amount</span>
                <span className="font-semibold text-dark-900">{formatPkr(selectedInvoice.totalAmount)}</span>
              </div>
              {selectedInvoice.fine > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-500">Late Fine</span>
                  <span className="text-red-600 font-medium">+{formatPkr(selectedInvoice.fine)}</span>
                </div>
              )}
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-500">Discount</span>
                  <span className="text-emerald-600 font-medium">-{formatPkr(selectedInvoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dark-500">Already Paid</span>
                <span className="text-emerald-600 font-medium">{formatPkr(selectedInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-dark-100 pt-1">
                <span className="text-dark-500 font-semibold">Balance Due</span>
                <span className="text-red-600 font-bold">
                  {formatPkr(selectedInvoice.totalAmount + (selectedInvoice.fine || 0) - (selectedInvoice.discount || 0) - (selectedInvoice.paidAmount || 0))}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount Paying (Pkr) *" type="number" value={paymentForm.amount} onChange={setP('amount')} />
              <Select label="Payment Mode *" value={paymentForm.paymentMode} onChange={setP('paymentMode')}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </Select>
              <Input label="Remarks" value={paymentForm.remarks} onChange={setP('remarks')} placeholder="Optional notes" className="col-span-2" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowRecordPayment(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Record Payment</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete Confirmations ── */}
      <ConfirmDialog isOpen={confirmStruct.open} onClose={() => setConfirmStruct({ open: false, id: null })} onConfirm={handleDeleteStructure} loading={deletingStruct} title="Delete Fee Structure" message="This will permanently delete this fee structure. This action cannot be undone." />
      <ConfirmDialog isOpen={confirmInvoice.open} onClose={() => setConfirmInvoice({ open: false, id: null })} onConfirm={handleDeleteInvoice} loading={deletingInvoice} title="Delete Invoice" message="This will permanently delete this invoice. Only invoices with no payments can be deleted." />
    </div>
  );
}
