import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Plus, Loader2, Check, X, Phone,
  Trash2, LogOut, Eye, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import {
  getVisitors, createVisitor, updateVisitor, deleteVisitor,
  approveVisitor, rejectVisitor, getStudents,
} from '../../api';
import StudentVisitorRequests from './StudentVisitorRequests';

const TABS = ['all', 'pending', 'approved', 'rejected'];

const EMPTY_FORM = {
  name: '', phone: '', visitingStudent: '', relation: '', purpose: '', idType: 'CNIC', idNumber: '',
};

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [busyId, setBusyId]     = useState(null);
  const [view, setView]         = useState('requests'); // 'requests' (student) | 'walkin' (log)

  // Add modal
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Details modal
  const [detail, setDetail]     = useState(null);

  useEffect(() => { fetchVisitors(); }, []);
  useEffect(() => {
    getStudents({ limit: 200 }).then(({ data }) => setStudents(data.data || [])).catch(() => {});
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const { data } = await getVisitors({ limit: 200 });
      setVisitors(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visitors.filter((v) => {
      const matchTab = tab === 'all' || v.status === tab;
      const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.phone?.includes(q)
        || v.visitingStudent?.user?.name?.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [visitors, tab, search]);

  const counts = useMemo(() => ({
    all:      visitors.length,
    pending:  visitors.filter((v) => v.status === 'pending').length,
    approved: visitors.filter((v) => v.status === 'approved').length,
    rejected: visitors.filter((v) => v.status === 'rejected').length,
  }), [visitors]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      const { data } = await createVisitor(form);
      setVisitors((prev) => [data.data, ...prev]);
      setShowAdd(false);
      setForm(EMPTY_FORM);
      toast.success('Visitor registered');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register visitor');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (v) => {
    setBusyId(v._id);
    try {
      const { data } = await approveVisitor(v._id);
      setVisitors((prev) => prev.map((x) => x._id === v._id ? data.data : x));
      toast.success('Visitor approved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    setBusyId(rejectTarget._id);
    try {
      const { data } = await rejectVisitor(rejectTarget._id, { rejectionReason: rejectReason });
      setVisitors((prev) => prev.map((x) => x._id === rejectTarget._id ? data.data : x));
      toast.success('Visitor rejected');
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckout = async (v) => {
    setBusyId(v._id);
    try {
      const { data } = await updateVisitor(v._id, { checkOut: new Date().toISOString() });
      setVisitors((prev) => prev.map((x) => x._id === v._id ? data.data : x));
      toast.success('Visitor checked out');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check out');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (v) => {
    setBusyId(v._id);
    try {
      await deleteVisitor(v._id);
      setVisitors((prev) => prev.filter((x) => x._id !== v._id));
      toast.success('Visitor record deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-500" /> Visitor Management
          </h1>
          <p className="page-subtitle">Review student visitor requests and the walk-in log</p>
        </div>
        {view === 'walkin' && (
          <button onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Register Visitor
          </button>
        )}
      </div>

      {/* View Toggle */}
      <div className="card p-1 flex gap-1 w-fit">
        <button
          onClick={() => setView('requests')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === 'requests' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          Student Requests
        </button>
        <button
          onClick={() => setView('walkin')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === 'walkin' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          Walk-in Log
        </button>
      </div>

      {view === 'requests' ? (
        <StudentVisitorRequests />
      ) : (
      <>
      {/* Tabs */}
      <div className="card p-1 flex flex-wrap gap-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
            }`}
          >
            {t} ({counts[t] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          type="text"
          placeholder="Search by name, phone or student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-dark-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No visitors found</p>
          <p className="text-xs mt-1">Register a visitor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((v) => (
            <div key={v._id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold shrink-0">
                  {v.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-dark-800">{v.name}</p>
                    <Badge status={v.status} />
                    {v.checkOut && <span className="text-[10px] bg-dark-100 text-dark-500 px-1.5 py-0.5 rounded-full">Checked out</span>}
                  </div>
                  <p className="text-xs text-dark-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {v.phone}
                  </p>
                  <p className="text-xs text-dark-400 mt-1">
                    Visiting: <span className="font-medium text-dark-600">{v.visitingStudent?.user?.name || '—'}</span>
                    {v.visitingStudent?.room?.roomNumber ? ` · Room ${v.visitingStudent.room.roomNumber}` : ''}
                  </p>
                  {v.purpose && <p className="text-xs text-dark-400 mt-0.5 truncate">Purpose: {v.purpose}</p>}
                  <p className="text-[10px] text-dark-300 mt-1">Check-in: {fmt(v.checkIn)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dark-50 flex-wrap">
                {v.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(v)}
                      disabled={busyId === v._id}
                      className="btn btn-secondary text-[11px] py-1.5 px-3 text-emerald-600"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => { setRejectTarget(v); setRejectReason(''); }}
                      disabled={busyId === v._id}
                      className="btn btn-secondary text-[11px] py-1.5 px-3 text-red-600"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                {v.status === 'approved' && !v.checkOut && (
                  <button
                    onClick={() => handleCheckout(v)}
                    disabled={busyId === v._id}
                    className="btn btn-secondary text-[11px] py-1.5 px-3"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Check Out
                  </button>
                )}
                <button onClick={() => setDetail(v)} className="btn btn-secondary text-[11px] py-1.5 px-3">
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
                <button
                  onClick={() => handleDelete(v)}
                  disabled={busyId === v._id}
                  className="btn btn-secondary text-[11px] py-1.5 px-3 text-red-500 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Add Visitor Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register Visitor" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Visitor Name *</label>
              <input value={form.name} onChange={set('name')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Phone *</label>
              <input value={form.phone} onChange={set('phone')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="03xxxxxxxxx" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-dark-600 mb-1">Visiting Student</label>
              <select value={form.visitingStudent} onChange={set('visitingStudent')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">— Select student —</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.user?.name || 'Unknown'}{s.rollNumber ? ` (${s.rollNumber})` : ''}{s.room?.roomNumber ? ` · Room ${s.room.roomNumber}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Relation</label>
              <input value={form.relation} onChange={set('relation')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="e.g. Father, Friend" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">ID Type</label>
              <select value={form.idType} onChange={set('idType')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="CNIC">CNIC</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">ID Number</label>
              <input value={form.idNumber} onChange={set('idNumber')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="ID / document number" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Purpose</label>
              <input value={form.purpose} onChange={set('purpose')} className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Reason for visit" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Saving...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Visitor" size="sm">
        {rejectTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Rejecting <span className="font-semibold">{rejectTarget.name}</span>'s visit request.
            </div>
            <Textarea
              label="Reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this visit being rejected?"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={submitReject} disabled={busyId === rejectTarget._id} className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700">
                Confirm Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Visitor Details" size="sm">
        {detail && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {detail.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-dark-800">{detail.name}</p>
                <Badge status={detail.status} />
              </div>
            </div>
            <Row label="Phone" value={detail.phone} />
            <Row label="Visiting" value={detail.visitingStudent?.user?.name || '—'} />
            <Row label="Room" value={detail.visitingStudent?.room?.roomNumber || '—'} />
            <Row label="Relation" value={detail.relation || '—'} />
            <Row label="Purpose" value={detail.purpose || '—'} />
            <Row label="ID" value={detail.idType ? `${detail.idType} ${detail.idNumber || ''}`.trim() : '—'} />
            <Row label="Check-in" value={fmt(detail.checkIn)} />
            <Row label="Check-out" value={fmt(detail.checkOut)} />
            {detail.approvedBy?.name && <Row label="Actioned by" value={`${detail.approvedBy.name} · ${fmt(detail.approvedAt)}`} />}
            {detail.status === 'rejected' && detail.rejectionReason && (
              <Row label="Reject reason" value={detail.rejectionReason} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-dark-50 pb-1.5">
      <span className="text-dark-400">{label}</span>
      <span className="text-dark-700 font-medium text-right">{value}</span>
    </div>
  );
}
