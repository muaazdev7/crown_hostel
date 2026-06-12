import { useState, useEffect, useCallback } from 'react';
import { Plus, Megaphone, Users, UserCog, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api';

const TARGET_ROLES = [
  { value: 'all', label: 'Everyone', icon: Users },
  { value: 'student', label: 'Students', icon: GraduationCap },
  { value: 'staff', label: 'Staff', icon: UserCog },
];

const ROLE_STYLE = {
  all: 'bg-primary-50 text-primary-700',
  student: 'bg-accent-50 text-accent-700',
  staff: 'bg-amber-50 text-amber-700',
};

const ROLE_LABEL = { all: 'Everyone', student: 'Students', staff: 'Staff' };

const EMPTY_FORM = { title: '', content: '', targetRole: 'all', expiresAt: '' };

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');

  // Add / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  // ── Fetch (single source of truth — replaces state, never appends) ──
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      const res = await getAnnouncements(params);
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // ── Form helpers ──
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title || '',
      content: a.content || '',
      targetRole: a.targetRole || 'all',
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  // ── CRUD ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error('Title and content are required');
    setSaving(true);
    try {
      if (editing) {
        await updateAnnouncement(editing._id, form);
        toast.success('Announcement updated');
      } else {
        await createAnnouncement(form);
        toast.success('Announcement published');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAnnouncement(confirm.id);
      toast.success('Announcement deleted');
      setConfirm({ open: false, id: null });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Publish notices and updates for students and staff</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>New Announcement</Button>
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-wrap gap-2">
        {[{ value: '', label: 'All' }, ...TARGET_ROLES].map(r => (
          <button
            key={r.value}
            onClick={() => setFilterRole(r.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterRole === r.value ? 'bg-primary-600 text-white' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-dark-50" />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-dark-800 font-semibold">No announcements</h3>
          <p className="text-dark-400 text-sm mt-1">Publish your first announcement to notify students and staff.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Megaphone className="w-5 h-5 text-primary-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-dark-900">{a.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_STYLE[a.targetRole] || 'bg-dark-100 text-dark-600'}`}>
                        {ROLE_LABEL[a.targetRole] || a.targetRole}
                      </span>
                    </div>
                    <p className="text-sm text-dark-600 mt-1 leading-relaxed">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
                      <span>By {a.createdBy?.name || 'Admin'}</span>
                      <span>&middot;</span>
                      <span>{formatDate(a.createdAt)}</span>
                      {a.expiresAt && (
                        <>
                          <span>&middot;</span>
                          <span className="text-amber-600">Expires {formatDate(a.expiresAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirm({ open: true, id: a._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Announcement' : 'New Announcement'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title *" value={form.title} onChange={set('title')} placeholder="e.g. Hostel closure notice" />
          <div>
            <label className="label">Content *</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Write your announcement here..."
              value={form.content}
              onChange={set('content')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Audience" value={form.targetRole} onChange={set('targetRole')}>
              {TARGET_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            <Input label="Expires On (optional)" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Publish'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Announcement"
        message="This will permanently delete this announcement. This action cannot be undone."
      />
    </div>
  );
}
