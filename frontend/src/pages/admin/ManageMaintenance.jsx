import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wrench, Search, Eye, Ban, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { adminGetMaintenance, adminCancelMaintenance, adminDeleteMaintenance } from '../../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STATUSES = ['all', 'pending', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled'];
const CATEGORY_LABEL = {
  electrical: 'Electrical', ac: 'Air Conditioner', plumbing: 'Plumbing', water_supply: 'Water Supply',
  internet: 'Internet', furniture: 'Furniture', cleaning: 'Cleaning', room_repair: 'Room Repair', general: 'General',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function ManageMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [detail, setDetail] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState({ open: false, id: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [busy, setBusy] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminGetMaintenance({ limit: 200 });
      setRequests(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchSearch = !q || r.issueTitle?.toLowerCase().includes(q)
        || (r.studentName || '').toLowerCase().includes(q)
        || (r.roomNumber || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [requests, search, filterStatus]);

  const staffName = (r) => r.assignedStaffName || r.assignedStaff?.user?.name || '—';

  const handleCancel = async () => {
    setBusy(true);
    try {
      const { data } = await adminCancelMaintenance(confirmCancel.id);
      setRequests((prev) => prev.map((r) => r._id === confirmCancel.id ? data.data : r));
      toast.success('Request cancelled');
      setConfirmCancel({ open: false, id: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await adminDeleteMaintenance(confirmDelete.id);
      setRequests((prev) => prev.filter((r) => r._id !== confirmDelete.id));
      toast.success('Request deleted');
      setConfirmDelete({ open: false, id: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'issueTitle', label: 'Request',
      render: (r) => (
        <div>
          <p className="font-medium text-dark-800">{r.issueTitle}</p>
          <p className="text-xs text-dark-400">{CATEGORY_LABEL[r.category] || r.category}</p>
        </div>
      ),
    },
    {
      key: 'student', label: 'Student',
      render: (r) => (
        <div>
          <p className="text-dark-700">{r.studentName || '—'}</p>
          <p className="text-xs text-dark-400">{r.registrationNumber || '—'} · Room {r.roomNumber || '—'}</p>
        </div>
      ),
    },
    { key: 'assignedStaff', label: 'Assigned Staff', render: (r) => staffName(r) },
    { key: 'priority', label: 'Priority', render: (r) => <Badge status={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'createdAt', label: 'Created', render: (r) => <span className="text-xs text-dark-500">{fmtDate(r.createdAt)}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetail(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          {!['completed', 'cancelled', 'rejected'].includes(r.status) && (
            <button onClick={() => setConfirmCancel({ open: true, id: r._id })} className="p-1.5 rounded text-dark-400 hover:text-amber-600 hover:bg-amber-50" title="Cancel Request">
              <Ban className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setConfirmDelete({ open: true, id: r._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wrench className="w-6 h-6 text-amber-500" /> Maintenance Requests</h1>
          <p className="page-subtitle">View, cancel and delete all maintenance requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input className="input pl-9" style={{ paddingLeft: '40px' }} placeholder="Search by issue, student or room..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterStatus === s ? 'bg-primary-600 text-white shadow-sm' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <Table
          columns={columns} data={filtered} loading={loading}
          emptyTitle="No maintenance requests" emptyDesc="Requests submitted by students will appear here"
        />
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Maintenance Request Details" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-dark-800">{detail.issueTitle}</h3>
                <p className="text-xs text-dark-400">{CATEGORY_LABEL[detail.category] || detail.category} · {fmtDate(detail.createdAt)}</p>
              </div>
              <div className="flex gap-1.5"><Badge status={detail.priority} /><Badge status={detail.status} /></div>
            </div>
            {detail.image && <img src={`${API_BASE}/${detail.image}`} alt="Issue" className="max-h-52 rounded-lg border border-dark-200" />}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Student Name" value={detail.studentName || '—'} />
              <Field label="Registration #" value={detail.registrationNumber || '—'} />
              <Field label="Room Number" value={detail.roomNumber || '—'} />
              <Field label="Assigned Staff" value={staffName(detail)} />
              <Field label="Designation" value={detail.assignedDesignation || '—'} />
              <Field label="Status" value={detail.status} capitalize />
            </div>
            <div>
              <p className="text-xs font-medium text-dark-400 mb-1">Issue Description</p>
              <p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.issueDescription}</p>
            </div>
            {detail.staffNotes && (
              <div>
                <p className="text-xs font-medium text-dark-400 mb-1">Staff Notes</p>
                <p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.staffNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={confirmCancel.open}
        onClose={() => setConfirmCancel({ open: false, id: null })}
        onConfirm={handleCancel}
        loading={busy}
        title="Cancel Maintenance Request"
        message="This will mark the request as Cancelled. Continue?"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={busy}
        title="Delete Maintenance Request"
        message="This will permanently delete the request from the database. This action cannot be undone."
      />
    </div>
  );
}

function Field({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-xs text-dark-400">{label}</p>
      <p className={`text-sm font-medium text-dark-800 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}
