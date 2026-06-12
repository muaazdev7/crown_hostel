import { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle, XCircle, ClipboardList, Search, Home, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getApplications,
  approveApplication, rejectApplication, assignApplicationRoom, deleteApplication,
  getRooms,
} from '../../api';

const STATUSES = ['pending', 'approved', 'rejected'];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [showView, setShowView] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showAssignRoom, setShowAssignRoom] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', remarks: '' });
  const [saving, setSaving] = useState(false);

  // Room assignment
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomRemarks, setRoomRemarks] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Delete
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await getApplications(params);
      setApplications(res.data.data);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // ── Review (approve/reject) ──

  const handleReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (reviewForm.status === 'approved') {
        await approveApplication(selected._id, { remarks: reviewForm.remarks });
      } else {
        await rejectApplication(selected._id, { remarks: reviewForm.remarks });
      }
      toast.success(`Application ${reviewForm.status}`);
      setShowReview(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Assign Room ──

  const openAssignRoom = async (app) => {
    setSelected(app);
    setSelectedRoomId('');
    setRoomRemarks('');
    setShowAssignRoom(true);
    setLoadingRooms(true);
    try {
      const res = await getRooms({ status: 'available', limit: 100 });
      setRooms(res.data.data || []);
    } catch {
      toast.error('Failed to load available rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleAssignRoom = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) return toast.error('Please select a room');
    setSaving(true);
    try {
      await assignApplicationRoom(selected._id, { roomId: selectedRoomId, remarks: roomRemarks });
      toast.success('Room assigned successfully');
      setShowAssignRoom(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign room');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteApplication(confirm.id);
      toast.success('Application deleted');
      setConfirm({ open: false, id: null });
      // Remove from UI instantly
      setApplications(prev => prev.filter(app => app._id !== confirm.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'applicantName', label: 'Applicant',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 text-sm font-semibold">
            {r.applicantName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-dark-800">{r.applicantName}</p>
            <p className="text-xs text-dark-400">{r.applicantEmail || r.registrationNo}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', label: 'Department' },
    { key: 'semester', label: 'Semester', render: r => r.semester ? `Sem ${r.semester}` : '—' },
    {
      key: 'preferredRoomType', label: 'Room Type',
      render: r => <span className="capitalize">{r.preferredRoomType || '—'}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: r => <Badge status={r.status} />,
    },
    {
      key: 'assignedRoom', label: 'Assigned Room',
      render: r => r.assignedRoom?.roomNumber || '—',
    },
    {
      key: 'createdAt', label: 'Applied On',
      render: r => new Date(r.appliedAt || r.createdAt).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected(r); setShowView(true); }} className="p-1.5 rounded text-dark-400 hover:text-primary-600 hover:bg-primary-50" title="View">
            <Eye className="w-4 h-4" />
          </button>
          {r.status === 'pending' && (
            <>
              <button
                onClick={() => { setSelected(r); setReviewForm({ status: 'approved', remarks: '' }); setShowReview(true); }}
                className="p-1.5 rounded text-dark-400 hover:text-emerald-600 hover:bg-emerald-50"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setSelected(r); setReviewForm({ status: 'rejected', remarks: '' }); setShowReview(true); }}
                className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {r.status === 'approved' && !r.assignedRoom && (
            <button
              onClick={() => openAssignRoom(r)}
              className="px-2.5 py-1 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Home className="w-3 h-3 inline mr-1" />
              Assign Room
            </button>
          )}
          <button
            onClick={() => setConfirm({ open: true, id: r._id })}
            className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
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
          <h1 className="page-title">Room Applications</h1>
          <p className="page-subtitle">Review and process hostel admission applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or registration..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="card p-4">
        <Table
          columns={columns} data={applications} loading={loading}
          emptyTitle="No applications" emptyDesc="Applications will appear here when submitted"
          page={page} pages={pages} onPageChange={setPage}
        />
      </div>

      {/* View Modal */}
      <Modal isOpen={showView} onClose={() => setShowView(false)} title="Application Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                {selected.applicantName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark-900">{selected.applicantName}</h3>
                <p className="text-dark-500 text-sm">{selected.applicantEmail}</p>
                <Badge status={selected.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Registration No', selected.registrationNo],
                ['Department', selected.department],
                ['Semester', selected.semester ? `Sem ${selected.semester}` : '—'],
                ['Gender', selected.gender || '—'],
                ['Phone', selected.contactInfo?.phone || '—'],
                ['Room Type', selected.preferredRoomType || '—'],
                ['Preferred Block', selected.preferredBlock?.name || '—'],
                ['Assigned Room', selected.assignedRoom?.roomNumber || '—'],
                ['Applied On', new Date(selected.appliedAt || selected.createdAt).toLocaleDateString('en-IN')],
                ['Reviewed On', selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleDateString('en-IN') : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-dark-400 uppercase font-medium">{label}</p>
                  <p className="text-dark-800 font-medium capitalize">{val}</p>
                </div>
              ))}
            </div>
            {selected.guardianDetails && (
              <div>
                <p className="text-xs text-dark-400 uppercase font-medium mb-1">Guardian</p>
                <p className="text-sm text-dark-700">
                  {selected.guardianDetails.name} ({selected.guardianDetails.relation || 'Guardian'}) — {selected.guardianDetails.phone}
                </p>
              </div>
            )}
            {selected.medicalInfo?.hasCondition && (
              <div>
                <p className="text-xs text-dark-400 uppercase font-medium mb-1">Medical Info</p>
                <p className="text-sm text-dark-700 p-3 bg-amber-50 rounded-xl">{selected.medicalInfo.details}</p>
              </div>
            )}
            {selected.remarks && (
              <div>
                <p className="text-xs text-dark-400 uppercase font-medium mb-1">Remarks</p>
                <p className="text-sm text-dark-700 p-3 bg-dark-50 rounded-xl">{selected.remarks}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {selected.status === 'pending' && (
                <Button className="flex-1" onClick={() => { setShowView(false); setReviewForm({ status: 'approved', remarks: '' }); setShowReview(true); }}>
                  Review Application
                </Button>
              )}
              {selected.status === 'approved' && !selected.assignedRoom && (
                <Button className="flex-1" onClick={() => { setShowView(false); openAssignRoom(selected); }}>
                  Assign Room
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Review Application" size="sm">
        {selected && (
          <form onSubmit={handleReview} className="space-y-4">
            <div className="p-3 bg-dark-50 rounded-xl text-sm">
              <p className="font-medium text-dark-800">{selected.applicantName}</p>
              <p className="text-dark-500">{selected.department} · Sem {selected.semester}</p>
            </div>
            <Select label="Decision" value={reviewForm.status} onChange={e => setReviewForm(f => ({ ...f, status: e.target.value }))}>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </Select>
            <div>
              <label className="label">Remarks</label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Optional remarks for the applicant..."
                value={reviewForm.remarks}
                onChange={e => setReviewForm(f => ({ ...f, remarks: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowReview(false)}>Cancel</Button>
              <Button type="submit" loading={saving} variant={reviewForm.status === 'rejected' ? 'danger' : 'primary'}>
                {reviewForm.status === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Assign Room Modal */}
      <Modal isOpen={showAssignRoom} onClose={() => setShowAssignRoom(false)} title="Assign Room" size="sm">
        {selected && (
          <form onSubmit={handleAssignRoom} className="space-y-4">
            <div className="p-3 bg-dark-50 rounded-xl text-sm">
              <p className="font-medium text-dark-800">{selected.applicantName}</p>
              <p className="text-dark-500">Preferred: <span className="capitalize">{selected.preferredRoomType}</span></p>
            </div>
            {loadingRooms ? (
              <div className="h-10 bg-dark-50 animate-pulse rounded-xl" />
            ) : (
              <Select label="Select Room *" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
                <option value="">Choose a room</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.roomNumber} — {r.type} ({r.currentOccupancy || 0}/{r.capacity})
                  </option>
                ))}
              </Select>
            )}
            <div>
              <label className="label">Remarks</label>
              <textarea
                className="input min-h-[60px] resize-none"
                placeholder="Optional notes..."
                value={roomRemarks}
                onChange={e => setRoomRemarks(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAssignRoom(false)}>Cancel</Button>
              <Button type="submit" loading={saving} icon={Home}>Assign Room</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Application"
        message="This will permanently delete this application. This action cannot be undone."
      />
    </div>
  );
}
