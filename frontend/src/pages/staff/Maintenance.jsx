import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wrench, Search, CalendarDays, MapPin, CheckCircle, Loader2, User, PlayCircle, X,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getAssignedMaintenance, updateMaintenanceStatus } from '../../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STATUSES = ['all', 'pending', 'assigned', 'in_progress', 'completed', 'rejected'];

const CATEGORY_LABEL = {
  electrical: 'Electrical', ac: 'Air Conditioner', plumbing: 'Plumbing',
  water_supply: 'Water Supply', internet: 'Internet', furniture: 'Furniture',
  cleaning: 'Cleaning', room_repair: 'Room Repair', general: 'General',
};

export default function Maintenance() {
  const [tasks, setTasks]       = useState([]);
  const [designation, setDesignation] = useState('');
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editItem, setEditItem] = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [notesDraft, setNotesDraft]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [busyId, setBusyId]     = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAssignedMaintenance();
      if (data.success) {
        setTasks(data.data);
        setDesignation(data.designation || '');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      const matchStatus = filter === 'all' || t.status === filter;
      const matchSearch = !q || t.issueTitle?.toLowerCase().includes(q)
        || (t.roomNumber || '').toLowerCase().includes(q)
        || (t.studentName || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tasks, filter, search]);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? tasks.length : tasks.filter((t) => t.status === s).length;
    return acc;
  }, {});

  // Quick status action (Accept / Start / Complete / Reject)
  const quickAction = async (id, status) => {
    setBusyId(id);
    try {
      const { data } = await updateMaintenanceStatus(id, { status });
      if (data.success) setTasks((prev) => prev.map((t) => t._id === id ? data.data : t));
      toast.success(`Request ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (t) => { setEditItem(t); setStatusDraft(t.status); setNotesDraft(t.staffNotes || ''); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await updateMaintenanceStatus(editItem._id, { status: statusDraft, staffNotes: notesDraft });
      if (data.success) {
        setTasks((prev) => prev.map((t) => t._id === editItem._id ? data.data : t));
        setEditItem(null);
        toast.success('Request updated');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const PRIORITY_BORDER = { emergency: 'border-red-500', high: 'border-red-400', medium: 'border-amber-400', low: 'border-dark-200' };
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-500" /> My Maintenance Requests
          </h1>
          <p className="page-subtitle">
            Requests routed to your designation{designation ? `: ${designation}` : ''}
          </p>
        </div>
        <div className="flex gap-2 text-sm font-medium text-dark-500">
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{counts.assigned} Assigned</span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{counts.in_progress} In Progress</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-1 flex flex-wrap gap-1 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
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
          placeholder="Search by issue, student or room…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-dark-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t._id} className={`card overflow-hidden hover:scale-[1.01] transition-transform duration-200 border-l-4 ${PRIORITY_BORDER[t.priority] || 'border-dark-200'}`}>
              {t.image && (
                <img src={`${API_BASE}/${t.image}`} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-dark-800 leading-tight">{t.issueTitle}</h3>
                  <Badge status={t.status} />
                </div>
                <p className="text-xs text-dark-500 line-clamp-2">{t.issueDescription}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-dark-500">
                  <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary-400" /><span>{t.studentName || '—'}</span></div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary-400" /><span>Room {t.roomNumber || '—'}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-dark-400">Type:</span><span className="font-medium text-dark-700">{CATEGORY_LABEL[t.category] || t.category}</span></div>
                  <div className="flex items-center gap-1.5"><Badge status={t.priority} /></div>
                  <div className="flex items-center gap-1.5 col-span-2"><CalendarDays className="w-3.5 h-3.5 text-amber-400" /><span>{fmtDate(t.createdAt)}</span></div>
                </div>

                {t.staffNotes && (
                  <div className="bg-dark-50 rounded-lg p-2 text-xs text-dark-600">
                    <span className="text-dark-400">Notes: </span>{t.staffNotes}
                  </div>
                )}

                {/* Status actions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {t.status === 'pending' && (
                    <button onClick={() => quickAction(t._id, 'assigned')} disabled={busyId === t._id} className="btn btn-secondary text-[11px] py-1.5 px-3 text-indigo-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </button>
                  )}
                  {t.status === 'assigned' && (
                    <button onClick={() => quickAction(t._id, 'in_progress')} disabled={busyId === t._id} className="btn btn-secondary text-[11px] py-1.5 px-3 text-blue-600">
                      <PlayCircle className="w-3.5 h-3.5" /> Start Work
                    </button>
                  )}
                  {t.status === 'in_progress' && (
                    <button onClick={() => quickAction(t._id, 'completed')} disabled={busyId === t._id} className="btn btn-primary text-[11px] py-1.5 px-3">
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </button>
                  )}
                  {!['completed', 'rejected'].includes(t.status) && (
                    <button onClick={() => quickAction(t._id, 'rejected')} disabled={busyId === t._id} className="btn btn-secondary text-[11px] py-1.5 px-3 text-red-500">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                  <button onClick={() => openEdit(t)} className="btn btn-secondary text-[11px] py-1.5 px-3 ml-auto">
                    Notes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Notes Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Update Request" size="sm">
        {editItem && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-dark-800">{editItem.issueTitle}</p>
              <p className="text-xs text-dark-400 mt-0.5">
                {editItem.studentName} · Room {editItem.roomNumber || '—'} · {fmtDate(editItem.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Status</label>
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Staff Notes / Response</label>
              <textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add a note for the student…"
                className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditItem(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
