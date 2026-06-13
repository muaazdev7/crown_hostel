import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, ShieldAlert, Eye, Loader2, Package, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Textarea from '../../components/common/Textarea';
import {
  getInventoryReports, respondToShortageReport, actionDamageReport,
} from '../../api';
import { getImageUrl } from '../../utils/imageUrl';

const SHORTAGE_STATUSES = ['in_review', 'resolved', 'rejected'];
const DAMAGE_STATUSES = ['in_review', 'repair_scheduled', 'repaired', 'replaced', 'rejected'];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function InventoryReports() {
  const [tab, setTab]         = useState('SHORTAGE'); // 'SHORTAGE' | 'DAMAGE'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Details modal
  const [detail, setDetail]   = useState(null);

  // Respond / Action modal
  const [target, setTarget]   = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [restockQty, setRestockQty]   = useState('');
  const [saving, setSaving]   = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getInventoryReports({ type: tab, limit: 100 });
      setReports(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openAction = (r) => {
    setTarget(r);
    setStatusDraft(tab === 'SHORTAGE' ? 'in_review' : 'in_review');
    setResponseNote(r.adminResponse || '');
    setRestockQty('');
  };

  const submitAction = async () => {
    setSaving(true);
    try {
      if (target.reportType === 'SHORTAGE') {
        await respondToShortageReport(target._id, {
          status: statusDraft,
          adminResponse: responseNote,
          restockQuantity: restockQty,
        });
      } else {
        await actionDamageReport(target._id, {
          status: statusDraft,
          adminResponse: responseNote,
          restockQuantity: restockQty,
        });
      }
      toast.success('Report updated — staff notified');
      setTarget(null);
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = tab === 'SHORTAGE' ? SHORTAGE_STATUSES : DAMAGE_STATUSES;
  const showRestock =
    (target?.reportType === 'SHORTAGE' && statusDraft === 'resolved') ||
    (target?.reportType === 'DAMAGE' && statusDraft === 'replaced');

  return (
    <div className="space-y-4">
      {/* Type Tabs */}
      <div className="card p-1 flex gap-1 w-fit">
        <button
          onClick={() => setTab('SHORTAGE')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            tab === 'SHORTAGE' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" /> Shortage Reports
        </button>
        <button
          onClick={() => setTab('DAMAGE')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            tab === 'DAMAGE' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Damage Reports
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-dark-400">
            {tab === 'SHORTAGE' ? <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" /> : <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />}
            <p className="font-medium">No {tab.toLowerCase()} reports</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 border-b border-dark-100">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  {tab === 'DAMAGE' && <th className="px-4 py-3 font-medium">Severity</th>}
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.item?.image ? (
                          <img src={getImageUrl(r.item.image)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-dark-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-dark-400" />
                          </div>
                        )}
                        <span className="font-medium text-dark-800">{r.item?.name || r.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-dark-600 truncate">{r.description}</p>
                      {r.reportType === 'SHORTAGE' && (
                        <p className="text-[11px] text-dark-400">
                          Counted: {r.reportedQuantity ?? '—'} (system: {r.currentQuantity ?? '—'})
                        </p>
                      )}
                    </td>
                    {tab === 'DAMAGE' && (
                      <td className="px-4 py-3">{r.severity ? <Badge status={r.severity} /> : '—'}</td>
                    )}
                    <td className="px-4 py-3 text-dark-600">{r.reportedBy?.name || r.reportedByName || '—'}</td>
                    <td className="px-4 py-3 text-dark-500 text-xs">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetail(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <Button size="sm" onClick={() => openAction(r)}>Respond</Button>
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
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Report Details" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {detail.item?.image || detail.image ? (
                <img
                  src={getImageUrl(detail.reportType === 'DAMAGE' && detail.image ? detail.image : detail.item?.image)}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-dark-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-dark-300" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-dark-800">{detail.item?.name || detail.itemName}</h3>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dark-100 text-dark-600">{detail.reportType}</span>
                  <Badge status={detail.status} />
                </div>
                <p className="text-xs text-dark-400 mt-0.5">Reported by {detail.reportedBy?.name || detail.reportedByName} on {fmtDate(detail.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {detail.reportType === 'SHORTAGE' && (
                <>
                  <Field label="System Quantity" value={detail.currentQuantity ?? '—'} />
                  <Field label="Counted Quantity" value={detail.reportedQuantity ?? '—'} />
                </>
              )}
              {detail.reportType === 'DAMAGE' && (
                <Field label="Severity" value={detail.severity || '—'} capitalize />
              )}
              {detail.item && (
                <Field label="Current Stock" value={`${detail.item.availableQuantity ?? '—'} / ${detail.item.totalQuantity ?? '—'} ${detail.item.unit || ''}`} />
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-dark-500 mb-1">Description</p>
              <p className="text-sm text-dark-700 bg-dark-50 rounded-lg px-3 py-2">{detail.description}</p>
            </div>

            {/* Damage photo */}
            {detail.reportType === 'DAMAGE' && detail.image && (
              <div>
                <p className="text-xs font-medium text-dark-500 mb-1">Photo</p>
                <img src={getImageUrl(detail.image)} alt="Damage" className="max-h-48 rounded-lg border border-dark-200" />
              </div>
            )}

            {detail.adminResponse && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mb-1"><MessageSquare className="w-3 h-3" /> Admin Response</p>
                <p className="text-sm text-blue-800">{detail.adminResponse}</p>
                {detail.respondedBy?.name && (
                  <p className="text-[11px] text-blue-500 mt-1">— {detail.respondedBy.name}{detail.responseDate ? `, ${fmtDate(detail.responseDate)}` : ''}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
              <Button onClick={() => { setDetail(null); openAction(detail); }}>Respond</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Respond / Action Modal */}
      <Modal isOpen={!!target} onClose={() => setTarget(null)} title={target?.reportType === 'SHORTAGE' ? 'Respond to Shortage Report' : 'Action Damage Report'} size="sm">
        {target && (
          <div className="space-y-4">
            <div className="bg-dark-50 rounded-lg px-3 py-2">
              <p className="font-semibold text-dark-800 text-sm">{target.item?.name || target.itemName}</p>
              <p className="text-xs text-dark-500">{target.description}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Update Status</label>
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 capitalize"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {showRestock && (
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1">
                  {target.reportType === 'SHORTAGE' ? 'Quantity to Add to Stock' : 'Replacement Quantity to Add'}
                </label>
                <input
                  type="number" min="0"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <p className="text-[11px] text-dark-400 mt-1">This increases the item's available quantity in MongoDB.</p>
              </div>
            )}

            <Textarea
              label="Response Notes"
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Add notes for the staff member..."
              rows={3}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setTarget(null)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={submitAction}>Submit</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-xs font-medium text-dark-400">{label}</p>
      <p className={`text-dark-700 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}
