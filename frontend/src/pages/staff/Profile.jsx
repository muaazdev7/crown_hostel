import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Camera,
  Loader2, Calendar, CreditCard, Briefcase, Building2,
  Clock, DollarSign, Hash, Shield, AlertCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { getStaffProfile, updateStaffProfile, uploadStaffPhoto } from '../../api';
import toast from 'react-hot-toast';

export default function StaffProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await getStaffProfile();
      setProfile(data.data);
      initForm(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const initForm = (p) => {
    setForm({
      fullName: p.user?.name || '',
      gender: p.gender || '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
      cnic: p.cnic || '',
      address: p.address || '',
      email: p.user?.email || '',
      phone: p.user?.phone || '',
      emergencyContact: p.emergencyContact || '',
    });
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
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

    setSaving(true);
    try {
      const { data } = await updateStaffProfile(form);
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
      const { data } = await uploadStaffPhoto(formData);
      setProfile((prev) => ({ ...prev, profileImage: data.data.profileImage }));
      toast.success(data.message || 'Profile photo uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getImageSrc = () => {
    if (!profile?.profileImage) return null;
    if (profile.profileImage.startsWith('http')) return profile.profileImage;
    return profile.profileImage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-500">Could not load profile data.</p>
        <Button onClick={fetchProfile} className="mt-4">Retry</Button>
      </div>
    );
  }

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
        <div className="h-32 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              {getImageSrc() ? (
                <img
                  src={getImageSrc()}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-accent-50 flex items-center justify-center">
                  <User className="w-10 h-10 text-accent-600" />
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
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-600 text-white rounded-lg flex items-center justify-center shadow hover:bg-accent-700 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="pt-16 px-6 pb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-dark-900">{profile.user?.name}</h2>
            <Badge status={profile.user?.status} />
          </div>
          <p className="text-sm text-dark-500 mt-1">{profile.designation} — {profile.employeeId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal Information */}
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
                    className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              </div>
              <Input label="CNIC / ID Card" value={form.cnic} onChange={set('cnic')} />
              <Input label="Address" value={form.address} onChange={set('address')} />
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              <InfoRow icon={User} label="Full Name" value={profile.user?.name} />
              <InfoRow icon={User} label="Gender" value={profile.gender} capitalize />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
              <InfoRow icon={CreditCard} label="CNIC / ID Card" value={profile.cnic} />
              <InfoRow icon={MapPin} label="Address" value={profile.address} />
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="px-5 py-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-800">Contact Information</h3>
          </div>
          {editing ? (
            <div className="p-5 space-y-4">
              <Input label="Email" type="email" value={form.email} onChange={set('email')} />
              <Input label="Phone Number" value={form.phone} onChange={set('phone')} />
              <Input label="Emergency Contact" value={form.emergencyContact} onChange={set('emergencyContact')} />
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              <InfoRow icon={Mail} label="Email" value={profile.user?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={profile.user?.phone} />
              <InfoRow icon={AlertCircle} label="Emergency Contact" value={profile.emergencyContact} />
            </div>
          )}
        </div>

        {/* Staff Information (Read-Only) */}
        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
            <h3 className="font-semibold text-dark-800">Staff Information</h3>
            <span className="text-xs text-dark-400 bg-dark-50 px-2.5 py-1 rounded-full">Managed by Admin</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-dark-50">
            <div className="divide-y divide-dark-50">
              <InfoRow icon={Hash} label="Employee ID" value={profile.employeeId} />
              <InfoRow icon={Briefcase} label="Designation" value={profile.designation} />
              <InfoRow icon={Building2} label="Department" value={profile.department} />
              <InfoRow icon={Building2} label="Assigned Block" value={profile.assignedBlock?.name} />
            </div>
            <div className="divide-y divide-dark-50">
              <InfoRow icon={Clock} label="Shift" value={profile.shift} capitalize />
              <InfoRow icon={DollarSign} label="Salary" value={profile.salary ? `Rs ${profile.salary.toLocaleString()}` : null} />
              <InfoRow icon={Calendar} label="Joining Date" value={formatDate(profile.joiningDate)} />
              <InfoRow icon={Shield} label="Account Status" value={profile.user?.status} capitalize badge />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
