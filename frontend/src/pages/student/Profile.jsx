import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Shield, BookOpen,
  Edit3, Save, X, Camera, Heart, Droplets, Loader2,
  Calendar, CreditCard, Globe, GraduationCap, Hash,
  AlertCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { getMyProfile, updateMyProfile, uploadProfilePhoto } from '../../api';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({});
  const fileInputRef = useRef(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await getMyProfile();
      setProfile(data.data);
      initForm(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Initialize ALL form fields from profile data
  const initForm = (p) => {
    setForm({
      // Personal
      fullName: p.user?.name || '',
      gender: p.gender || '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
      cnic: p.cnic || '',
      nationality: p.nationality || '',
      // Academic
      registrationNumber: p.rollNumber || '',
      department: p.department || '',
      program: p.program || '',
      semester: p.semester?.toString() || '',
      session: p.session || '',
      batch: p.batch || '',
      cgpa: p.cgpa?.toString() || '',
      academicStatus: p.academicStatus || '',
      // Contact
      email: p.user?.email || '',
      phone: p.contactInfo?.phone || '',
      emergencyContact: p.contactInfo?.alternatePhone || '',
      guardianContact: p.guardianDetails?.phone || '',
      // Address
      street: p.contactInfo?.address?.street || '',
      city: p.contactInfo?.address?.city || '',
      state: p.contactInfo?.address?.state || '',
      pincode: p.contactInfo?.address?.pincode || '',
      // Guardian
      guardianName: p.guardianDetails?.name || '',
      guardianEmail: p.guardianDetails?.email || '',
      guardianRelation: p.guardianDetails?.relation || '',
    });
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Save profile updates
  const handleSave = async () => {
    // Validation
    if (!form.fullName?.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (form.phone && !/^\d{10,15}$/.test(form.phone.replace(/[-()\s]/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (form.cgpa && (Number(form.cgpa) < 0 || Number(form.cgpa) > 4 || isNaN(Number(form.cgpa)))) {
      toast.error('CGPA must be between 0 and 4');
      return;
    }
    if (form.semester && (Number(form.semester) < 1 || Number(form.semester) > 12 || isNaN(Number(form.semester)))) {
      toast.error('Semester must be between 1 and 12');
      return;
    }

    setSaving(true);
    try {
      const { data } = await updateMyProfile(form);
      setProfile(data.data);
      initForm(data.data);
      setEditing(false);
      toast.success(data.message || 'Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, and PNG files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const { data } = await uploadProfilePhoto(formData);
      setProfile((prev) => ({ ...prev, profileImage: data.data.profileImage }));
      toast.success(data.message || 'Profile photo uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Resolve profile image URL
  const getImageSrc = () => {
    if (!profile?.profileImage) return null;
    if (profile.profileImage.startsWith('http')) return profile.profileImage;
    return profile.profileImage;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-500">Could not load profile data.</p>
        <Button onClick={fetchProfile} className="mt-4">Retry</Button>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your personal information</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} icon={Edit3} variant="outline">Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => { setEditing(false); initForm(profile); }} icon={X} variant="outline">Cancel</Button>
            <Button onClick={handleSave} icon={Save} loading={saving}>Save Changes</Button>
          </div>
        )}
      </div>

      {/* Profile Banner Card */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              {getImageSrc() ? (
                <img
                  src={getImageSrc()}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-primary-50 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-600" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center shadow hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="pt-16 px-6 pb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-dark-900">{profile.user?.name}</h2>
            <Badge status={profile.status} />
          </div>
          <p className="text-sm text-dark-500 mt-1">{profile.department} — {profile.rollNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Personal Information ──────────────────────────────────────────── */}
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Personal Information</h3>
          </div>
          {editing ? (
            <div className="p-5 space-y-4">
              <Input label="Full Name" value={form.fullName} onChange={set('fullName')} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={set('gender')}
                    className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="CNIC / ID Card" value={form.cnic} onChange={set('cnic')} />
                <Input label="Nationality" value={form.nationality} onChange={set('nationality')} />
              </div>
              <Input label="Address" value={form.street} onChange={set('street')} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" value={form.city} onChange={set('city')} />
                <Input label="State / Province" value={form.state} onChange={set('state')} />
                <Input label="Pincode" value={form.pincode} onChange={set('pincode')} />
              </div>
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              <InfoRow icon={User} label="Full Name" value={profile.user?.name} />
              <InfoRow icon={User} label="Gender" value={profile.gender} capitalize />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
              <InfoRow icon={CreditCard} label="CNIC / ID Card" value={profile.cnic} />
              <InfoRow icon={Globe} label="Nationality" value={profile.nationality} />
              <InfoRow icon={MapPin} label="Address" value={
                [profile.contactInfo?.address?.street, profile.contactInfo?.address?.city,
                 profile.contactInfo?.address?.state, profile.contactInfo?.address?.pincode]
                  .filter(Boolean).join(', ') || null
              } />
            </div>
          )}
        </div>

        {/* ── Academic Information ─────────────────────────────────────────── */}
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Academic Information</h3>
          </div>
          {editing ? (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Registration Number" value={form.registrationNumber} onChange={set('registrationNumber')} />
                <Input label="Department" value={form.department} onChange={set('department')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Program" value={form.program} onChange={set('program')} />
                <Input label="Semester" type="number" value={form.semester} onChange={set('semester')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Session" value={form.session} onChange={set('session')} />
                <Input label="Batch" value={form.batch} onChange={set('batch')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="CGPA" type="number" step="0.01" value={form.cgpa} onChange={set('cgpa')} />
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Academic Status</label>
                  <select
                    value={form.academicStatus}
                    onChange={set('academicStatus')}
                    className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="regular">Regular</option>
                    <option value="probation">Probation</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              <InfoRow icon={Hash} label="Registration Number" value={profile.rollNumber} />
              <InfoRow icon={BookOpen} label="Department" value={profile.department} />
              <InfoRow icon={GraduationCap} label="Program" value={profile.program} />
              <InfoRow icon={BookOpen} label="Semester" value={profile.semester} />
              <InfoRow icon={Calendar} label="Session" value={profile.session} />
              <InfoRow icon={BookOpen} label="Batch" value={profile.batch} />
              <InfoRow icon={BookOpen} label="CGPA" value={profile.cgpa} />
              <InfoRow icon={Shield} label="Academic Status" value={profile.academicStatus} capitalize badge />
            </div>
          )}
        </div>

        {/* ── Contact Information ──────────────────────────────────────────── */}
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Contact Information</h3>
          </div>
          {editing ? (
            <div className="p-5 space-y-4">
              <Input label="Email" type="email" value={form.email} onChange={set('email')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone Number" value={form.phone} onChange={set('phone')} />
                <Input label="Emergency Contact" value={form.emergencyContact} onChange={set('emergencyContact')} />
              </div>
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              <InfoRow icon={Mail} label="Email" value={profile.user?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={profile.contactInfo?.phone} />
              <InfoRow icon={AlertCircle} label="Emergency Contact" value={profile.contactInfo?.alternatePhone} />
            </div>
          )}
        </div>

        {/* ── Guardian Details ─────────────────────────────────────────────── */}
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Guardian Details</h3>
          </div>
          {editing ? (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Guardian Name" value={form.guardianName} onChange={set('guardianName')} />
                <Input label="Relation" value={form.guardianRelation} onChange={set('guardianRelation')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Guardian Contact" value={form.guardianContact} onChange={set('guardianContact')} />
                <Input label="Guardian Email" value={form.guardianEmail} onChange={set('guardianEmail')} />
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-dark-50">
                <InfoRow icon={Heart} label={`Name (${profile.guardianDetails?.relation || '—'})`} value={profile.guardianDetails?.name} />
                <InfoRow icon={Phone} label="Contact" value={profile.guardianDetails?.phone} />
                <InfoRow icon={Mail} label="Email" value={profile.guardianDetails?.email} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable read-only info row component
function InfoRow({ icon: Icon, label, value, capitalize, badge }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-8 h-8 bg-dark-50 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-dark-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-dark-400">{label}</p>
        {badge && value ? (
          <Badge status={value} />
        ) : (
          <p className={`text-sm font-medium text-dark-800 ${capitalize ? 'capitalize' : ''}`}>
            {value || '—'}
          </p>
        )}
      </div>
    </div>
  );
}
