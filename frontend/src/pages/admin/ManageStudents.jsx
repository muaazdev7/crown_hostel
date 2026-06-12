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
import { getStudents, createStudent, updateStudent, deleteStudent, unassignStudentRoom } from '../../api';

const DEPTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'IT', 'Chemical'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Default empty form — matches backend model structure
const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '', rollNumber: '',
  department: '', year: '', semester: '', gender: '', bloodGroup: '',
  guardianDetails: { name: '', phone: '', email: '', relation: '' },
  contactInfo: { phone: '', alternatePhone: '', address: { street: '', city: '', state: '', postalcode: '' } },
};

// Helper: build a FormData object from form state + optional file
function buildFormData(form, imageFile) {
  const fd = new FormData();

  // Flat text fields
  fd.append('name', form.name);
  fd.append('email', form.email);
  if (form.password) fd.append('password', form.password);
  fd.append('phone', form.phone);
  fd.append('rollNumber', form.rollNumber);
  fd.append('department', form.department);
  if (form.year) fd.append('year', Number(form.year));
  if (form.semester) fd.append('semester', Number(form.semester));
  if (form.gender) fd.append('gender', form.gender);
  if (form.bloodGroup) fd.append('bloodGroup', form.bloodGroup);

  // Nested objects must be sent as JSON strings for multer requests
  fd.append('guardianDetails', JSON.stringify(form.guardianDetails));
  fd.append('contactInfo', JSON.stringify(form.contactInfo));

  // Image file (field name must match backend: 'profileImage')
  if (imageFile) {
    fd.append('profileImage', imageFile);
  }

  return fd;
}

