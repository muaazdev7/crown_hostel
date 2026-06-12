import { useState, useEffect, useCallback } from 'react';
import { Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicAnnouncements } from '../../api';
import { useAuth } from '../../context/AuthContext';

const ROLE_STYLE = {
  all: 'bg-primary-50 text-primary-700',
  student: 'bg-accent-50 text-accent-700',
  staff: 'bg-amber-50 text-amber-700',
};

const ROLE_LABEL = { all: 'Everyone', student: 'Students', staff: 'Staff' };

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPublicAnnouncements({ role: user?.role || 'student' });
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Latest notices and updates from administration</p>
        </div>
      </div>

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
          <p className="text-dark-400 text-sm mt-1">There are no announcements at this time. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className="card p-5">
              <div className="flex items-start gap-3">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
