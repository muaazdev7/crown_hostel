import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getComplaints, updateComplaint, updateComplaintStatus, deleteComplaint } from '../../api';

const CATEGORIES = ['room', 'plumbing', 'electrical', 'cleanliness', 'food', 'security', 'other'];
const STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high'];

const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_STYLE = {
  low: 'bg-dark-100 text-dark-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-red-50 text-red-700',
};

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [showView, setShowView] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      const res = await getComplaints(params);
      setComplaints(res.data.data);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterCategory, filterPriority]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── Inline status change (instant dropdown) ──
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, { status: newStatus });
      // Update UI instantly
      setComplaints(prev =>
        prev.map(c => c._id === id ? { ...c, status: newStatus, ...(newStatus === 'resolved' || newStatus === 'closed' ? { resolvedAt: new Date().toISOString() } : {}) } : c)
      );
      toast.success(`Status updated to ${STATUS_LABEL[newStatus]}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  // ── Update modal (status + remarks) ──
  const openUpdate = (complaint) => {
    setSelected(complaint);
    setUpdateForm({ status: complaint.status, remarks: complaint.remarks || '' });
    setShowUpdate(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateComplaint(selected._id, {
        status: updateForm.status,
        remarks: updateForm.remarks,
      });
      toast.success('Complaint updated');
      setShowUpdate(false);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteComplaint(confirm.id);
      toast.success('Complaint deleted');
      setConfirm({ open: false, id: null });
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title', label: 'Complaint',
      render: r => (
        <div className="max-w-xs">
          <p className="font-medium text-dark-800 truncate">{r.title}</p>
          <p className="text-xs text-dark-400">{r.student?.user?.name} · {r.room?.roomNumber || 'No room'}</p>
        </div>
      ),
    },
    {
      key: 'category', label: 'Category',
      render: r => <span className="capitalize">{r.category}</span>,
    },
    {
      key: 'priority', label: 'Priority',
      render: r => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_STYLE[r.priority] || 'bg-dark-100 text-dark-600'}`}>
          {r.priority}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: r => (
        <select
          value={r.status}
          onChange={(e) => handleStatusChange(r._id, e.target.value)}
          disabled={r.status === 'closed'}
          className="text-xs font-medium rounded-lg border border-dark-200 bg-white px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdAt', label: 'Raised On',
      render: r => new Date(r.createdAt).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected(r); setShowView(true); }} className="p-1.5 rounded text-dark-400 hover:text-primary-600 hover:bg-primary-50" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openUpdate(r)}
            disabled={r.status === 'closed'}
            className="px-2.5 py-1 text-xs font-medium bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Update
          </button>
          <button
            onClick={() => setConfirm({ open: true, id: r._id })}
            className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaint Management</h1>
          <p className="page-subtitle">Track and resolve student complaints</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="input pl-9"
            placeholder="Search complaints..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </Select>
        <Select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className="w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="card p-4">
        <Table
          columns={columns} data={complaints} loading={loading}
          emptyTitle="No complaints found" emptyDesc="All clear! No complaints at the moment."
          page={page} pages={pages} onPageChange={setPage}
        />
      </div>

      {/* View Modal */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Complaint Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-900">{selected.title}</h3>
                <p className="text-sm text-dark-500 mt-0.5">{selected.student?.user?.name}</p>
              </div>
              <Badge status={selected.status} label={STATUS_LABEL[selected.status]} />
            </div>
            <div className="p-3 bg-dark-50 rounded-xl text-sm text-dark-700 leading-relaxed">
              {selected.description}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Category', selected.category],
                ['Priority', selected.priority],
                ['Room', selected.room?.roomNumber || '—'],
                ['Block', selected.block?.name || '—'],
                ['Raised On', new Date(selected.createdAt).toLocaleDateString('en-IN')],
                ['Resolved On', selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleDateString('en-IN') : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-dark-400 uppercase font-medium">{label}</p>
                  <p className="text-dark-800 font-medium capitalize">{val}</p>
                </div>
              ))}
            </div>
            {selected.remarks && (
              <div>
                <p className="text-xs text-dark-400 uppercase font-medium mb-1">Remarks</p>
                <p className="text-sm text-dark-700 p-3 bg-primary-50 rounded-xl">{selected.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Status + Remarks Modal */}
      <Modal isOpen={showUpdate} onClose={() => setShowUpdate(false)} title="Update Complaint" size="sm">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Select label="Status" value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          <div>
            <label className="label">Remarks</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Add remarks or resolution notes..."
              value={updateForm.remarks}
              onChange={e => setUpdateForm(f => ({ ...f, remarks: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowUpdate(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Update</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Complaint"
        message="This will permanently delete this complaint. This action cannot be undone."
      />
    </div>
  );
}
