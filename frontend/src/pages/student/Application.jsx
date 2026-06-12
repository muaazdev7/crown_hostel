import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Send, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Upload, Building2,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

// Room preference card images (local frontend assets)
import roomSingleImg from '../../assets/rooms/rom1.jpg';
import roomDoubleImg from '../../assets/rooms/room2.jpg';
import roomTripleImg from '../../assets/rooms/room3.jpg';

const ROOM_IMAGES = {
  single: roomSingleImg, // 1 person
  double: roomDoubleImg, // 2 persons
  triple: roomTripleImg, // 3 persons
};
import { submitApplication, getMyApplications } from '../../api';
import toast from 'react-hot-toast';

const INITIAL = {
  registrationNo: '', department: '', semester: '', gender: '',
  phone: '', alternatePhone: '',
  street: '', city: '', state: '', postalcode: '',
  guardianName: '', guardianPhone: '', guardianRelation: '',
  preferredRoomType: 'double',
  hasCondition: false, medicalDetails: '',
  termsAccepted: false,
};

export default function ApplicationPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [docs, setDocs] = useState([]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyApplications();
      setApplications(res.data.data);
    } catch {
      // Silently fail — student may have no applications yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.registrationNo.trim()) e.registrationNo = 'Required';
    if (!form.department.trim()) e.department = 'Required';
    if (!form.semester) e.semester = 'Required';
    if (!form.gender) e.gender = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.guardianName.trim()) e.guardianName = 'Required';
    if (!form.guardianPhone.trim()) e.guardianPhone = 'Required';
    if (!form.termsAccepted) e.termsAccepted = 'You must accept the terms';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      // Build payload matching backend validator structure
      const payload = {
        applicantName: user?.name || 'Student',
        applicantEmail: user?.email || '',
        registrationNo: form.registrationNo,
        department: form.department,
        semester: parseInt(form.semester),
        gender: form.gender,
        contactInfo: {
          phone: form.phone,
          alternatePhone: form.alternatePhone || undefined,
          address: {
            street: form.street || undefined,
            city: form.city || undefined,
            state: form.state || undefined,
            pincode: form.postalcode || undefined,
          },
        },
        guardianDetails: {
          name: form.guardianName,
          phone: form.guardianPhone,
          relation: form.guardianRelation || undefined,
        },
        preferredRoomType: form.preferredRoomType,
        medicalInfo: form.hasCondition ? {
          hasCondition: true,
          details: form.medicalDetails,
        } : { hasCondition: false },
        termsAccepted: true,
      };

      await submitApplication(payload);
      toast.success('Application submitted successfully!');
      setShowForm(false);
      setForm(INITIAL);
      setDocs([]);
      setErrors({});
      fetchApplications();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application';
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors && Array.isArray(fieldErrors)) {
        toast.error(fieldErrors.map(e => e.message).join(', '));
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocs(files.map(f => f.name));
  };

  const hasPending = applications.some(a => a.status === 'pending');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Room Application</h1>
          <p className="page-subtitle">Apply for hostel room allocation</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} icon={ClipboardList} disabled={hasPending}>
            {hasPending ? 'Application Pending' : 'New Application'}
          </Button>
        )}
      </div>

      {/* Application Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Room Application Form" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Academic Info */}
          <div>
            <h4 className="text-sm font-semibold text-dark-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-500" /> Academic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input label="Registration No *" value={form.registrationNo} onChange={set('registrationNo')} error={errors.registrationNo} placeholder="CS-2024-042" />
              <Input label="Department *" value={form.department} onChange={set('department')} error={errors.department} placeholder="Computer Science" />
              <Select label="Semester *" value={form.semester} onChange={set('semester')} error={errors.semester}>
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select label="Gender *" value={form.gender} onChange={set('gender')} error={errors.gender}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-dark-700 mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Phone *" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="9876543210" />
              <Input label="Alternate Phone (optional)" value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
              <Input label="Street" value={form.street} onChange={set('street')} placeholder="Street" />
              <Input label="City" value={form.city} onChange={set('city')} placeholder="City" />
              <Input label="State" value={form.state} onChange={set('state')} placeholder="State" />
              <Input label="Postalcode" value={form.postalcode} onChange={set('postalcode')} placeholder="54000" />
            </div>
          </div>

          {/* Guardian */}
          <div>
            <h4 className="text-sm font-semibold text-dark-700 mb-3">Guardian Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Guardian Name *" value={form.guardianName} onChange={set('guardianName')} error={errors.guardianName} placeholder="Full name" />
              <Input label="Guardian Phone *" value={form.guardianPhone} onChange={set('guardianPhone')} error={errors.guardianPhone} placeholder="Phone" />
              <Input label="Relation" value={form.guardianRelation} onChange={set('guardianRelation')} placeholder="Father / Mother" />
            </div>
          </div>

          {/* Room Type */}
          <div>
            <h4 className="text-sm font-semibold text-dark-700 mb-3">Room Preference</h4>
            <div className="grid grid-cols-3 gap-3">
              {['single', 'double', 'triple'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, preferredRoomType: type }))}
                  className={`overflow-hidden rounded-xl border-2 text-center transition-all ${
                    form.preferredRoomType === type
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-300'
                      : 'border-dark-200 hover:border-dark-300'
                  }`}
                >
                  <img
                    src={ROOM_IMAGES[type]}
                    alt={`${type} room`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-sm font-semibold capitalize text-dark-800">{type}</p>
                    <p className="text-xs text-dark-400">{type === 'single' ? '1 person' : type === 'double' ? '2 persons' : '3 persons'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Medical Info */}
          <div>
            <h4 className="text-sm font-semibold text-dark-700 mb-3">Medical Information (Optional)</h4>
            <label className="flex items-center gap-2 text-sm text-dark-600 mb-2">
              <input type="checkbox" checked={form.hasCondition} onChange={set('hasCondition')} className="rounded border-dark-300 text-primary-600" />
              I have a medical condition to report
            </label>
            {form.hasCondition && (
              <Textarea value={form.medicalDetails} onChange={set('medicalDetails')} placeholder="Describe your medical condition..." rows={2} />
            )}
          </div>

          {/* Documents */}
          <div>
            <h4 className="text-sm font-semibold text-dark-700 mb-3">Upload Documents</h4>
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-dark-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
              <Upload className="w-5 h-5 text-dark-400" />
              <span className="text-sm text-dark-500">Click to upload ID / admission letter</span>
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            {docs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {docs.map((d, i) => (
                  <span key={i} className="text-xs bg-dark-100 text-dark-600 px-2 py-1 rounded-lg">{d}</span>
                ))}
              </div>
            )}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm text-dark-600">
            <input type="checkbox" checked={form.termsAccepted} onChange={set('termsAccepted')} className="rounded border-dark-300 text-primary-600 mt-0.5" />
            <span>I agree to the hostel rules, terms & conditions, and confirm all information is accurate.</span>
          </label>
          {errors.termsAccepted && <p className="text-xs text-red-500 -mt-3">{errors.termsAccepted}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" icon={Send} loading={saving}>Submit Application</Button>
          </div>
        </form>
      </Modal>

      {/* Application History */}
      <div className="card">
        <div className="px-5 py-4 border-b border-dark-100">
          <h3 className="font-semibold text-dark-800">Application History</h3>
        </div>

        {loading ? (
          <div className="space-y-0 divide-y divide-dark-50">
            {[1, 2].map(i => <div key={i} className="h-20 animate-pulse bg-dark-50" />)}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">No applications yet</p>
            <p className="text-dark-400 text-sm mt-1">Submit your first room application to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-50">
            {applications.map(app => {
              const expanded = expandedId === app._id;
              return (
                <div key={app._id} className="hover:bg-dark-50/30 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : app._id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      app.status === 'approved' ? 'bg-emerald-100 text-emerald-600'
                        : app.status === 'rejected' ? 'bg-red-100 text-red-600'
                        : app.status === 'pending' ? 'bg-amber-100 text-amber-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {app.status === 'approved' ? <CheckCircle className="w-5 h-5" />
                        : app.status === 'rejected' ? <XCircle className="w-5 h-5" />
                        : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark-800">
                          {app.preferredRoomType?.charAt(0).toUpperCase() + app.preferredRoomType?.slice(1)} Room — Sem {app.semester}
                        </p>
                        <Badge status={app.status} />
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">
                        Applied {new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {app.assignedRoom && ` — Room: ${app.assignedRoom.roomNumber || app.assignedRoom}`}
                      </p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                  </div>

                  {expanded && (
                    <div className="px-5 pb-4 animate-fade-in">
                      <div className="bg-dark-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-dark-400">Registration No</p>
                          <p className="font-medium text-dark-800">{app.registrationNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Department</p>
                          <p className="font-medium text-dark-800">{app.department}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Room Type</p>
                          <p className="font-medium text-dark-800 capitalize">{app.preferredRoomType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Assigned Room</p>
                          <p className="font-medium text-dark-800">{app.assignedRoom?.roomNumber || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Applied On</p>
                          <p className="font-medium text-dark-800">{new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Reviewed On</p>
                          <p className="font-medium text-dark-800">{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : '—'}</p>
                        </div>
                        {app.remarks && (
                          <div className="col-span-2">
                            <p className="text-xs text-dark-400">Remarks</p>
                            <p className="font-medium text-dark-800">{app.remarks}</p>
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
    </div>
  );
}
