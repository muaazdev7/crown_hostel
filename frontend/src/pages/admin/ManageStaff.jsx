import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getStaffList, createStaff, updateStaff, deleteStaff, getBlocks } from '../../api';

const DESIGNATIONS = ['Warden', 'Security Guard', 'Housekeeping', 'Maintenance', 'Cook', 'Receptionist', 'Other'];
const DEPARTMENTS = ['Administration', 'Security', 'Housekeeping', 'Maintenance', 'Kitchen', 'Other'];
const SHIFTS = ['morning', 'evening', 'night', 'general'];

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  employeeId: '', designation: '', department: '',
  gender: '', shift: 'general', assignedBlock: '', salary: '',
};

// Helper: build a FormData object from form state + optional file
function buildFormData(form, imageFile) {
  const fd = new FormData();
  fd.append('name', form.name);
  fd.append('email', form.email);
  if (form.password) fd.append('password', form.password);
  fd.append('phone', form.phone);
  fd.append('employeeId', form.employeeId);
  fd.append('designation', form.designation);
  if (form.department) fd.append('department', form.department);
  if (form.gender) fd.append('gender', form.gender);
  fd.append('shift', form.shift);
  if (form.assignedBlock) fd.append('assignedBlock', form.assignedBlock);
  if (form.salary) fd.append('salary', Number(form.salary));
  if (imageFile) fd.append('profileImage', imageFile);
  return fd;
}

