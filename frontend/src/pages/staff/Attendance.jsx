import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarCheck, ClipboardList, UserCheck, UserX, Save, Clock, Loader2 } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { getStudents, getAttendance, markAttendance, getLeaves, updateLeave } from '../../api';

const todayStr = new Date().toISOString().split('T')[0];

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('mark');
  const [loading, setLoading]     = useState(true);

  // ── Students list for marking ──────────────────────────────
  const [students, setStudents]   = useState([]);
  const [todayRecord, setTodayRecord] = useState({});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // ── History ────────────────────────────────────────────────
  const [history, setHistory]     = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState(todayStr);

  // ── Leave Management ────────────────────────────────────────
  const [leaves, setLeaves]         = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('all');
  const [viewLeave, setViewLeave]   = useState(null);

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await getStudents({ limit: 200 });
        if (data.success) {
          setStudents(data.data);
          // Initialize all as present
          const init = {};
          data.data.forEach((s) => { init[s._id] = 'present'; });
          setTodayRecord(init);

          // Check if attendance already marked today
          const { data: attData } = await getAttendance({ date: todayStr, limit: 200 });
          if (attData.success && attData.data.length > 0) {
            const existing = {};
            attData.data.forEach((r) => {
              const studentId = typeof r.student === 'object' ? r.student._id : r.student;
              existing[studentId] = r.status;
            });
            // Merge with defaults
            setTodayRecord((prev) => ({ ...prev, ...existing }));
          }
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const toggleStatus = (id) => {
    setSaved(false);
    setTodayRecord((prev) => ({ ...prev, [id]: prev[id] === 'present' ? 'absent' : 'present' }));
  };

  const markAll = (status) => {
    setSaved(false);
    const obj = {};
    students.forEach((s) => { obj[s._id] = status; });
    setTodayRecord(obj);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const records = Object.entries(todayRecord).map(([studentId, status]) => ({
        studentId, status,
      }));
      await markAttendance({ date: todayStr, records });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(todayRecord).filter((v) => v === 'present').length;
  const absentCount  = students.length - presentCount;

  // ── Fetch History ──────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const { data } = await getAttendance({ date: historyDate, limit: 200 });
      if (data.success) setHistory(data.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyDate]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  // ── Fetch Leaves ───────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    try {
      setLeavesLoading(true);
      const { data } = await getLeaves({ limit: 100 });
      if (data.success) setLeaves(data.data);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLeavesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leave') fetchLeaves();
  }, [activeTab, fetchLeaves]);

  const filteredLeaves = useMemo(() => {
    return leaveFilter === 'all' ? leaves : leaves.filter((l) => l.status === leaveFilter);
  }, [leaves, leaveFilter]);

  const updateLeaveStatus = async (id, status) => {
    try {
      const { data } = await updateLeave(id, { status });
      if (data.success) {
        setLeaves((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
      }
    } catch (err) {
      console.error('Failed to update leave:', err);
    }
  };

  const leaveCounts = {
    all:      leaves.length,
    pending:  leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary-500" /> Attendance &amp; Leave
          </h1>
          <p className="page-subtitle">Mark daily attendance and manage student leave requests</p>
        </div>
        <p className="text-sm font-medium text-dark-500 bg-dark-50 px-4 py-2 rounded-xl">
          <Clock className="w-4 h-4 inline mr-1.5 text-primary-400" />{todayStr}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-xl w-fit">
        {[
          { id: 'mark',   label: 'Mark Attendance', icon: UserCheck },
          { id: 'history',label: 'History',          icon: ClipboardList },
          { id: 'leave',  label: 'Leave Requests',   icon: CalendarCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white text-primary-600 shadow-sm' : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── MARK ATTENDANCE ── */}
      {activeTab === 'mark' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="card p-12 text-center text-dark-400">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No students found</p>
            </div>
          ) : (
            <>
              {/* Summary + Quick actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 text-sm font-medium">
                  <UserCheck className="w-4 h-4" /> Present: {presentCount}
                </div>
                <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl text-red-600 text-sm font-medium">
                  <UserX className="w-4 h-4" /> Absent: {absentCount}
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => markAll('present')} className="btn btn-secondary text-xs py-1.5">
                    All Present
                  </button>
                  <button onClick={() => markAll('absent')} className="btn btn-secondary text-xs py-1.5">
                    All Absent
                  </button>
                </div>
              </div>

              {/* Student List */}
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-dark-50 border-b border-dark-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase">Room</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-dark-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-dark-500 uppercase">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-50">
                    {students.map((s) => {
                      const name = s.user?.name || 'Unknown';
                      const room = s.room?.roomNumber || '—';
                      return (
                        <tr key={s._id} className="hover:bg-dark-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-dark-800">{name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-dark-500">{room}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge status={todayRecord[s._id]} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleStatus(s._id)}
                              className={`w-12 h-6 rounded-full transition-colors relative ${
                                todayRecord[s._id] === 'present' ? 'bg-emerald-500' : 'bg-red-400'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                                  todayRecord[s._id] === 'present' ? 'left-6' : 'left-0.5'
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Attendance Saved!' : saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
              {saved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                  <UserCheck className="w-4 h-4" />
                  Attendance for {todayStr} saved successfully — {presentCount} present, {absentCount} absent.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-dark-600">Date:</label>
            <input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="card p-12 text-center text-dark-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No attendance records for this date</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-50 border-b border-dark-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-dark-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase">Marked By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-50">
                  {history.map((r) => {
                    const name = r.student?.user?.name || 'Unknown';
                    return (
                      <tr key={r._id} className="hover:bg-dark-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-dark-800 whitespace-nowrap">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-dark-500">{r.markedBy?.name || '—'}</td>
                        <td className="px-4 py-3 text-dark-500">
                          {new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LEAVE REQUESTS ── */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          {leavesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Filter */}
              <div className="card p-1 flex flex-wrap gap-1 w-fit">
                {['all','pending','approved','rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLeaveFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      leaveFilter === s ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
                    }`}
                  >
                    {s} ({leaveCounts[s]})
                  </button>
                ))}
              </div>

              {/* Leave Cards */}
              {filteredLeaves.length === 0 ? (
                <div className="card p-12 text-center text-dark-400">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No leave requests found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredLeaves.map((l) => {
                    const studentName = l.student?.user?.name || 'Unknown';
                    return (
                      <div key={l._id} className="card p-4 space-y-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-dark-800 truncate">{studentName}</p>
                            <p className="text-xs text-dark-400 capitalize">{l.leaveType?.replace(/_/g, ' ') || 'Leave'}</p>
                          </div>
                          <Badge status={l.status} />
                        </div>

                        <div className="bg-dark-50 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-dark-400">From</span>
                            <span className="font-medium text-dark-700">{new Date(l.fromDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-400">To</span>
                            <span className="font-medium text-dark-700">{new Date(l.toDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-400">Applied</span>
                            <span className="font-medium text-dark-700">{new Date(l.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-xs text-dark-600 italic line-clamp-2">"{l.reason}"</p>

                        {l.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateLeaveStatus(l._id, 'approved')}
                              className="btn btn-primary text-xs py-1.5 flex-1"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateLeaveStatus(l._id, 'rejected')}
                              className="btn btn-secondary text-xs py-1.5 flex-1 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setViewLeave(l)}
                            className="btn btn-secondary text-xs py-1.5 w-full"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* View Leave Modal */}
      <Modal isOpen={!!viewLeave} onClose={() => setViewLeave(null)} title="Leave Request Details" size="sm">
        {viewLeave && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                {(viewLeave.student?.user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-dark-800">{viewLeave.student?.user?.name || 'Unknown'}</p>
                <p className="text-xs text-dark-400 capitalize">{viewLeave.leaveType?.replace(/_/g, ' ') || 'Leave'}</p>
              </div>
              <div className="ml-auto"><Badge status={viewLeave.status} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm bg-dark-50 rounded-xl p-3">
              <div><p className="text-xs text-dark-400">From</p><p className="font-medium">{new Date(viewLeave.fromDate).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-dark-400">To</p><p className="font-medium">{new Date(viewLeave.toDate).toLocaleDateString()}</p></div>
              <div className="col-span-2"><p className="text-xs text-dark-400">Applied On</p><p className="font-medium">{new Date(viewLeave.createdAt).toLocaleDateString()}</p></div>
              {viewLeave.destination && (
                <div className="col-span-2"><p className="text-xs text-dark-400">Destination</p><p className="font-medium">{viewLeave.destination}</p></div>
              )}
              {viewLeave.contactDuring && (
                <div className="col-span-2"><p className="text-xs text-dark-400">Contact During Leave</p><p className="font-medium">{viewLeave.contactDuring}</p></div>
              )}
            </div>
            <div>
              <p className="text-xs text-dark-400 mb-1">Reason</p>
              <p className="text-sm text-dark-700 bg-dark-50 rounded-xl p-3">{viewLeave.reason}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
