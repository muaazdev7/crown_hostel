import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Minus, PlusCircle, Upload, X, ClipboardList, Wallet, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { getInventory, createInventoryItem, updateInventoryItem, useInventoryItem, addStockInventoryItem, deleteInventoryItem, getBlocks, updateRepairStatus } from '../../api';
import InventoryReports from './InventoryReports';
import InventoryExpenseReports from './InventoryExpenseReports';
import { getImageUrl } from '../../utils/imageUrl';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORIES = ['furniture', 'electronics', 'bedding', 'cleaning', 'kitchen', 'sports', 'stationery', 'other'];
const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'];
const UNITS = ['pcs', 'sets', 'kg', 'litre', 'box', 'roll'];

const EMPTY_FORM = {
  name: '', category: 'furniture', description: '', totalQuantity: '',
  unit: 'pcs', block: '', condition: 'good', purchaseDate: '', purchasePrice: '', supplier: '',
};

const CONDITION_STYLE = {
  new: 'bg-emerald-50 text-emerald-700',
  good: 'bg-blue-50 text-blue-700',
  fair: 'bg-amber-50 text-amber-700',
  poor: 'bg-orange-50 text-orange-700',
  damaged: 'bg-red-50 text-red-700',
};

export default function ManageInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [blocks, setBlocks] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  // Use-item modal state
  const [showUse, setShowUse] = useState(false);
  const [useTarget, setUseTarget] = useState(null);
  const [usedQuantity, setUsedQuantity] = useState('');
  const [usingItem, setUsingItem] = useState(false);

  // Add-stock modal state
  const [showAddStock, setShowAddStock] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [addedQuantity, setAddedQuantity] = useState('');
  const [replenishCost, setReplenishCost] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  // Repair-cost modal state
  const [repairTarget, setRepairTarget] = useState(null);
  const [repairCost, setRepairCost] = useState('');
  const [savingRepair, setSavingRepair] = useState(false);

  const fileInputRef = useRef(null);

  // Top-level view: 'items' | 'reports' (shortage/damage) | 'expenses' (expense reports)
  const [view, setView] = useState('items');

  // ── Data fetching ──
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterCategory) params.category = filterCategory;
      if (filterBlock) params.block = filterBlock;
      const res = await getInventory(params);
      setItems(res.data.data);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterBlock]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    getBlocks().then(res => setBlocks(res.data.data)).catch(() => {});
  }, []);

  // ── Form helpers ──
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetFormState = () => {
    setForm(EMPTY_FORM);
    clearImage();
  };

  const buildFormData = (fields) => {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== '') {
        fd.append(key, value);
      }
    }
    if (imageFile) {
      fd.append('image', imageFile);
    }
    return fd;
  };

  // ── Open modals ──
  const openEdit = (item) => {
    setSelected(item);
    setForm({
      name: item.name || '',
      category: item.category || 'furniture',
      description: item.description || '',
      totalQuantity: item.totalQuantity ?? '',
      unit: item.unit || 'pcs',
      block: item.block?._id || '',
      condition: item.condition || 'good',
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : '',
      purchasePrice: item.purchasePrice ?? '',
      supplier: item.supplier || '',
    });
    setImageFile(null);
    setImagePreview(item.image ? getImageUrl(item.image) : '');
    setShowEdit(true);
  };

  const openUse = (item) => {
    setUseTarget(item);
    setUsedQuantity('');
    setShowUse(true);
  };

  const openAddStock = (item) => {
    setStockTarget(item);
    setAddedQuantity('');
    setReplenishCost('');
    setShowAddStock(true);
  };

  const openRepair = (item) => {
    setRepairTarget(item);
    setRepairCost('');
  };

  // ── Shared item header for Use / Add Stock modals ──
  const renderItemHeader = (item) => (
    <div className="flex items-center gap-3">
      {item.image ? (
        <img src={getImageUrl(item.image)} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-dark-100 flex items-center justify-center">
          <Package className="w-6 h-6 text-dark-400" />
        </div>
      )}
      <div>
        <p className="font-semibold text-dark-800">{item.name}</p>
        <p className="text-xs text-dark-400 capitalize">
          {item.category} &middot; Available: <span className="font-semibold text-dark-700">{item.availableQuantity}</span> / {item.totalQuantity} {item.unit}
        </p>
      </div>
    </div>
  );

  // ── CRUD handlers ──
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || form.totalQuantity === '') {
      return toast.error('Please fill all required fields');
    }
    setSaving(true);
    try {
      const fd = buildFormData({
        name: form.name,
        category: form.category,
        description: form.description,
        totalQuantity: Number(form.totalQuantity),
        unit: form.unit,
        block: form.block,
        condition: form.condition,
        purchaseDate: form.purchaseDate,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : '',
        supplier: form.supplier,
      });
      await createInventoryItem(fd);
      toast.success('Item added to inventory');
      setShowAdd(false);
      resetFormState();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  // Edit updates details + totalQuantity (the fixed capacity limit) — NOT availableQuantity
  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildFormData({
        name: form.name,
        category: form.category,
        description: form.description,
        totalQuantity: Number(form.totalQuantity),
        unit: form.unit,
        condition: form.condition,
        supplier: form.supplier,
        purchaseDate: form.purchaseDate,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : '',
        block: form.block,
      });
      await updateInventoryItem(selected._id, fd);
      toast.success('Item details updated');
      setShowEdit(false);
      resetFormState();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUse = async (e) => {
    e.preventDefault();
    const qty = Number(usedQuantity);
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');
    if (qty > useTarget.availableQuantity) {
      return toast.error(`Only ${useTarget.availableQuantity} available`);
    }
    setUsingItem(true);
    try {
      await useInventoryItem(useTarget._id, { usedQuantity: qty });
      toast.success(`Used ${qty} ${useTarget.unit || 'pcs'} of ${useTarget.name}`);
      setShowUse(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to use item');
    } finally {
      setUsingItem(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const qty = Number(addedQuantity);
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');
    const maxRefill = stockTarget.totalQuantity - stockTarget.availableQuantity;
    if (qty > maxRefill) {
      return toast.error(`Can only refill up to ${maxRefill} ${stockTarget.unit}. To increase the limit, edit Total Quantity.`);
    }
    setAddingStock(true);
    try {
      await addStockInventoryItem(stockTarget._id, { addedQuantity: qty, cost: replenishCost });
      toast.success(`Added ${qty} ${stockTarget.unit || 'pcs'} to ${stockTarget.name}`);
      setShowAddStock(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInventoryItem(confirm.id);
      toast.success('Item permanently deleted');
      setConfirm({ open: false, id: null });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // Record repair cost — marks item repaired and logs the repair expense
  const handleRepair = async (e) => {
    e.preventDefault();
    const cost = Number(repairCost);
    if (!cost || cost <= 0) return toast.error('Enter a valid repair cost');
    setSavingRepair(true);
    try {
      await updateRepairStatus(repairTarget._id, { repairStatus: 'repaired', repairCost: cost });
      toast.success(`Repair cost recorded for ${repairTarget.name}`);
      setRepairTarget(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record repair');
    } finally {
      setSavingRepair(false);
    }
  };

  // ── Client-side search filter ──
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q));
  }, [items, search]);

  // ── Table columns ──
  const columns = [
    {
      key: 'name', label: 'Item',
      render: r => (
        <div className="flex items-center gap-3">
          {r.image ? (
            <img src={getImageUrl(r.image)} alt={r.name} className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-dark-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-dark-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-dark-800">{r.name}</p>
            <p className="text-xs text-dark-400 capitalize">{r.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity', label: 'Quantity',
      render: r => (
        <div className="text-sm">
          <span className="font-semibold text-dark-800">{r.availableQuantity}</span>
          <span className="text-dark-400"> / {r.totalQuantity} {r.unit}</span>
        </div>
      ),
    },
    { key: 'block', label: 'Block', render: r => r.block?.name || '—' },
    {
      key: 'condition', label: 'Condition',
      render: r => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CONDITION_STYLE[r.condition] || 'bg-dark-100 text-dark-600'}`}>
          {r.condition}
        </span>
      ),
    },
    {
      key: 'purchasePrice', label: 'Price',
      render: r => r.purchasePrice ? `Pkr ${r.purchasePrice.toLocaleString()}` : '—',
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => openUse(r)} className="p-1.5 rounded text-dark-400 hover:text-amber-600 hover:bg-amber-50" title="Use Item" disabled={r.availableQuantity === 0}>
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => openAddStock(r)} className="p-1.5 rounded text-dark-400 hover:text-emerald-600 hover:bg-emerald-50" title="Add Stock">
            <PlusCircle className="w-4 h-4" />
          </button>
          {r.condition === 'damaged' && (
            <button onClick={() => openRepair(r)} className="p-1.5 rounded text-dark-400 hover:text-purple-600 hover:bg-purple-50" title="Record Repair Cost">
              <Wrench className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => openEdit(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Edit Details">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirm({ open: true, id: r._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── Image upload section (shared between add and edit) ──
  const renderImageUpload = () => (
    <div className="col-span-2">
      <label className="label">Image</label>
      <div className="flex items-start gap-4">
        {imagePreview ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-dark-200 shrink-0">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={clearImage} className="absolute top-1 right-1 bg-dark-900/60 text-white rounded-full p-0.5 hover:bg-dark-900/80">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-dark-200 flex items-center justify-center shrink-0">
            <Package className="w-8 h-8 text-dark-300" />
          </div>
        )}
        <div className="flex-1">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          <Button type="button" variant="outline" icon={Upload} onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </Button>
          <p className="text-xs text-dark-400 mt-1">JPG, PNG or WebP. Max 5MB.</p>
        </div>
      </div>
    </div>
  );

  // ── Add form (includes quantity) ──
  const renderAddForm = () => (
    <form onSubmit={handleAdd} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Item Name *" value={form.name} onChange={set('name')} placeholder="e.g. Study Table" />
        <Select label="Category *" value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Input label="Total Quantity *" type="number" value={form.totalQuantity} onChange={set('totalQuantity')} placeholder="10" min="0" />
        <Select label="Unit" value={form.unit} onChange={set('unit')}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </Select>
        <Select label="Condition" value={form.condition} onChange={set('condition')}>
          {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Select label="Block" value={form.block} onChange={set('block')}>
          <option value="">All / General</option>
          {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
        <Input label="Purchase Price (Pkr)" type="number" value={form.purchasePrice} onChange={set('purchasePrice')} placeholder="500" />
        <Input label="Supplier" value={form.supplier} onChange={set('supplier')} placeholder="Vendor name" className="col-span-2" />
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input min-h-[60px] resize-none" value={form.description} onChange={set('description')} placeholder="Optional details..." />
        </div>
        {renderImageUpload()}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => { setShowAdd(false); resetFormState(); }}>Cancel</Button>
        <Button type="submit" loading={saving}>Add Item</Button>
      </div>
    </form>
  );

  // ── Edit form — totalQuantity is editable (fixed capacity), availableQuantity is read-only ──
  const renderEditForm = () => (
    <form onSubmit={handleEdit} className="space-y-4">
      {/* Read-only available quantity banner */}
      {selected && (
        <div className="bg-dark-50 border border-dark-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-dark-600">
            <span className="font-medium text-dark-800">Available Stock:</span>{' '}
            <span className="font-semibold text-dark-900">{selected.availableQuantity}</span>
            <span className="text-dark-400"> {selected.unit}</span>
          </div>
          <p className="text-xs text-dark-400">Use "Use Item" or "Add Stock" to change available qty</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Item Name *" value={form.name} onChange={set('name')} placeholder="e.g. Study Table" />
        <Select label="Category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Input label="Total Quantity (Max Capacity) *" type="number" value={form.totalQuantity} onChange={set('totalQuantity')} placeholder="10" min={selected?.availableQuantity || 0} />
        <Select label="Unit" value={form.unit} onChange={set('unit')}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </Select>
        <Select label="Condition" value={form.condition} onChange={set('condition')}>
          {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Input label="Supplier" value={form.supplier} onChange={set('supplier')} placeholder="Vendor name" />
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input min-h-[60px] resize-none" value={form.description} onChange={set('description')} placeholder="Optional details..." />
        </div>
        {renderImageUpload()}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => { setShowEdit(false); resetFormState(); }}>Cancel</Button>
        <Button type="submit" loading={saving}>Update Item</Button>
      </div>
    </form>
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track hostel inventory, assets and staff reports</p>
        </div>
        {view === 'items' && (
          <Button icon={Plus} onClick={() => { resetFormState(); setShowAdd(true); }}>Add Item</Button>
        )}
      </div>

      {/* View Toggle */}
      <div className="card p-1 flex gap-1 w-fit">
        <button
          onClick={() => setView('items')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            view === 'items' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Items
        </button>
        <button
          onClick={() => setView('reports')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            view === 'reports' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> Inventory Reports
        </button>
        <button
          onClick={() => setView('expenses')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            view === 'expenses' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:bg-dark-100'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" /> Expense Reports
        </button>
      </div>

      {view === 'reports' ? (
        <InventoryReports />
      ) : view === 'expenses' ? (
        <InventoryExpenseReports />
      ) : (
      <>
      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="input pl-9"
            placeholder="Search items..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <Select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className="w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </Select>
        <Select value={filterBlock} onChange={e => { setFilterBlock(e.target.value); setPage(1); }} className="w-44">
          <option value="">All Blocks</option>
          {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="card p-4">
        <Table
          columns={columns} data={filtered} loading={loading}
          emptyTitle="No inventory items" emptyDesc="Add items to start tracking inventory"
          page={page} pages={pages} onPageChange={setPage}
        />
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); resetFormState(); }} title="Add Inventory Item" size="lg">
        {renderAddForm()}
      </Modal>

      {/* Edit Modal — no quantity fields */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); resetFormState(); }} title="Edit Item Details" size="lg">
        {renderEditForm()}
      </Modal>

      {/* Use Item Modal */}
      <Modal isOpen={showUse} onClose={() => setShowUse(false)} title="Use Inventory Item" size="sm">
        {useTarget && (
          <form onSubmit={handleUse} className="space-y-4">
            {renderItemHeader(useTarget)}
            <Input
              label="Quantity to Use *"
              type="number"
              value={usedQuantity}
              onChange={e => setUsedQuantity(e.target.value)}
              placeholder={`Max ${useTarget.availableQuantity}`}
              min="1"
              max={useTarget.availableQuantity}
            />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUse(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" loading={usingItem}>Use Item</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Stock Modal — refills available toward totalQuantity cap */}
      <Modal isOpen={showAddStock} onClose={() => setShowAddStock(false)} title="Refill Stock" size="sm">
        {stockTarget && (() => {
          const maxRefill = stockTarget.totalQuantity - stockTarget.availableQuantity;
          return (
            <form onSubmit={handleAddStock} className="space-y-4">
              {renderItemHeader(stockTarget)}
              {maxRefill <= 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                  Stock is already full ({stockTarget.availableQuantity} / {stockTarget.totalQuantity} {stockTarget.unit}). To increase the limit, edit the item's Total Quantity.
                </div>
              ) : (
                <>
                  <div className="bg-dark-50 border border-dark-200 rounded-xl px-3 py-2 text-xs text-dark-500">
                    Can refill up to <span className="font-semibold text-dark-700">{maxRefill} {stockTarget.unit}</span> (total capacity: {stockTarget.totalQuantity})
                  </div>
                  <Input
                    label="Quantity to Add *"
                    type="number"
                    value={addedQuantity}
                    onChange={e => setAddedQuantity(e.target.value)}
                    placeholder={`Max ${maxRefill}`}
                    min="1"
                    max={maxRefill}
                  />
                  <Input
                    label="Replenishment Cost (Pkr)"
                    type="number"
                    value={replenishCost}
                    onChange={e => setReplenishCost(e.target.value)}
                    placeholder="Cost of items added (for expense report)"
                    min="0"
                  />
                </>
              )}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddStock(false)}>Cancel</Button>
                {maxRefill > 0 && (
                  <Button type="submit" className="flex-1" loading={addingStock}>Add Stock</Button>
                )}
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Record Repair Cost Modal */}
      <Modal isOpen={!!repairTarget} onClose={() => setRepairTarget(null)} title="Record Repair Cost" size="sm">
        {repairTarget && (
          <form onSubmit={handleRepair} className="space-y-4">
            {renderItemHeader(repairTarget)}
            <Input
              label="Repair Cost (Pkr) *"
              type="number"
              value={repairCost}
              onChange={e => setRepairCost(e.target.value)}
              placeholder="Cost of repairing this item"
              min="1"
            />
            <p className="text-xs text-dark-400">This marks the item as repaired and logs the cost in the expense report.</p>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setRepairTarget(null)}>Cancel</Button>
              <Button type="submit" className="flex-1" loading={savingRepair}>Save</Button>
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
        title="Delete Item"
        message="This will permanently delete the item from inventory. This action cannot be undone."
      />
      </>
      )}
    </div>
  );
}
