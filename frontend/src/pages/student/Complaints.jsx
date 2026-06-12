import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, Clock, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, User,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getComplaints, createComplaint } from '../../api';

const CATEGORIES = ['room', 'plumbing', 'electrical', 'cleanliness', 'food', 'security', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];

const INITIAL = {
  title: '', description: '', category: '', priority: 'medium',
};

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await getComplaints(params);
      setComplaints(res.data.data);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.category) e.category = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await createComplaint({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
      });
      toast.success('Complaint submitted successfully!');
      setShowForm(false);
      setForm(INITIAL);
      setErrors({});
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSaving(false);
    }
  };

  const statusCounts = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">File and track your complaints</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={MessageSquare}>New Complaint</Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'in_progress', 'resolved'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-80">({statusCounts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="card">
        {loading ? (
          <div className="space-y-0 divide-y divide-dark-50">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-dark-50" />)}
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No complaints found</p>
            <p className="text-dark-400 text-sm mt-1">
              {filterStatus !== 'all' ? 'Try a different filter.' : 'You haven\'t filed any complaints yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-50">
            {complaints.map(c => {
              const expanded = expandedId === c._id;
              return (
                <div key={c._id} className="hover:bg-dark-50/30 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : c._id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-100 text-emerald-600'
                        : c.status === 'in_progress' ? 'bg-blue-100 text-blue-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {c.status === 'resolved' || c.status === 'closed' ? <CheckCircle className="w-5 h-5" />
                        : c.status === 'in_progress' ? <Clock className="w-5 h-5" />
                        : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark-800">{c.title}</p>
                        <Badge status={c.status === 'in_progress' ? 'in-progress' : c.status} />
                        <Badge status={c.priority} label={c.priority} />
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5 capitalize">
                        {c.category} — {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 animate-fade-in">
                      <div className="bg-dark-50 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-xs text-dark-400">Description</p>
                          <p className="text-sm text-dark-700 mt-0.5">{c.description}</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-dark-400">Category</p>
                            <p className="text-sm font-medium text-dark-800 capitalize">{c.category}</p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-400">Priority</p>
                            <Badge status={c.priority} label={c.priority} />
                          </div>
                          <div>
                            <p className="text-xs text-dark-400">Assigned To</p>
                            <p className="text-sm font-medium text-dark-800 flex items-center gap-1">
                              {c.assignedStaff?.name ? (
                                <><User className="w-3 h-3" /> {c.assignedStaff.name}</>
                              ) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-400">Resolved On</p>
                            <p className="text-sm font-medium text-dark-800">
                              {c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                        {c.remarks && (
                          <div className="bg-white rounded-lg p-3 border border-dark-100">
                            <p className="text-xs text-dark-400 mb-1">Staff Remarks</p>
                            <p className="text-sm text-dark-700">{c.remarks}</p>
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

      {/* New Complaint Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="File New Complaint" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={set('title')} error={errors.title} placeholder="Brief summary of the issue" />
          <Textarea label="Description" value={form.description} onChange={set('description')} error={errors.description} placeholder="Describe the issue in detail..." rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={set('category')} error={errors.category}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" icon={Send} loading={saving}>Submit Complaint</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
