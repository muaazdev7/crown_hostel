import { useState, useEffect } from 'react';
import {
  CalendarOff, Send, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Calendar, MapPin, Phone, Loader2,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { applyLeave, getLeaves, getAttendance } from '../../api';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'medical', label: 'Medical' },
  { value: 'personal', label: 'Personal' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'academic', label: 'Academic' },
];

const INITIAL = {
  leaveType: '', fromDate: '', toDate: '',
  reason: '', destination: '', contactDuring: '',
};

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState('leaves'); // 'leaves' | 'attendance'

  // Fetch leave requests and attendance from backend on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [leavesRes, attendanceRes] = await Promise.all([
        getLeaves(),
        getAttendance({ limit: 60 }),
      ]);
      setLeaves(leavesRes.data.data || []);
      setAttendance(attendanceRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally {
      setFetching(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.leaveType) e.leaveType = 'Required';
    if (!form.fromDate) e.fromDate = 'Required';
    if (!form.toDate) e.toDate = 'Required';
    if (!form.reason.trim()) e.reason = 'Required';
    if (!form.destination.trim()) e.destination = 'Required';
    if (!form.contactDuring.trim()) e.contactDuring = 'Required';
    if (form.fromDate && form.toDate && form.toDate < form.fromDate) e.toDate = 'Must be after start date';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await applyLeave({
        leaveType: form.leaveType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason,
        destination: form.destination,
        contactDuring: form.contactDuring,
      });
      // Prepend the newly created leave returned by the server
      setLeaves([data.data, ...leaves]);
      setShowForm(false);
      setForm(INITIAL);
      toast.success('Leave request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const attendancePercent = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const getDaysBetween = (from, to) => {
    const d1 = new Date(from);
    const d2 = new Date(to);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance & Leave</h1>
          <p className="page-subtitle">Track attendance and manage leave requests</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={CalendarOff}>Apply for Leave</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Attendance', value: `${attendancePercent}%`, color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
          { label: 'Days Present', value: presentCount, color: 'bg-primary-50 text-primary-600', icon: Calendar },
          { label: 'Days Absent', value: absentCount, color: 'bg-red-50 text-red-600', icon: XCircle },
          { label: 'Leave Requests', value: leaves.length, color: 'bg-amber-50 text-amber-600', icon: CalendarOff },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-dark-900">{value}</p>
              <p className="text-xs text-dark-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('leaves')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'leaves' ? 'bg-primary-600 text-white shadow-sm' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
          }`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setView('attendance')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'attendance' ? 'bg-primary-600 text-white shadow-sm' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
          }`}
        >
          Attendance Log
        </button>
      </div>

      {/* Leave Requests */}
      {view === 'leaves' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Leave Requests</h3>
          </div>
          {fetching ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarOff className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-600 font-medium">No leave requests</p>
              <p className="text-dark-400 text-sm mt-1">Submit your first leave application.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              {leaves.map(lv => {
                const expanded = expandedId === lv._id;
                const days = getDaysBetween(lv.fromDate, lv.toDate);
                const typeLabel = LEAVE_TYPES.find(t => t.value === lv.leaveType)?.label || lv.leaveType;
                return (
                  <div key={lv._id} className="hover:bg-dark-50/30 transition-colors">
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : lv._id)}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        lv.status === 'approved' ? 'bg-emerald-100 text-emerald-600'
                          : lv.status === 'rejected' ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {lv.status === 'approved' ? <CheckCircle className="w-5 h-5" />
                          : lv.status === 'rejected' ? <XCircle className="w-5 h-5" />
                          : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-dark-800">{typeLabel}</p>
                          <Badge status={lv.status} />
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5">
                          {new Date(lv.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' — '}
                          {new Date(lv.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' '}({days} day{days > 1 ? 's' : ''})
                        </p>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                    </div>

                    {expanded && (
                      <div className="px-5 pb-4 animate-fade-in">
                        <div className="bg-dark-50 rounded-xl p-4 space-y-3">
                          <div>
                            <p className="text-xs text-dark-400">Reason</p>
                            <p className="text-sm text-dark-700 mt-0.5">{lv.reason}</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Destination</p>
                              <p className="text-sm font-medium text-dark-800">{lv.destination}</p>
                            </div>
                            <div>
                              <p className="text-xs text-dark-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</p>
                              <p className="text-sm font-medium text-dark-800">{lv.contactDuring}</p>
                            </div>
                            <div>
                              <p className="text-xs text-dark-400">Approved By</p>
                              <p className="text-sm font-medium text-dark-800">{lv.approvedBy?.name || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-dark-400">Applied On</p>
                              <p className="text-sm font-medium text-dark-800">
                                {new Date(lv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance Log */}
      {view === 'attendance' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Attendance Log (Last 30 Days)</h3>
          </div>
          <div className="p-5">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-xs text-dark-400 font-medium text-center py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {attendance.map(a => {
                const d = new Date(a.date);
                const day = d.getDate();
                return (
                  <div
                    key={a._id}
                    className={`p-2 rounded-lg text-center text-xs font-medium ${
                      a.status === 'present'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                    title={`${a.date} — ${a.status}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-dark-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
                Present ({presentCount})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                Absent ({absentCount})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Apply for Leave" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Leave Type" value={form.leaveType} onChange={set('leaveType')} error={errors.leaveType}>
            <option value="">Select type</option>
            {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="From Date" type="date" value={form.fromDate} onChange={set('fromDate')} error={errors.fromDate} />
            <Input label="To Date" type="date" value={form.toDate} onChange={set('toDate')} error={errors.toDate} />
          </div>
          <Textarea label="Reason" value={form.reason} onChange={set('reason')} error={errors.reason} placeholder="Describe the reason for leave..." rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Destination" value={form.destination} onChange={set('destination')} error={errors.destination} placeholder="Where you'll be staying" />
            <Input label="Contact During Leave" value={form.contactDuring} onChange={set('contactDuring')} error={errors.contactDuring} placeholder="Phone number" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" icon={Send} loading={loading}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