// ── StaffForm defined OUTSIDE ManageStaff ──
// Defining it inside the parent component created a NEW function reference
// on every render, causing React to unmount/remount the entire <form> on
// each keystroke — destroying focus and cursor position.
function StaffForm({ form, errors, saving, isEdit, blocks, imagePreview, set, onImageChange, onImageRemove, onSubmit, onCancel }) {
  const fileRef = useRef(null);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Profile Image Upload */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-dark-100" />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-2xl bg-dark-50 border-2 border-dashed border-dark-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Camera className="w-5 h-5 text-dark-400" />
              <span className="text-[10px] text-dark-400 mt-1">Photo</span>
            </div>
          )}
        </div>
        <div className="text-sm text-dark-500">
          <p className="font-medium text-dark-700">Profile Photo</p>
          <p className="text-xs">JPG, PNG or WebP. Max 5MB.</p>
          {imagePreview && (
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary-600 hover:underline mt-1">
              Change photo
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onImageChange}
        />
      </div>

      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Account Info</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name *" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Input
          label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Min 6 chars"
          error={errors.password}
        />
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
      </div>
      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Staff Info</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Employee ID *" value={form.employeeId} onChange={set('employeeId')} error={errors.employeeId} />
        <Select label="Designation *" value={form.designation} onChange={set('designation')} error={errors.designation}>
          <option value="">Select</option>
          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select label="Department" value={form.department} onChange={set('department')}>
          <option value="">Select</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select label="Shift" value={form.shift} onChange={set('shift')}>
          {SHIFTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select label="Assigned Block" value={form.assignedBlock} onChange={set('assignedBlock')}>
          <option value="">None</option>
          {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <Select label="Gender" value={form.gender} onChange={set('gender')}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
        <Input label="Salary (Pkr)" type="number" value={form.salary} onChange={set('salary')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{isEdit ? 'Update Staff' : 'Add Staff'}</Button>
      </div>
    </form>
  );
}

export default function ManageStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [blocks, setBlocks] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // ── Fetch staff list ──
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStaffList({ page, limit: 15 });
      setStaff(res.data.data);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => { getBlocks().then(res => setBlocks(res.data.data)).catch(() => {}); }, []);

  // ── Form change handler with error clearing ──
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Validation ──
  const validate = (isEdit) => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!isEdit && !form.password.trim()) errs.password = 'Password is required';
    if (!form.employeeId.trim()) errs.employeeId = 'Employee ID is required';
    if (!form.designation) errs.designation = 'Designation is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Image handlers ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // ── Open Add modal ──
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setImageFile(null);
    setImagePreview('');
    setShowAdd(true);
  };

  // ── Open Edit modal — pre-fill ALL fields ──
  const openEdit = (member) => {
    setSelected(member);
    setErrors({});
    setImageFile(null);
    setImagePreview(member.profileImage || '');
    setForm({
      name: member.user?.name || '',
      email: member.user?.email || '',
      password: '',
      phone: member.user?.phone || '',
      employeeId: member.employeeId || '',
      designation: member.designation || '',
      department: member.department || '',
      gender: member.gender || '',
      shift: member.shift || 'general',
      assignedBlock: member.assignedBlock?._id || '',
      salary: member.salary?.toString() || '',
    });
    setShowEdit(true);
  };

  // ── Add staff ──
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validate(false)) return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      const fd = buildFormData(form, imageFile);
      await createStaff(fd);
      toast.success('Staff member added');
      setShowAdd(false);
      setForm(EMPTY_FORM);
      setImageFile(null);
      setImagePreview('');
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit staff — sends ALL fields including User-level ones ──
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validate(true)) return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      const fd = buildFormData(form, imageFile);
      await updateStaff(selected._id, fd);
      toast.success('Staff updated');
      setShowEdit(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete staff permanently ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStaff(confirm.id);
      toast.success('Staff deleted permanently');
      setConfirm({ open: false, id: null });
      setStaff((prev) => prev.filter((s) => s._id !== confirm.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => { setShowAdd(false); setShowEdit(false); };

  const columns = [
    {
      key: 'name', label: 'Staff Member',
      render: r => (
        <div className="flex items-center gap-3">
          {r.profileImage ? (
            <img
              src={r.profileImage}
              alt={r.user?.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 text-sm font-semibold">
              {r.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <p className="font-medium text-dark-800">{r.user?.name}</p>
            <p className="text-xs text-dark-400">{r.user?.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'designation', label: 'Designation' },
    { key: 'assignedBlock', label: 'Block', render: r => r.assignedBlock?.name || '—' },
    { key: 'shift', label: 'Shift', render: r => <span className="capitalize">{r.shift}</span> },
    {
      key: 'status', label: 'Status',
      render: r => {
        const active = r.user?.status === 'active';
        return <Badge status={active ? 'active' : 'inactive'} label={active ? 'Active' : 'Inactive'} />;
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected(r); setShowView(true); }} className="p-1.5 rounded text-dark-400 hover:text-primary-600 hover:bg-primary-50">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirm({ open: true, id: r._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50">
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
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Manage hostel staff members and assignments</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Staff</Button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="input pl-9"
            placeholder="Search staff..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: "40px" }}
          />
        </div>
      </div>

      <div className="card p-4">
        <Table
          columns={columns} data={staff} loading={loading}
          emptyTitle="No staff found" emptyDesc="Add your first staff member"
          page={page} pages={pages} onPageChange={setPage}
        />
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Staff Member" size="lg">
        <StaffForm
          form={form} errors={errors} saving={saving} isEdit={false} blocks={blocks}
          imagePreview={imagePreview}
          set={set} onImageChange={handleImageChange} onImageRemove={handleImageRemove}
          onSubmit={handleAdd} onCancel={handleCancel}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Staff Member" size="lg">
        <StaffForm
          form={form} errors={errors} saving={saving} isEdit={true} blocks={blocks}
          imagePreview={imagePreview}
          set={set} onImageChange={handleImageChange} onImageRemove={handleImageRemove}
          onSubmit={handleEdit} onCancel={handleCancel}
        />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Staff Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {selected.profileImage ? (
                <img
                  src={selected.profileImage}
                  alt={selected.user?.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
                  {selected.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-dark-900">{selected.user?.name}</h3>
                <p className="text-dark-500">{selected.user?.email}</p>
                <Badge status={selected.user?.status === 'active' ? 'active' : 'inactive'} label={selected.user?.status === 'active' ? 'Active' : 'Inactive'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Employee ID', selected.employeeId],
                ['Designation', selected.designation],
                ['Department', selected.department || '—'],
                ['Shift', selected.shift || '—'],
                ['Assigned Block', selected.assignedBlock?.name || '—'],
                ['Phone', selected.user?.phone || '—'],
                ['Gender', selected.gender || '—'],
                ['Salary', selected.salary ? `Pkr ${selected.salary.toLocaleString()}` : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-dark-400 uppercase font-medium">{label}</p>
                  <p className="text-dark-800 font-medium capitalize">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Staff"
        message="This will permanently delete the staff member and their account. This action cannot be undone."
      />
    </div>
  );
}
