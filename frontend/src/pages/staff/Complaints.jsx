import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare, Search, CheckCircle,
  Clock, AlertTriangle, Eye, Edit2, Loader2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { getComplaints, updateComplaint } from '../../api';

const STATUSES = ['all', 'pending', 'in_progress', 'resolved'];

const PRIORITY_ICON = {
  high:   <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  medium: <Clock         className="w-3.5 h-3.5 text-blue-500" />,
  low:    <CheckCircle   className="w-3.5 h-3.5 text-dark-400" />,
};

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [viewItem, setViewItem]     = useState(null);
  const [editItem, setEditItem]     = useState(null);
  const [remarkDraft, setRemarkDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [saving, setSaving]         = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getComplaints({ limit: 100 });
      if (data.success) setComplaints(data.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchStatus = filter === 'all' || c.status === filter;
      const q = search.toLowerCase();
      const studentName = c.student?.user?.name || '';
      const matchSearch = !q || c.title.toLowerCase().includes(q) || studentName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [complaints, filter, search]);

  const openEdit = (c) => {
    setEditItem(c);
    setRemarkDraft(c.remarks || '');
    setStatusDraft(c.status);
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      const { data } = await updateComplaint(editItem._id, { status: statusDraft, remarks: remarkDraft });
      if (data.success) {
        setComplaints((prev) => prev.map((c) => c._id === editItem._id ? data.data : c));
        setEditItem(null);
      }
    } catch (err) {
      console.error('Failed to update complaint:', err);
    } finally {
      setSaving(false);
    }
  };

  const markResolved = async (id) => {
    try {
      const { data } = await updateComplaint(id, { status: 'resolved' });
      if (data.success) {
        setComplaints((prev) => prev.map((c) => c._id === id ? data.data : c));
      }
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
    }
  };

  const counts = {
    all:          complaints.length,
    pending:      complaints.filter((c) => c.status === 'pending').length,
    in_progress:  complaints.filter((c) => c.status === 'in_progress').length,
    resolved:     complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-red-500" /> Complaints
          </h1>
          <p className="page-subtitle">Manage and resolve assigned complaints</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-1 flex flex-wrap gap-1 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-dark-500 hover:bg-dark-100'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          type="text"
          placeholder="Search complaints…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-dark-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No complaints found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const studentName = c.student?.user?.name || 'Unknown';
            const roomNumber = c.room?.roomNumber || '—';
            return (
              <div
                key={c._id}
                className="card overflow-hidden hover:scale-[1.01] transition-transform duration-200"
              >
                <div className="p-4 space-y-3">
                  {/* Title + Priority */}
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{PRIORITY_ICON[c.priority] || PRIORITY_ICON.medium}</span>
                    <h3 className="text-sm font-semibold text-dark-800 leading-tight flex-1">{c.title}</h3>
                    <Badge status={c.status} />
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-dark-100 text-dark-600 px-2 py-0.5 rounded-full capitalize">{c.category}</span>
                    <Badge status={c.priority} />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-dark-500 line-clamp-2">{c.description}</p>

                  {/* Student info */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-dark-700">{studentName}</p>
                      <p className="text-[11px] text-dark-400">Room {roomNumber}</p>
                    </div>
                    <span className="ml-auto text-[11px] text-dark-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Remarks */}
                  {c.remarks && (
                    <div className="bg-dark-50 rounded-lg px-3 py-2 text-xs text-dark-600 italic">
                      "{c.remarks}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setViewItem(c)}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Update
                    </button>
                    {c.status !== 'resolved' && c.status !== 'closed' && (
                      <button
                        onClick={() => markResolved(c._id)}
                        className="btn btn-primary text-xs py-1.5 px-3 flex-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Complaint Details" size="md">
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Title</p>
                <p className="font-semibold text-dark-800">{viewItem.title}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Category</p>
                <p className="font-medium text-dark-700 capitalize">{viewItem.category}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Status</p>
                <Badge status={viewItem.status} />
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Priority</p>
                <Badge status={viewItem.priority} />
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Student</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                    {(viewItem.student?.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-dark-800">{viewItem.student?.user?.name || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Room</p>
                <p className="font-medium text-dark-700">{viewItem.room?.roomNumber || '—'}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Date</p>
                <p className="font-medium text-dark-700">{new Date(viewItem.createdAt).toLocaleDateString()}</p>
              </div>
              {viewItem.assignedStaff && (
                <div>
                  <p className="text-dark-400 text-xs mb-0.5">Assigned To</p>
                  <p className="font-medium text-dark-700">{viewItem.assignedStaff.name}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1">Description</p>
              <p className="text-sm text-dark-700 bg-dark-50 rounded-lg p-3">{viewItem.description}</p>
            </div>
            {viewItem.remarks && (
              <div>
                <p className="text-dark-400 text-xs mb-1">Staff Remarks</p>
                <p className="text-sm text-dark-700 bg-amber-50 rounded-lg p-3 italic">"{viewItem.remarks}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit/Update Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Update Complaint" size="md">
        {editItem && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-dark-800 mb-1">{editItem.title}</p>
              <p className="text-xs text-dark-400">
                Student: {editItem.student?.user?.name || 'Unknown'} · Room {editItem.room?.roomNumber || '—'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Update Status</label>
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Add / Edit Remarks</label>
              <textarea
                rows={4}
                value={remarkDraft}
                onChange={(e) => setRemarkDraft(e.target.value)}
                placeholder="Enter your remarks or action taken…"
                className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditItem(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
