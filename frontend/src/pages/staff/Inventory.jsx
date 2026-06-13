import { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, AlertTriangle, ShieldAlert, Loader2,
  ClipboardList, TrendingDown, Upload, X, MessageSquare,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import {
  getInventory, createShortageReport, createDamageReport, getMyInventoryReports,
} from '../../api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';

export default function Inventory() {
  const [tab, setTab]               = useState('items'); // 'items' | 'reports'
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  // Shortage report modal
  const [shortageItem, setShortageItem] = useState(null);
  const [shortageQty, setShortageQty]   = useState('');
  const [shortageDesc, setShortageDesc] = useState('');

  // Damage report modal
  const [damageItem, setDamageItem]     = useState(null);
  const [damageDesc, setDamageDesc]     = useState('');
  const [damageSeverity, setDamageSeverity] = useState('minor');
  const [damageImage, setDamageImage]   = useState(null);
  const [damagePreview, setDamagePreview] = useState('');

  const [saving, setSaving]         = useState(false);

  // My Reports
  const [reports, setReports]       = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => { fetchInventory(); }, []);
  useEffect(() => { if (tab === 'reports') fetchReports(); }, [tab]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await getInventory({ limit: 100 });
      setItems(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const { data } = await getMyInventoryReports();
      setReports(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) =>
      !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Report Shortage ──
  const openShortage = (item) => { setShortageItem(item); setShortageQty(''); setShortageDesc(''); };

  const submitShortage = async () => {
    if (!shortageDesc.trim()) return toast.error('Please describe the shortage');
    setSaving(true);
    try {
      await createShortageReport({
        itemId: shortageItem._id,
        reportedQuantity: shortageQty,
        description: shortageDesc,
      });
      setShortageItem(null);
      toast.success('Shortage reported — admin notified');
      if (tab === 'reports') fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report shortage');
    } finally {
      setSaving(false);
    }
  };

  // ── Report Damage ──
  const openDamage = (item) => {
    setDamageItem(item); setDamageDesc(''); setDamageSeverity('minor');
    setDamageImage(null); setDamagePreview('');
  };

  const handleDamageImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDamageImage(file);
    setDamagePreview(URL.createObjectURL(file));
  };

  const submitDamage = async () => {
    if (!damageDesc.trim()) return toast.error('Please describe the damage');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('itemId', damageItem._id);
      fd.append('description', damageDesc);
      fd.append('severity', damageSeverity);
      if (damageImage) fd.append('image', damageImage);
      await createDamageReport(fd);
      setDamageItem(null);
      toast.success('Damage reported — admin notified');
      if (tab === 'reports') fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report damage');
    } finally {
      setSaving(false);
    }
  };

  const shortageCount = items.filter((i) => i.isLowStock).length;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package className="w-6 h-6 text-accent-500" /> Inventory
          </h1>
          <p className="page-subtitle">Track stock levels and report shortages or damage</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {shortageCount > 0 && (
            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> {shortageCount} Low Stock
            </span>
          )}
          <span className="bg-dark-50 text-dark-600 text-xs font-medium px-3 py-1.5 rounded-full">
            {items.length} Total Items
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="card p-1 flex gap-1 w-fit">
        <button
          onClick={() => setTab('items')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'items' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Inventory Items
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'reports' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> My Reports
        </button>
      </div>

      {tab === 'items' && (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Cards — Name, Category, Quantity, Available, Location, Last Updated */}
          {filtered.length === 0 ? (
            <div className="card p-12 text-center text-dark-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div key={item._id} className="card overflow-hidden hover:scale-[1.02] transition-transform duration-200">
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-dark-100 flex items-center justify-center">
                        <Package className="w-10 h-10 text-dark-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent" />
                    {item.isLowStock && (
                      <div className="absolute top-2 right-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-2.5 h-2.5" /> LOW STOCK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <div>
                      <h3 className="text-sm font-semibold text-dark-800">{item.name}</h3>
                      <p className="text-xs text-dark-400 capitalize">
                        {item.category}{item.block?.name ? ` · ${item.block.name}` : ' · General'}
                      </p>
                    </div>

                    {/* Quantity bar */}
                    <div>
                      <div className="flex justify-between text-xs text-dark-500 mb-1">
                        <span>Available</span>
                        <span className="font-semibold text-dark-700">{item.availableQuantity} / {item.totalQuantity} {item.unit}</span>
                      </div>
                      <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.totalQuantity > 0 && item.availableQuantity / item.totalQuantity < 0.3 ? 'bg-red-500'
                            : item.totalQuantity > 0 && item.availableQuantity / item.totalQuantity < 0.6 ? 'bg-amber-400'
                            : 'bg-emerald-500'
                          }`}
                          style={{ width: `${item.totalQuantity > 0 ? (item.availableQuantity / item.totalQuantity) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-dark-400">Updated: {fmtDate(item.updatedAt)}</p>

                    {/* Report Actions */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => openShortage(item)}
                        className="btn btn-secondary text-[11px] py-1.5 px-2"
                      >
                        <TrendingDown className="w-3 h-3 text-amber-500" /> Shortage
                      </button>
                      <button
                        onClick={() => openDamage(item)}
                        className="btn btn-secondary text-[11px] py-1.5 px-2"
                      >
                        <ShieldAlert className="w-3 h-3 text-red-500" /> Damage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'reports' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent-500" />
            <h3 className="font-semibold text-dark-800 text-sm">My Inventory Reports</h3>
          </div>
          {reportsLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-dark-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">You haven't submitted any reports yet</p>
              <p className="text-xs mt-1">Use the Shortage / Damage buttons on inventory items.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-100">
              {reports.map((r) => (
                <div key={r._id} className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    r.reportType === 'SHORTAGE' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {r.reportType === 'SHORTAGE' ? <TrendingDown className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-dark-800">{r.item?.name || r.itemName}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dark-100 text-dark-600">
                        {r.reportType}
                      </span>
                      {r.severity && r.reportType === 'DAMAGE' && <Badge status={r.severity} />}
                      <Badge status={r.status} />
                    </div>
                    <p className="text-xs text-dark-500 mt-1">{r.description}</p>
                    {r.adminResponse && (
                      <div className="mt-2 flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                        <MessageSquare className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-blue-700">
                          <span className="font-medium">Admin:</span> {r.adminResponse}
                          {r.respondedBy?.name ? ` — ${r.respondedBy.name}` : ''}
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] text-dark-400 mt-1.5">Reported: {fmtDate(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Shortage Modal */}
      <Modal isOpen={!!shortageItem} onClose={() => setShortageItem(null)} title="Report Inventory Shortage" size="sm">
        {shortageItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {shortageItem.image ? (
                <img src={getImageUrl(shortageItem.image)} alt={shortageItem.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-dark-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-dark-300" />
                </div>
              )}
              <div>
                <p className="font-semibold text-dark-800">{shortageItem.name}</p>
                <p className="text-xs text-dark-400 capitalize">
                  {shortageItem.category} · Available: <span className="font-semibold text-dark-600">{shortageItem.availableQuantity}</span> / {shortageItem.totalQuantity} {shortageItem.unit}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Actual Quantity Counted (optional)</label>
              <input
                type="number" min="0"
                value={shortageQty}
                onChange={(e) => setShortageQty(e.target.value)}
                placeholder={`System shows ${shortageItem.availableQuantity}`}
                className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <Textarea
              label="Shortage Description"
              value={shortageDesc}
              onChange={(e) => setShortageDesc(e.target.value)}
              placeholder="Describe the shortage (e.g. only 3 of 10 remaining)..."
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setShortageItem(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={submitShortage} disabled={saving} className="btn btn-primary flex-1">
                {saving ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Report Damage Modal */}
      <Modal isOpen={!!damageItem} onClose={() => setDamageItem(null)} title="Report Damaged Item" size="sm">
        {damageItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {damageItem.image ? (
                <img src={getImageUrl(damageItem.image)} alt={damageItem.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-dark-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-dark-300" />
                </div>
              )}
              <div>
                <p className="font-semibold text-dark-800">{damageItem.name}</p>
                <p className="text-xs text-dark-400 capitalize">{damageItem.category}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Damage Severity</label>
              <select
                value={damageSeverity}
                onChange={(e) => setDamageSeverity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <Textarea
              label="Damage Description"
              value={damageDesc}
              onChange={(e) => setDamageDesc(e.target.value)}
              placeholder="Describe the damage..."
              rows={3}
            />
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Photo (optional)</label>
              {damagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-dark-200">
                  <img src={damagePreview} alt="Damage" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setDamageImage(null); setDamagePreview(''); }}
                    className="absolute top-1 right-1 bg-dark-900/60 text-white rounded-full p-0.5 hover:bg-dark-900/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-dark-500 border border-dashed border-dark-200 rounded-lg px-3 py-2 w-fit hover:bg-dark-50">
                  <Upload className="w-3.5 h-3.5" /> Upload photo
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleDamageImage} className="hidden" />
                </label>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDamageItem(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={submitDamage} disabled={saving} className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700">
                {saving ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
