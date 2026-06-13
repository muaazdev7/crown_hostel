import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Receipt, Search, Plus, Eye, Edit2, Trash2, Upload, X, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getBills, createBill, updateBill, deleteBill } from '../../api';
import { getImageUrl } from '../../utils/imageUrl';
import { BILL_TYPES, PAYMENT_STATUSES, MONTHS, typeLabel, fmtDate, fmtMoney } from './billConstants';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

const EMPTY = {
  billNumber: '', billType: 'electricity', serviceProvider: '', referenceNumber: '',
  amount: '', taxAmount: '', billingDate: '', dueDate: '', paymentDate: '',
  paymentStatus: 'pending', description: '', remarks: '',
};

export default function BillsList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fProvider, setFProvider] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fYear, setFYear] = useState('');

  // form modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (fType) params.billType = fType;
      if (fStatus) params.paymentStatus = fStatus;
      if (fProvider) params.serviceProvider = fProvider;
      if (fMonth) params.month = fMonth;
      if (fYear) params.year = fYear;
      const { data } = await getBills(params);
      setBills(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [fType, fStatus, fProvider, fMonth, fYear]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bills.filter((b) => !q
      || b.billNumber?.toLowerCase().includes(q)
      || b.serviceProvider?.toLowerCase().includes(q)
      || (b.referenceNumber || '').toLowerCase().includes(q));
  }, [bills, search]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setFile(null); setFileName(''); setShowForm(true); };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      billNumber: b.billNumber || '', billType: b.billType, serviceProvider: b.serviceProvider || '',
      referenceNumber: b.referenceNumber || '', amount: b.amount ?? '', taxAmount: b.taxAmount ?? '',
      billingDate: b.billingDate ? b.billingDate.slice(0, 10) : '',
      dueDate: b.dueDate ? b.dueDate.slice(0, 10) : '',
      paymentDate: b.paymentDate ? b.paymentDate.slice(0, 10) : '',
      paymentStatus: b.paymentStatus, description: b.description || '', remarks: b.remarks || '',
    });
    setFile(null); setFileName('');
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.serviceProvider.trim() || form.amount === '' || !form.billingDate) {
      return toast.error('Provider, amount and billing date are required');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
      if (file) fd.append('attachment', file);
      if (editing) {
        const { data } = await updateBill(editing._id, fd);
        setBills((prev) => prev.map((b) => b._id === editing._id ? data.data : b));
        toast.success('Bill updated');
      } else {
        const { data } = await createBill(fd);
        setBills((prev) => [data.data, ...prev]);
        toast.success('Bill created');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBill(confirmDelete.id);
      setBills((prev) => prev.filter((b) => b._id !== confirmDelete.id));
      toast.success('Bill deleted');
      setConfirmDelete({ open: false, id: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'billNumber', label: 'Bill #', render: (b) => <span className="font-medium text-dark-800">{b.billNumber}</span> },
    { key: 'billType', label: 'Type', render: (b) => typeLabel(b.billType) },
    { key: 'serviceProvider', label: 'Provider' },
    { key: 'totalAmount', label: 'Total', render: (b) => <span className="font-medium text-dark-800">{fmtMoney(b.totalAmount)}</span> },
    { key: 'billingDate', label: 'Billing', render: (b) => <span className="text-xs text-dark-500">{fmtDate(b.billingDate)}</span> },
    { key: 'dueDate', label: 'Due', render: (b) => <span className="text-xs text-dark-500">{fmtDate(b.dueDate)}</span> },
    { key: 'paymentStatus', label: 'Status', render: (b) => <Badge status={b.paymentStatus} /> },
    {
      key: 'actions', label: 'Actions',
      render: (b) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetail(b)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(b)} className="p-1.5 rounded text-dark-400 hover:text-primary-600 hover:bg-primary-50" title="Edit"><Edit2 className="w-4 h-4" /></button>
          {isAdmin && (
            <button onClick={() => setConfirmDelete({ open: true, id: b._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Receipt className="w-6 h-6 text-primary-500" /> Bills</h1>
          <p className="page-subtitle">Manage hostel operational utility bills</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Bill</Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input className="input pl-9" style={{ paddingLeft: '40px' }} placeholder="Search bill #, provider, reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={fType} onChange={(e) => setFType(e.target.value)} className="w-40">
          <option value="">All Types</option>
          {BILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-36">
          <option value="">All Status</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={fMonth} onChange={(e) => setFMonth(e.target.value)} className="w-32">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </Select>
        <Select value={fYear} onChange={(e) => setFYear(e.target.value)} className="w-28">
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      <div className="card p-4">
        <Table columns={columns} data={filtered} loading={loading} emptyTitle="No bills found" emptyDesc="Add a bill to get started" />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Bill' : 'Add Bill'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bill Number" value={form.billNumber} onChange={set('billNumber')} placeholder="Auto-generated if blank" />
            <Select label="Bill Type *" value={form.billType} onChange={set('billType')}>
              {BILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Input label="Service Provider *" value={form.serviceProvider} onChange={set('serviceProvider')} placeholder="e.g. K-Electric" />
            <Input label="Reference Number" value={form.referenceNumber} onChange={set('referenceNumber')} placeholder="Account / consumer #" />
            <Input label="Amount *" type="number" min="0" value={form.amount} onChange={set('amount')} placeholder="0" />
            <Input label="Tax Amount" type="number" min="0" value={form.taxAmount} onChange={set('taxAmount')} placeholder="0" />
            <Input label="Billing Date *" type="date" value={form.billingDate} onChange={set('billingDate')} />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={set('dueDate')} />
            <Input label="Payment Date" type="date" value={form.paymentDate} onChange={set('paymentDate')} />
            <Select label="Payment Status" value={form.paymentStatus} onChange={set('paymentStatus')}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </Select>
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input min-h-[50px] resize-none" value={form.description} onChange={set('description')} placeholder="Optional details..." />
          </div>
          <div>
            <label className="input-label">Remarks</label>
            <textarea className="input min-h-[50px] resize-none" value={form.remarks} onChange={set('remarks')} placeholder="Optional remarks..." />
          </div>
          {/* Attachment */}
          <div>
            <label className="input-label">Attachment (PDF, JPG, PNG)</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>
                {fileName || (editing?.attachment ? 'Replace File' : 'Upload File')}
              </Button>
              {fileName && (
                <button type="button" onClick={() => { setFile(null); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }} className="text-dark-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
              {!fileName && editing?.attachment && (
                <a href={getImageUrl(editing.attachment)} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Current file
                </a>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update Bill' : 'Create Bill'}</Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Bill Details" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-dark-800">{detail.billNumber}</h3>
                <p className="text-xs text-dark-400">{typeLabel(detail.billType)} · {detail.serviceProvider}</p>
              </div>
              <Badge status={detail.paymentStatus} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Reference #" value={detail.referenceNumber || '—'} />
              <Field label="Amount" value={fmtMoney(detail.amount)} />
              <Field label="Tax" value={fmtMoney(detail.taxAmount)} />
              <Field label="Total" value={fmtMoney(detail.totalAmount)} />
              <Field label="Billing Date" value={fmtDate(detail.billingDate)} />
              <Field label="Due Date" value={fmtDate(detail.dueDate)} />
              <Field label="Payment Date" value={fmtDate(detail.paymentDate)} />
              <Field label="Created By" value={detail.createdBy?.name || '—'} />
              <Field label="Created" value={fmtDate(detail.createdAt)} />
            </div>
            {detail.description && <div><p className="text-xs font-medium text-dark-400 mb-1">Description</p><p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.description}</p></div>}
            {detail.remarks && <div><p className="text-xs font-medium text-dark-400 mb-1">Remarks</p><p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.remarks}</p></div>}
            {detail.attachment && (
              <a href={getImageUrl(detail.attachment)} target="_blank" rel="noreferrer" className="btn btn-secondary w-fit">
                <Download className="w-4 h-4" /> View Attachment
              </a>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Bill"
        message="This will permanently delete the bill from the database. This action cannot be undone."
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-dark-400">{label}</p>
      <p className="text-sm font-medium text-dark-800">{value}</p>
    </div>
  );
}
