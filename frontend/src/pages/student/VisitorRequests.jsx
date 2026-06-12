import { useState, useEffect, useCallback } from 'react';
import {
  Users, Send, ChevronDown, ChevronUp, UserCheck,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getMyVisitorRequests, createVisitorRequest } from '../../api';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];

const INITIAL = {
  visitorName: '', visitorCNIC: '', visitorPhone: '', relationship: '',
  visitDate: '', visitTime: '', purpose: '',
};

export default function VisitorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyVisitorRequests();
      setRequests(data.data || []);
    } catch {
      toast.error('Failed to load visitor requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.visitorName.trim()) e.visitorName = 'Required';
    if (!form.visitorPhone.trim()) e.visitorPhone = 'Required';
    if (!form.visitDate) e.visitDate = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await createVisitorRequest(form);
      toast.success('Visitor request submitted — pending warden approval');
      setShowForm(false);
      setForm(INITIAL);
      setErrors({});
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? requests.length : requests.filter((r) => r.status === s).length;
    return acc;
  }, {});

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Visitor Requests</h1>
          <p className="page-subtitle">Request approval for visitors — reviewed by the warden</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={Users}>New Request</Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === s ? 'bg-primary-600 text-white shadow-sm' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
            }`}
          >
            {s}
            <span className="ml-1.5 text-xs opacity-80">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <div className="divide-y divide-dark-50">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse bg-dark-50" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No visitor requests</p>
            <p className="text-dark-400 text-sm mt-1">
              {filter !== 'all' ? 'Try a different filter.' : 'Submit a request to invite a visitor.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-50">
            {filtered.map((r) => {
              const expanded = expandedId === r._id;
              return (
                <div key={r._id} className="hover:bg-dark-50/30 transition-colors">
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : r._id)}>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                      {r.visitorName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark-800">{r.visitorName}</p>
                        <Badge status={r.status} />
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {r.relationship || 'Visitor'} · Visit {fmtDate(r.visitDate)}{r.visitTime ? ` at ${r.visitTime}` : ''}
                      </p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 animate-fade-in">
                      <div className="bg-dark-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <Field label="Phone" value={r.visitorPhone} />
                          <Field label="CNIC" value={r.visitorCNIC || '—'} />
                          <Field label="Relationship" value={r.relationship || '—'} />
                          <Field label="Visit Date" value={fmtDate(r.visitDate)} />
                          <Field label="Visit Time" value={r.visitTime || '—'} />
                          <Field label="Approval Date" value={fmtDate(r.approvedAt)} />
                        </div>
                        {r.purpose && <div><p className="text-xs text-dark-400">Purpose</p><p className="text-sm text-dark-700 mt-0.5">{r.purpose}</p></div>}
                        {r.wardenResponse && (
                          <div className="bg-white rounded-lg p-3 border border-dark-100">
                            <p className="text-xs text-dark-400 mb-1 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Warden Response</p>
                            <p className="text-sm text-dark-700">{r.wardenResponse}</p>
                            {r.approvedBy?.name && <p className="text-[11px] text-dark-400 mt-1">— {r.approvedBy.name}</p>}
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

      {/* New Request Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Visitor Request" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Visitor Name" value={form.visitorName} onChange={set('visitorName')} error={errors.visitorName} placeholder="Full name" />
            <Input label="Visitor Phone" value={form.visitorPhone} onChange={set('visitorPhone')} error={errors.visitorPhone} placeholder="03xxxxxxxxx" />
            <Input label="Visitor CNIC" value={form.visitorCNIC} onChange={set('visitorCNIC')} placeholder="xxxxx-xxxxxxx-x" />
            <Input label="Relationship" value={form.relationship} onChange={set('relationship')} placeholder="e.g. Father, Friend" />
            <Input label="Visit Date" type="date" value={form.visitDate} onChange={set('visitDate')} error={errors.visitDate} />
            <Input label="Visit Time" type="time" value={form.visitTime} onChange={set('visitTime')} />
          </div>
          <Textarea label="Purpose of Visit" value={form.purpose} onChange={set('purpose')} placeholder="Reason for the visit..." rows={3} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" icon={saving ? undefined : Send} loading={saving}>Submit Request</Button>
          </div>
        </form>
      </Modal>
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
