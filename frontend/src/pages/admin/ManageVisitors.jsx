import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { adminGetVisitors, adminDeleteVisitor } from '../../api';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function ManageVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [busy, setBusy] = useState(false);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminGetVisitors();
      setVisitors(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load visitor logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visitors.filter((v) => {
      const matchStatus = filterStatus === 'all' || v.status === filterStatus;
      const matchSearch = !q || v.visitorName?.toLowerCase().includes(q)
        || (v.studentName || '').toLowerCase().includes(q)
        || (v.visitorPhone || '').includes(q);
      return matchStatus && matchSearch;
    });
  }, [visitors, search, filterStatus]);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await adminDeleteVisitor(confirmDelete.id);
      setVisitors((prev) => prev.filter((v) => v._id !== confirmDelete.id));
      toast.success('Visitor log deleted');
      setConfirmDelete({ open: false, id: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'visitorName', label: 'Visitor',
      render: (v) => (
        <div>
          <p className="font-medium text-dark-800">{v.visitorName}</p>
          <p className="text-xs text-dark-400">{v.relationship || '—'} · {v.visitorPhone}</p>
        </div>
      ),
    },
    {
      key: 'student', label: 'Student',
      render: (v) => (
        <div>
          <p className="text-dark-700">{v.studentName || '—'}</p>
          <p className="text-xs text-dark-400">{v.registrationNumber || '—'} · Room {v.roomNumber || '—'}</p>
        </div>
      ),
    },
    { key: 'visit', label: 'Visit', render: (v) => <span className="text-xs text-dark-600">{fmtDate(v.visitDate)}{v.visitTime ? ` · ${v.visitTime}` : ''}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v.status} /> },
    { key: 'approvedBy', label: 'Approved By', render: (v) => v.approvedBy?.name || '—' },
    {
      key: 'actions', label: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetail(v)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmDelete({ open: true, id: v._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
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
          <h1 className="page-title flex items-center gap-2"><Users className="w-6 h-6 text-purple-500" /> Visitor Logs</h1>
          <p className="page-subtitle">View and delete all visitor records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input className="input pl-9" style={{ paddingLeft: '40px' }} placeholder="Search by visitor, student or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <Table
          columns={columns} data={filtered} loading={loading}
          emptyTitle="No visitor logs" emptyDesc="Visitor requests submitted by students will appear here"
        />
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Visitor Details" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                {detail.visitorName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-dark-800">{detail.visitorName}</h3>
                <Badge status={detail.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CNIC" value={detail.visitorCNIC || '—'} />
              <Field label="Phone" value={detail.visitorPhone || '—'} />
              <Field label="Relationship" value={detail.relationship || '—'} />
              <Field label="Visit Date" value={fmtDate(detail.visitDate)} />
              <Field label="Visit Time" value={detail.visitTime || '—'} />
              <Field label="Status" value={detail.status} capitalize />
              <Field label="Student Name" value={detail.studentName || '—'} />
              <Field label="Registration #" value={detail.registrationNumber || '—'} />
              <Field label="Room Number" value={detail.roomNumber || '—'} />
              <Field label="Approved By" value={detail.approvedBy?.name || '—'} />
            </div>
            {detail.purpose && (
              <div>
                <p className="text-xs font-medium text-dark-400 mb-1">Purpose</p>
                <p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.purpose}</p>
              </div>
            )}
            {detail.wardenResponse && (
              <div>
                <p className="text-xs font-medium text-dark-400 mb-1">Warden Response</p>
                <p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.wardenResponse}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={busy}
        title="Delete Visitor Log"
        message="This will permanently delete the visitor record from the database. This action cannot be undone."
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
