import { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Send, ChevronDown, ChevronUp, User, Upload, X,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';
import {
  getMyMaintenanceRequests, createMaintenanceRequest,
  getStaffDesignations, getStaffByDesignation,
} from '../../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORIES = [
  { value: 'electrical',   label: 'Electrical Issue' },
  { value: 'plumbing',     label: 'Plumbing Issue' },
  { value: 'internet',     label: 'Internet Issue' },
  { value: 'furniture',    label: 'Furniture Damage' },
  { value: 'cleaning',     label: 'Cleaning Issue' },
  { value: 'room_repair',  label: 'Room Repair' },
  { value: 'ac',           label: 'Air Conditioner Issue' },
  { value: 'water_supply', label: 'Water Supply Issue' },
  { value: 'general',      label: 'General Maintenance' },
];
const PRIORITIES = ['low', 'medium', 'high', 'emergency'];
const STATUS_FILTERS = ['all', 'pending', 'assigned', 'in_progress', 'completed', 'rejected'];

const INITIAL = {
  category: '', issueTitle: '', issueDescription: '', priority: 'medium',
  assignedDesignation: '', assignedStaffId: '',
};

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');

  // Designation + staff dropdowns (from MongoDB)
  const [designations, setDesignations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyMaintenanceRequests();
      setRequests(data.data || []);
    } catch {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Load available designations from MongoDB (no hardcoding)
  useEffect(() => {
    getStaffDesignations()
      .then(({ data }) => setDesignations(data.data || []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  // Designation change → load matching staff, reset selected staff
  const handleDesignationChange = async (e) => {
    const designation = e.target.value;
    setForm((f) => ({ ...f, assignedDesignation: designation, assignedStaffId: '' }));
    setErrors((p) => ({ ...p, assignedDesignation: '', assignedStaffId: '' }));
    setStaffList([]);
    if (!designation) return;
    setStaffLoading(true);
    try {
      const { data } = await getStaffByDesignation(designation);
      setStaffList(data.data || []);
    } catch {
      toast.error('Failed to load staff for that designation');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Required';
    if (!form.issueTitle.trim()) e.issueTitle = 'Required';
    if (!form.issueDescription.trim()) e.issueDescription = 'Required';
    if (!form.assignedDesignation) e.assignedDesignation = 'Required';
    if (!form.assignedStaffId) e.assignedStaffId = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('issueTitle', form.issueTitle);
      fd.append('issueDescription', form.issueDescription);
      fd.append('priority', form.priority);
      fd.append('assignedDesignation', form.assignedDesignation);
      fd.append('assignedStaffId', form.assignedStaffId);
      if (image) fd.append('image', image);
      await createMaintenanceRequest(fd);
      toast.success('Maintenance request submitted!');
      setShowForm(false);
      setForm(INITIAL);
      setStaffList([]);
      setImage(null);
      setPreview('');
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

  const catLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Maintenance Requests</h1>
          <p className="page-subtitle">Report issues — they're routed automatically to the right staff</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={Wrench}>New Request</Button>
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
            {s.replace('_', ' ')}
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
            <Wrench className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No maintenance requests</p>
            <p className="text-dark-400 text-sm mt-1">
              {filter !== 'all' ? 'Try a different filter.' : 'Submit a request to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-50">
            {filtered.map((r) => {
              const expanded = expandedId === r._id;
              return (
                <div key={r._id} className="hover:bg-dark-50/30 transition-colors">
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : r._id)}>
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark-800">{r.issueTitle}</p>
                        <Badge status={r.status} />
                        <Badge status={r.priority} />
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {catLabel(r.category)} · {fmtDate(r.createdAt)}
                      </p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 animate-fade-in">
                      <div className="bg-dark-50 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-xs text-dark-400">Description</p>
                          <p className="text-sm text-dark-700 mt-0.5">{r.issueDescription}</p>
                        </div>
                        {r.image && (
                          <img src={getImageUrl(r.image)} alt="Issue" className="max-h-44 rounded-lg border border-dark-200" />
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Field label="Category" value={catLabel(r.category)} />
                          <div>
                            <p className="text-xs text-dark-400">Priority</p>
                            <Badge status={r.priority} />
                          </div>
                          <div>
                            <p className="text-xs text-dark-400">Assigned To</p>
                            <p className="text-sm font-medium text-dark-800 flex items-center gap-1">
                              {r.assignedStaff?.user?.name
                                ? <><User className="w-3 h-3" /> {r.assignedStaff.user.name}</>
                                : <span className="text-dark-400">{r.assignedDesignation || '—'}</span>}
                            </p>
                          </div>
                          <Field label="Completed On" value={r.completedAt ? fmtDate(r.completedAt) : '—'} />
                        </div>
                        {r.staffNotes && (
                          <div className="bg-white rounded-lg p-3 border border-dark-100">
                            <p className="text-xs text-dark-400 mb-1">Staff Response</p>
                            <p className="text-sm text-dark-700">{r.staffNotes}</p>
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
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Maintenance Request" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={set('category')} error={errors.category}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Assign To Designation" value={form.assignedDesignation} onChange={handleDesignationChange} error={errors.assignedDesignation}>
              <option value="">Select designation</option>
              {designations.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select
              label="Assign To Staff"
              value={form.assignedStaffId}
              onChange={set('assignedStaffId')}
              error={errors.assignedStaffId}
              disabled={!form.assignedDesignation || staffLoading}
            >
              <option value="">
                {!form.assignedDesignation ? 'Select designation first' : staffLoading ? 'Loading…' : staffList.length ? 'Select staff member' : 'No staff available'}
              </option>
              {staffList.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </div>
          <Input label="Issue Title" value={form.issueTitle} onChange={set('issueTitle')} error={errors.issueTitle} placeholder="Brief summary of the issue" />
          <Textarea label="Issue Description" value={form.issueDescription} onChange={set('issueDescription')} error={errors.issueDescription} placeholder="Describe the problem in detail..." rows={4} />
          <div>
            <label className="input-label">Photo (optional)</label>
            {preview ? (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-dark-200">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImage(null); setPreview(''); }} className="absolute top-1 right-1 bg-dark-900/60 text-white rounded-full p-0.5 hover:bg-dark-900/80">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-dark-500 border border-dashed border-dark-200 rounded-lg px-3 py-2 w-fit hover:bg-dark-50">
                <Upload className="w-3.5 h-3.5" /> Upload photo
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImage} className="hidden" />
              </label>
            )}
          </div>
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