// ── StudentForm defined OUTSIDE the parent to prevent re-mount on every keystroke ──
function StudentForm({ form, errors, saving, isEdit, imagePreview, set, setGuardian, setContactAddr, onImageChange, onImageRemove, onSubmit, onCancel }) {
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

      {/* Account Info */}
      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Account Info</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="John Doe" error={errors.name} />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="student@hostel.com" error={errors.email} />
        <Input label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 chars" error={errors.password} />
        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
      </div>

      {/* Academic Info */}
      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mt-2">Academic Info</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Roll Number *" value={form.rollNumber} onChange={set('rollNumber')} error={errors.rollNumber} />
        <Select label="Department *" value={form.department} onChange={set('department')} error={errors.department}>
          <option value="">Select</option>
          {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select label="Year *" value={form.year} onChange={set('year')} error={errors.year}>
          <option value="">Select</option>
          {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </Select>
        <Select label="Semester" value={form.semester} onChange={set('semester')}>
          <option value="">Select</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
        </Select>
        <Select label="Gender" value={form.gender} onChange={set('gender')}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
        <Select label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')}>
          <option value="">Select</option>
          {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      </div>

      {/* Guardian Info */}
      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mt-2">Guardian Info</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Guardian Name" value={form.guardianDetails.name} onChange={setGuardian('name')} />
        <Input label="Guardian Phone" value={form.guardianDetails.phone} onChange={setGuardian('phone')} />
        <Input label="Guardian Email" value={form.guardianDetails.email} onChange={setGuardian('email')} />
        <Input label="Relation" value={form.guardianDetails.relation} onChange={setGuardian('relation')} />
      </div>

      {/* Address */}
      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mt-2">Address</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Street" value={form.contactInfo.address.street} onChange={setContactAddr('street')} />
        <Input label="City" value={form.contactInfo.address.city} onChange={setContactAddr('city')} />
        <Input label="State" value={form.contactInfo.address.state} onChange={setContactAddr('state')} />
        <Input label="Postalcode" value={form.contactInfo.address.postalcode} onChange={setContactAddr('postalcode')} />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{isEdit ? 'Update Student' : 'Add Student'}</Button>
      </div>
    </form>
  );
}

export default function ManageStudents() {
  // ── List state ──
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // ── Modal state ──
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  // ── Image upload state ──
  const [imageFile, setImageFile] = useState(null);       // File object to send
  const [imagePreview, setImagePreview] = useState('');    // blob URL for preview

  // ── Fetch students ──
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filterDept) params.department = filterDept;
      if (filterYear) params.year = filterYear;
      const res = await getStudents(params);
      setStudents(res.data.data);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterYear]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Form change handlers ──
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setGuardian = (field) => (e) => {
    setForm((f) => ({ ...f, guardianDetails: { ...f.guardianDetails, [field]: e.target.value } }));
  };

  const setContactAddr = (field) => (e) => {
    setForm((f) => ({
      ...f,
      contactInfo: {
        ...f.contactInfo,
        address: { ...f.contactInfo.address, [field]: e.target.value },
      },
    }));
  };

  // ── Image handlers ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview('');
  };

  // ── Reset form + image state ──
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setImageFile(null);
    setImagePreview('');
  };

  // ── Validate required fields ──
  const validate = (isEdit) => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!isEdit && !form.password.trim()) errs.password = 'Password is required';
    if (!form.rollNumber.trim()) errs.rollNumber = 'Roll number is required';
    if (!form.department) errs.department = 'Department is required';
    if (!form.year) errs.year = 'Year is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Open Add modal ──
  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  // ── Open Edit modal — pre-fill ALL fields from selected student ──
  const openEdit = (student) => {
    setSelected(student);
    setErrors({});
    setImageFile(null);
    // Show existing profile image as preview (if any)
    setImagePreview(student.profileImage || '');
    setForm({
      name: student.user?.name || '',
      email: student.user?.email || '',
      password: '',
      phone: student.user?.phone || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      year: student.year?.toString() || '',
      semester: student.semester?.toString() || '',
      gender: student.gender || '',
      bloodGroup: student.bloodGroup || '',
      guardianDetails: {
        name: student.guardianDetails?.name || '',
        phone: student.guardianDetails?.phone || '',
        email: student.guardianDetails?.email || '',
        relation: student.guardianDetails?.relation || '',
      },
      contactInfo: {
        phone: student.contactInfo?.phone || '',
        alternatePhone: student.contactInfo?.alternatePhone || '',
        address: {
          street: student.contactInfo?.address?.street || '',
          city: student.contactInfo?.address?.city || '',
          state: student.contactInfo?.address?.state || '',
          postalcode: student.contactInfo?.address?.postalcode || '',
        },
      },
    });
    setShowEdit(true);
  };

  // ── Add student (sends FormData with optional image) ──
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validate(false)) return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      const fd = buildFormData(form, imageFile);
      await createStudent(fd);
      toast.success('Student added successfully');
      setShowAdd(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit student (sends FormData with optional image) ──
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validate(true)) return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      const fd = buildFormData(form, imageFile);
      await updateStudent(selected._id, fd);
      toast.success('Student updated successfully');
      setShowEdit(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete student permanently ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(confirm.id);
      toast.success('Student deleted permanently');
      setConfirm({ open: false, id: null });
      setStudents((prev) => prev.filter((s) => s._id !== confirm.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Unassign room ──
  const [confirmUnassign, setConfirmUnassign] = useState({ open: false, id: null });
  const [unassigning, setUnassigning] = useState(false);

  const handleUnassignRoom = async () => {
    setUnassigning(true);
    try {
      const res = await unassignStudentRoom(confirmUnassign.id);
      toast.success('Room unassigned successfully');
      setConfirmUnassign({ open: false, id: null });
      // Update the selected student in-place so the View modal refreshes
      setSelected(res.data.data);
      // Update the student list
      setStudents((prev) => prev.map((s) => s._id === res.data.data._id ? res.data.data : s));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign room');
    } finally {
      setUnassigning(false);
    }
  };

  // ── Table columns ──
  const columns = [
    {
      key: 'name', label: 'Student',
      render: (r) => (
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
    { key: 'rollNumber', label: 'Roll No' },
    { key: 'department', label: 'Department' },
    { key: 'year', label: 'Year', render: (r) => `Year ${r.year}` },
    {
      key: 'room', label: 'Room',
      render: (r) => r.room?.roomNumber
        ? <span className="font-medium text-dark-800">{r.room.roomNumber}</span>
        : <Badge status="inactive" label="Not Allocated" />,
    },
    {
      key: 'status', label: 'Status',
      render: (r) => {
        const active = r.user?.status === 'active';
        return <Badge status={active ? 'active' : 'inactive'} label={active ? 'Active' : 'Inactive'} />;
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
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

  // Cancel handler for form modals
  const handleCancel = () => { setShowAdd(false); setShowEdit(false); };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">Add, update and manage hostel students</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Student</Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="input pl-9"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <Select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }} className="w-44">
          <option value="">All Departments</option>
          {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }} className="w-32">
          <option value="">All Years</option>
          {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="card p-4">
        <Table
          columns={columns} data={students} loading={loading}
          emptyTitle="No students found" emptyDesc="Add your first student to get started"
          page={page} pages={pages} onPageChange={setPage}
        />
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Student" size="xl">
        <StudentForm
          form={form} errors={errors} saving={saving} isEdit={false}
          imagePreview={imagePreview}
          set={set} setGuardian={setGuardian} setContactAddr={setContactAddr}
          onImageChange={handleImageChange} onImageRemove={handleImageRemove}
          onSubmit={handleAdd} onCancel={handleCancel}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Student" size="xl">
        <StudentForm
          form={form} errors={errors} saving={saving} isEdit={true}
          imagePreview={imagePreview}
          set={set} setGuardian={setGuardian} setContactAddr={setContactAddr}
          onImageChange={handleImageChange} onImageRemove={handleImageRemove}
          onSubmit={handleEdit} onCancel={handleCancel}
        />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Student Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {selected.profileImage ? (
                <img
                  src={selected.profileImage}
                  alt={selected.user?.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                  {selected.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-dark-900">{selected.user?.name}</h3>
                <p className="text-dark-500">{selected.user?.email}</p>
                <Badge status={selected.user?.status === 'active' ? 'active' : 'inactive'} label={selected.user?.status === 'active' ? 'Active' : 'Inactive'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Roll Number', selected.rollNumber],
                ['Department', selected.department],
                ['Year', `Year ${selected.year}`],
                ['Semester', selected.semester ? `Sem ${selected.semester}` : '—'],
                ['Gender', selected.gender || '—'],
                ['Blood Group', selected.bloodGroup || '—'],
                ['Phone', selected.user?.phone || '—'],
                ['Room', selected.room?.roomNumber || 'Not allocated'],
                ['Guardian', selected.guardianDetails?.name || '—'],
                ['Guardian Phone', selected.guardianDetails?.phone || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-dark-400 text-xs uppercase font-medium">{label}</p>
                  <p className="text-dark-800 font-medium">{val}</p>
                </div>
              ))}
            </div>
            {/* Unassign Room Button */}
            <div className="pt-2 border-t border-dark-100">
              <button
                type="button"
                disabled={!selected.room}
                onClick={() => setConfirmUnassign({ open: true, id: selected._id })}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Unassign Room
              </button>
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
        title="Delete Student"
        message="This will permanently delete the student and their account from the database. This action cannot be undone."
      />

      {/* Unassign Room Confirmation */}
      <ConfirmDialog
        isOpen={confirmUnassign.open}
        onClose={() => setConfirmUnassign({ open: false, id: null })}
        onConfirm={handleUnassignRoom}
        loading={unassigning}
        title="Unassign Room"
        message="Are you sure you want to unassign this student's room? The room will become available for other students."
      />
    </div>
  );
}
