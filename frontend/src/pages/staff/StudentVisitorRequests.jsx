import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Check, X, Eye, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import { getPendingVisitorRequests, approveVisitorRequest, rejectVisitorRequest } from '../../api';

const TABS = ['all', 'pending', 'approved', 'rejected'];

export default function StudentVisitorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('pending');
  const [busyId, setBusyId]     = useState(null);

  const [detail, setDetail]     = useState(null);
  const [actionTarget, setActionTarget] = useState(null); // { req, type: 'approve'|'reject' }
  const [response, setResponse] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPendingVisitorRequests();
      setRequests(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load visitor requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = useMemo(
    () => tab === 'all' ? requests : requests.filter((r) => r.status === tab),
    [requests, tab]
  );
  const counts = useMemo(() => TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? requests.length : requests.filter((r) => r.status === t).length;
    return acc;
  }, {}), [requests]);

  const submitAction = async () => {
    const { req, type } = actionTarget;
    setBusyId(req._id);
    try {
      const fn = type === 'approve' ? approveVisitorRequest : rejectVisitorRequest;
      const { data } = await fn(req._id, { wardenResponse: response });
      setRequests((prev) => prev.map((r) => r._id === req._id ? data.data : r));
      toast.success(`Request ${type === 'approve' ? 'approved' : 'rejected'} — student notified`);
      setActionTarget(null);
      setResponse('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setBusyId(null);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="card p-1 flex flex-wrap gap-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
            }`}
          >
            {t} ({counts[t] ?? 0})
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No {tab === 'all' ? '' : tab} visitor requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Visit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-800">{r.visitorName}</p>
                      <p className="text-xs text-dark-400">{r.relationship || '—'} · {r.visitorPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-dark-700">{r.studentName}</p>
                      <p className="text-xs text-dark-400">{r.registrationNumber} · Room {r.roomNumber || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-600 text-xs">{fmtDate(r.visitDate)}{r.visitTime ? ` · ${r.visitTime}` : ''}</td>
                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetail(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setActionTarget({ req: r, type: 'approve' }); setResponse(''); }}
                              disabled={busyId === r._id}
                              className="p-1.5 rounded text-emerald-500 hover:bg-emerald-50" title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setActionTarget({ req: r, type: 'reject' }); setResponse(''); }}
                              disabled={busyId === r._id}
                              className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Visitor Request Details" size="sm">
        {detail && (
          <div className="space-y-2">
            <Row label="Visitor" value={detail.visitorName} />
            <Row label="Phone" value={detail.visitorPhone} />
            <Row label="CNIC" value={detail.visitorCNIC || '—'} />
            <Row label="Relationship" value={detail.relationship || '—'} />
            <Row label="Student" value={`${detail.studentName} (${detail.registrationNumber})`} />
            <Row label="Room" value={detail.roomNumber || '—'} />
            <Row label="Visit Date" value={fmtDate(detail.visitDate)} />
            <Row label="Visit Time" value={detail.visitTime || '—'} />
            <Row label="Purpose" value={detail.purpose || '—'} />
            <Row label="Status" value={detail.status} />
            {detail.wardenResponse && <Row label="Warden Response" value={detail.wardenResponse} />}
            {detail.approvedBy?.name && <Row label="Actioned by" value={`${detail.approvedBy.name} · ${fmtDate(detail.approvedAt)}`} />}
          </div>
        )}
      </Modal>

      {/* Approve / Reject Modal */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.type === 'approve' ? 'Approve Visitor Request' : 'Reject Visitor Request'}
        size="sm"
      >
        {actionTarget && (
          <div className="space-y-4">
            <div className="bg-dark-50 rounded-lg px-3 py-2 text-sm">
              <p className="font-semibold text-dark-800">{actionTarget.req.visitorName}</p>
              <p className="text-xs text-dark-500">Requested by {actionTarget.req.studentName} · Room {actionTarget.req.roomNumber || '—'}</p>
            </div>
            <Textarea
              label="Response to student (optional)"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={actionTarget.type === 'approve' ? 'e.g. Approved, please check in at reception.' : 'e.g. Visiting hours are over.'}
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setActionTarget(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={submitAction}
                disabled={busyId === actionTarget.req._id}
                className={`btn flex-1 ${actionTarget.type === 'approve' ? 'btn-primary' : 'btn-primary bg-red-600 hover:bg-red-700'}`}
              >
                {actionTarget.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-dark-50 pb-1.5">
      <span className="text-dark-400">{label}</span>
      <span className="text-dark-700 font-medium text-right capitalize">{value}</span>
    </div>
  );
}
