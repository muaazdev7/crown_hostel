import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, BedDouble, Users, Edit2, Trash2, Eye, Building2, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom,
  getBlocks, createBlock, updateBlock, deleteBlock,
  allocateRoom, getStudents, unassignStudentRoom,
} from '../../api';

const ROOM_TYPES = ['single', 'double', 'triple', 'dormitory'];
const ROOM_STATUSES = ['available', 'full'];
const FACILITIES = ['AC', 'Fan', 'Geyser', 'Attached Bathroom', 'Wi-Fi', 'Cupboard', 'Study Table'];

const EMPTY_ROOM = { roomNumber: '', block: '', floor: '', type: 'single', capacity: '', monthlyRent: '', facilities: [] };
const EMPTY_BLOCK = { name: '', type: 'boys', totalFloors: '', address: '', description: '' };

const STATUS_STYLE = {
  available: 'text-emerald-700 bg-emerald-50',
  full: 'text-red-700 bg-red-50',
};

// ── Image picker reusable component (defined outside to prevent re-mount) ──
function ImagePicker({ preview, onImageChange, onImageRemove, label = 'Upload Image', size = 'md' }) {
  const fileRef = useRef(null);
  const sizeClasses = size === 'lg' ? 'w-full h-36' : 'w-24 h-24';

  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-dark-500">{label}</p>}
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className={`${sizeClasses} rounded-xl object-cover border-2 border-dark-100`} />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-1 right-1 px-2 py-0.5 bg-dark-900/70 text-white text-[10px] rounded-md hover:bg-dark-900"
          >
            Change
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className={`${sizeClasses} rounded-xl bg-dark-50 border-2 border-dashed border-dark-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors`}
        >
          <Camera className="w-5 h-5 text-dark-400" />
          <span className="text-[10px] text-dark-400 mt-1">Photo</span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={onImageChange}
      />
      <p className="text-[10px] text-dark-400">JPG or PNG. Max 2MB.</p>
    </div>
  );
}

// ── Room Form (outside parent to prevent re-mount) ──
function RoomForm({ form, saving, isEdit, blocks, imagePreview, setR, toggleFacility, onImageChange, onImageRemove, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ImagePicker preview={imagePreview} onImageChange={onImageChange} onImageRemove={onImageRemove} label="Room Photo" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Room Number *" value={form.roomNumber} onChange={setR('roomNumber')} placeholder="e.g. A-101" disabled={isEdit} />
        <Select label="Block *" value={form.block} onChange={setR('block')} disabled={isEdit}>
          <option value="">Select Block</option>
          {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <Input label="Floor *" type="number" value={form.floor} onChange={setR('floor')} placeholder="0" min="0" disabled={isEdit} />
        <Select label="Room Type *" value={form.type} onChange={setR('type')}>
          {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
        <Input label="Capacity *" type="number" value={form.capacity} onChange={setR('capacity')} placeholder="2" min="1" />
        <Input label="Monthly Rent (Pkr)" type="number" value={form.monthlyRent} onChange={setR('monthlyRent')} placeholder="3000" />
      </div>
      <div>
        <p className="text-xs font-medium text-dark-500 mb-2">Facilities</p>
        <div className="flex flex-wrap gap-2">
          {FACILITIES.map(f => (
            <button type="button" key={f} onClick={() => toggleFacility(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                form.facilities.includes(f) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-dark-600 border-dark-200 hover:border-primary-300'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{isEdit ? 'Update Room' : 'Create Room'}</Button>
      </div>
    </form>
  );
}

// ── Block Form (outside parent to prevent re-mount) ──
function BlockForm({ form, saving, isEdit, imagePreview, setB, onImageChange, onImageRemove, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ImagePicker preview={imagePreview} onImageChange={onImageChange} onImageRemove={onImageRemove} label="Block Photo" size="lg" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Block Name *" value={form.name} onChange={setB('name')} placeholder="e.g. Block A" />
        <Select label="Type *" value={form.type} onChange={setB('type')}>
          <option value="boys">Boys</option>
          <option value="girls">Girls</option>
          <option value="mixed">Mixed</option>
        </Select>
        <Input label="Total Floors *" type="number" value={form.totalFloors} onChange={setB('totalFloors')} placeholder="4" min="1" />
        <Input label="Address" value={form.address} onChange={setB('address')} placeholder="Block location" />
      </div>
      <Input label="Description" value={form.description} onChange={setB('description')} placeholder="Optional description" />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{isEdit ? 'Update Block' : 'Create Block'}</Button>
      </div>
    </form>
  );
}

export default function ManageRooms() {
  const [tab, setTab] = useState('rooms');

  // ── Room state ──
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterBlock, setFilterBlock] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // ── Block state ──
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);

  // ── Modal state ──
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [showViewRoom, setShowViewRoom] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showEditBlock, setShowEditBlock] = useState(false);
  const [showViewBlock, setShowViewBlock] = useState(false);
  const [selected, setSelected] = useState(null);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK);
  const [saving, setSaving] = useState(false);
  const [confirmRoom, setConfirmRoom] = useState({ open: false, id: null });
  const [confirmBlock, setConfirmBlock] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  // ── Image state ──
  const [roomImageFile, setRoomImageFile] = useState(null);
  const [roomImagePreview, setRoomImagePreview] = useState('');
  const [blockImageFile, setBlockImageFile] = useState(null);
  const [blockImagePreview, setBlockImagePreview] = useState('');

  // ── Allocate state ──
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocating, setAllocating] = useState(false);

  // ─────────────────────────────────────────────
  // Fetchers
  // ─────────────────────────────────────────────
  const fetchBlocks = useCallback(async () => {
    setBlocksLoading(true);
    try {
      const res = await getBlocks();
      setBlocks(res.data.data);
    } catch {
      toast.error('Failed to load blocks');
    } finally {
      setBlocksLoading(false);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterBlock) params.block = filterBlock;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const res = await getRooms(params);
      setRooms(res.data.data);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, [page, filterBlock, filterStatus, filterType]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);
  useEffect(() => { if (tab === 'rooms') fetchRooms(); }, [fetchRooms, tab]);

  // Student search for allocation (debounced)
  useEffect(() => {
    if (!showAllocate) return;
    const t = setTimeout(async () => {
      try {
        const res = await getStudents({ search: studentSearch, limit: 20 });
        setStudents(res.data.data);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch, showAllocate]);

  // ─────────────────────────────────────────────
  // Form helpers
  // ─────────────────────────────────────────────
  const setR = (field) => (e) => setRoomForm(f => ({ ...f, [field]: e.target.value }));
  const setB = (field) => (e) => setBlockForm(f => ({ ...f, [field]: e.target.value }));
  const toggleFacility = (f) => setRoomForm(prev => ({
    ...prev,
    facilities: prev.facilities.includes(f) ? prev.facilities.filter(x => x !== f) : [...prev.facilities, f],
  }));

  // ─────────────────────────────────────────────
  // Image handlers
  // ─────────────────────────────────────────────
  const handleImageChange = (setFile, setPreview) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageRemove = (setFile, setPreview) => () => {
    setFile(null);
    setPreview('');
  };

  // ─────────────────────────────────────────────
  // Build FormData helpers
  // ─────────────────────────────────────────────
  function buildRoomFormData(form, imageFile) {
    const fd = new FormData();
    fd.append('roomNumber', form.roomNumber);
    fd.append('block', form.block);
    fd.append('floor', Number(form.floor));
    fd.append('type', form.type);
    fd.append('capacity', Number(form.capacity));
    if (form.monthlyRent) fd.append('monthlyRent', Number(form.monthlyRent));
    if (form.status) fd.append('status', form.status);
    fd.append('facilities', JSON.stringify(form.facilities));
    if (imageFile) fd.append('image', imageFile);
    return fd;
  }

  function buildBlockFormData(form, imageFile) {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('type', form.type);
    fd.append('totalFloors', Number(form.totalFloors));
    if (form.address) fd.append('address', form.address);
    if (form.description) fd.append('description', form.description);
    if (imageFile) fd.append('image', imageFile);
    return fd;
  }

  // ─────────────────────────────────────────────
  // Room handlers
  // ─────────────────────────────────────────────
  const openAddRoom = () => {
    setRoomForm(EMPTY_ROOM);
    setRoomImageFile(null);
    setRoomImagePreview('');
    setShowAddRoom(true);
  };

  const openEditRoom = (room) => {
    setSelected(room);
    setRoomImageFile(null);
    setRoomImagePreview(room.image || '');
    setRoomForm({
      roomNumber: room.roomNumber || '',
      block: room.block?._id || '',
      floor: room.floor ?? '',
      type: room.type || 'single',
      capacity: room.capacity || '',
      monthlyRent: room.monthlyRent || '',
      facilities: room.facilities || [],
      status: room.status || 'available',
    });
    setShowEditRoom(true);
  };

  const openAllocate = (room) => {
    setSelected(room);
    setAllocStudentId('');
    setStudentSearch('');
    setShowAllocate(true);
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomNumber || !roomForm.block || roomForm.floor === '' || !roomForm.type || !roomForm.capacity) {
      return toast.error('Please fill all required fields');
    }
    setSaving(true);
    try {
      const fd = buildRoomFormData(roomForm, roomImageFile);
      await createRoom(fd);
      toast.success('Room created');
      setShowAddRoom(false);
      setRoomForm(EMPTY_ROOM);
      setRoomImageFile(null);
      setRoomImagePreview('');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', roomForm.type);
      fd.append('capacity', Number(roomForm.capacity));
      if (roomForm.monthlyRent) fd.append('monthlyRent', Number(roomForm.monthlyRent));
      fd.append('facilities', JSON.stringify(roomForm.facilities));
      if (roomImageFile) fd.append('image', roomImageFile);

      await updateRoom(selected._id, fd);
      toast.success('Room updated');
      setShowEditRoom(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      await deleteRoom(confirmRoom.id);
      toast.success('Room deleted');
      setConfirmRoom({ open: false, id: null });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleAllocate = async () => {
    if (!allocStudentId) return toast.error('Select a student');
    setAllocating(true);
    try {
      await allocateRoom({ studentId: allocStudentId, roomId: selected._id });
      toast.success('Room allocated successfully');
      setShowAllocate(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  // ─────────────────────────────────────────────
  // Block handlers
  // ─────────────────────────────────────────────
  const openAddBlock = () => {
    setBlockForm(EMPTY_BLOCK);
    setBlockImageFile(null);
    setBlockImagePreview('');
    setShowAddBlock(true);
  };

  const openEditBlock = (block) => {
    setSelected(block);
    setBlockImageFile(null);
    setBlockImagePreview(block.image || '');
    setBlockForm({
      name: block.name || '',
      type: block.type || 'boys',
      totalFloors: block.totalFloors?.toString() || '',
      address: block.address || '',
      description: block.description || '',
    });
    setShowEditBlock(true);
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!blockForm.name || !blockForm.type || !blockForm.totalFloors) {
      return toast.error('Please fill all required fields');
    }
    setSaving(true);
    try {
      const fd = buildBlockFormData(blockForm, blockImageFile);
      await createBlock(fd);
      toast.success('Block created');
      setShowAddBlock(false);
      setBlockForm(EMPTY_BLOCK);
      setBlockImageFile(null);
      setBlockImagePreview('');
      fetchBlocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create block');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBlock = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildBlockFormData(blockForm, blockImageFile);
      await updateBlock(selected._id, fd);
      toast.success('Block updated');
      setShowEditBlock(false);
      fetchBlocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async () => {
    setDeleting(true);
    try {
      await deleteBlock(confirmBlock.id);
      toast.success('Block deleted');
      setConfirmBlock({ open: false, id: null });
      fetchBlocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Room table columns
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'roomNumber', label: 'Room',
      render: r => (
        <div className="flex items-center gap-3">
          {r.image ? (
            <img src={r.image} alt={`Room ${r.roomNumber}`} className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5 text-accent-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-dark-800">{r.roomNumber}</p>
            <p className="text-xs text-dark-400">{r.block?.name}</p>
          </div>
        </div>
      ),
    },
    { key: 'floor', label: 'Floor', render: r => `Floor ${r.floor}` },
    { key: 'type', label: 'Type', render: r => <span className="capitalize">{r.type}</span> },
    {
      key: 'occupancy', label: 'Occupancy',
      render: r => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-dark-400" />
          <span className="text-sm">{r.currentOccupancy ?? 0} / {r.capacity}</span>
        </div>
      ),
    },
    { key: 'monthlyRent', label: 'Rent/Month', render: r => r.monthlyRent ? `Pkr ${r.monthlyRent.toLocaleString()}` : '—' },
    {
      key: 'status', label: 'Status',
      render: r => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[r.status] || 'bg-dark-100 text-dark-600'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={async () => {
            try {
              const res = await getRoom(r._id);
              setSelected(res.data.data);
            } catch {
              setSelected(r);
            }
            setShowViewRoom(true);
          }} className="p-1.5 rounded text-dark-400 hover:text-primary-600 hover:bg-primary-50" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEditRoom(r)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => openAllocate(r)}
            disabled={r.status === 'full'}
            className="p-1.5 rounded text-dark-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Allocate"
          >
            <Users className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmRoom({ open: true, id: r._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
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
          <h1 className="page-title">Room Management</h1>
          <p className="page-subtitle">Manage hostel rooms, blocks and allocations</p>
        </div>
        {tab === 'rooms'
          ? <Button icon={Plus} onClick={openAddRoom}>Add Room</Button>
          : <Button icon={Plus} onClick={openAddBlock}>Add Block</Button>
        }
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dark-100">
        {[{ id: 'rooms', label: 'Rooms' }, { id: 'blocks', label: 'Blocks' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-dark-500 hover:text-dark-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ ROOMS TAB ═══════════════ */}
      {tab === 'rooms' && (
        <>
          <div className="card p-4 flex flex-wrap gap-3">
            <Select value={filterBlock} onChange={e => { setFilterBlock(e.target.value); setPage(1); }} className="w-44">
              <option value="">All Blocks</option>
              {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
            <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="w-36">
              <option value="">All Status</option>
              {ROOM_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </Select>
            <Select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="w-36">
              <option value="">All Types</option>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </div>
          <div className="card p-4">
            <Table
              columns={columns} data={rooms} loading={loading}
              emptyTitle="No rooms found" emptyDesc="Add your first room to get started"
              page={page} pages={pages} onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* ═══════════════ BLOCKS TAB ═══════════════ */}
      {tab === 'blocks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocksLoading
            ? [1, 2, 3].map(i => <div key={i} className="card p-5 h-32 animate-pulse bg-dark-50" />)
            : blocks.length === 0
              ? <div className="col-span-3 text-center py-12 text-dark-400">No blocks yet. Add a block to get started.</div>
              : blocks.map(block => (
                  <div key={block._id} className="card overflow-hidden">
                    {/* Block header image or colored fallback */}
                    <div className="relative h-24">
                      {block.image ? (
                        <img src={block.image} alt={block.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-500" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
                      <div className="absolute bottom-2 left-3 flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{block.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${block.isActive ? 'bg-emerald-500/90 text-white' : 'bg-dark-600/90 text-dark-200'}`}>
                          {block.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-dark-500 mb-3">
                        <Building2 className="w-4 h-4 text-accent-600" />
                        <span className="capitalize">{block.type}</span>
                        <span>·</span>
                        <span>{block.totalFloors} floors</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-dark-400">Total Rooms</p>
                          <p className="font-medium text-dark-800">{block.totalRooms ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Address</p>
                          <p className="font-medium text-dark-700 truncate">{block.address || '—'}</p>
                        </div>
                      </div>
                      {/* Block actions */}
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-dark-100">
                        <button onClick={() => { setSelected(block); setShowViewBlock(true); }} className="p-1.5 rounded text-dark-400 hover:text-primary-600 hover:bg-primary-50" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditBlock(block)} className="p-1.5 rounded text-dark-400 hover:text-accent-600 hover:bg-accent-50" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmBlock({ open: true, id: block._id })} className="p-1.5 rounded text-dark-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
          }
        </div>
      )}

      {/* ═══════════════ ADD ROOM MODAL ═══════════════ */}
      <Modal isOpen={showAddRoom} onClose={() => setShowAddRoom(false)} title="Add New Room" size="lg">
        <RoomForm
          form={roomForm} saving={saving} isEdit={false} blocks={blocks}
          imagePreview={roomImagePreview}
          setR={setR} toggleFacility={toggleFacility}
          onImageChange={handleImageChange(setRoomImageFile, setRoomImagePreview)}
          onImageRemove={handleImageRemove(setRoomImageFile, setRoomImagePreview)}
          onSubmit={handleAddRoom}
          onCancel={() => setShowAddRoom(false)}
        />
      </Modal>

      {/* ═══════════════ EDIT ROOM MODAL ═══════════════ */}
      <Modal isOpen={showEditRoom} onClose={() => setShowEditRoom(false)} title="Edit Room" size="lg">
        <RoomForm
          form={roomForm} saving={saving} isEdit={true} blocks={blocks}
          imagePreview={roomImagePreview}
          setR={setR} toggleFacility={toggleFacility}
          onImageChange={handleImageChange(setRoomImageFile, setRoomImagePreview)}
          onImageRemove={handleImageRemove(setRoomImageFile, setRoomImagePreview)}
          onSubmit={handleEditRoom}
          onCancel={() => setShowEditRoom(false)}
        />
      </Modal>

      {/* ═══════════════ VIEW ROOM MODAL ═══════════════ */}
      <Modal isOpen={showViewRoom} onClose={() => setShowViewRoom(false)} title="Room Details" size="md">
        {selected && (
          <div className="space-y-4">
            {/* Room image or icon header */}
            <div className="relative rounded-xl overflow-hidden h-36">
              {selected.image ? (
                <img src={selected.image} alt={`Room ${selected.roomNumber}`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center">
                  <BedDouble className="w-12 h-12 text-white/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="text-white font-bold text-lg">{selected.roomNumber}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[selected.status] || 'bg-dark-100 text-dark-600'}`}>
                  {selected.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-accent-700" />
              </div>
              <div>
                <h3 className="font-semibold text-dark-900">{selected.block?.name} · <span className="capitalize">{selected.type}</span> room</h3>
                <p className="text-dark-400 text-sm">Floor {selected.floor}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Capacity', selected.capacity],
                ['Occupied', selected.currentOccupancy ?? 0],
                ['Monthly Rent', selected.monthlyRent ? `Pkr ${selected.monthlyRent.toLocaleString()}` : '—'],
                ['Block Type', selected.block?.type || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-dark-400 uppercase font-medium">{label}</p>
                  <p className="text-dark-800 font-medium capitalize">{val}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-dark-400 uppercase font-medium">Facilities</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selected.facilities?.length
                    ? selected.facilities.map(f => <span key={f} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs">{f}</span>)
                    : <span className="text-dark-400 text-xs">None</span>
                  }
                </div>
              </div>
            </div>
            {/* Assigned Students */}
            <div>
              <p className="text-xs text-dark-400 uppercase font-medium mb-2">Assigned Students ({selected.occupants?.length || 0})</p>
              {selected.occupants?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selected.occupants.map(s => (
                    <div key={s._id} className="flex items-center justify-between p-2.5 bg-dark-50 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                          {(s.user?.name || s.rollNumber || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark-800">{s.user?.name || 'Student'}</p>
                          <p className="text-xs text-dark-400">{s.rollNumber}{s.user?.email ? ` · ${s.user.email}` : ''}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await unassignStudentRoom(s._id);
                            toast.success(`${s.user?.name || 'Student'} unassigned`);
                            // Refresh room details
                            const res = await getRoom(selected._id);
                            setSelected(res.data.data);
                            fetchRooms();
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to unassign');
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Unassign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-dark-400 text-center py-3 bg-dark-50 rounded-lg">No students assigned</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════ ALLOCATE ROOM MODAL ═══════════════ */}
      <Modal isOpen={showAllocate} onClose={() => setShowAllocate(false)} title={`Allocate — Room ${selected?.roomNumber}`} size="md">
        <div className="space-y-4">
          <div className="p-3 bg-dark-50 rounded-xl text-sm text-dark-600">
            <span className="font-medium">{selected?.roomNumber}</span> · {selected?.block?.name} · Capacity: {selected?.capacity} · Occupied: {selected?.currentOccupancy ?? 0}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              className="input pl-9"
              placeholder="Search student by name..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 border border-dark-100 rounded-xl p-2">
            {students.length === 0
              ? <p className="text-sm text-dark-400 text-center py-4">No students found</p>
              : students.map(s => (
                  <button key={s._id} type="button" onClick={() => setAllocStudentId(s._id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      allocStudentId === s._id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-dark-50'
                    }`}
                  >
                    {s.profileImage ? (
                      <img src={s.profileImage} alt={s.user?.name} className="w-8 h-8 rounded-full object-cover shrink-0" loading="lazy" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 text-sm font-semibold">
                        {s.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-800 truncate">{s.user?.name}</p>
                      <p className="text-xs text-dark-400">{s.rollNumber} · {s.department}</p>
                    </div>
                    {s.room && <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">Has room</span>}
                  </button>
                ))
            }
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAllocate(false)}>Cancel</Button>
            <Button onClick={handleAllocate} loading={allocating} disabled={!allocStudentId}>Allocate Room</Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════ ADD BLOCK MODAL ═══════════════ */}
      <Modal isOpen={showAddBlock} onClose={() => setShowAddBlock(false)} title="Add New Block" size="md">
        <BlockForm
          form={blockForm} saving={saving} isEdit={false}
          imagePreview={blockImagePreview}
          setB={setB}
          onImageChange={handleImageChange(setBlockImageFile, setBlockImagePreview)}
          onImageRemove={handleImageRemove(setBlockImageFile, setBlockImagePreview)}
          onSubmit={handleAddBlock}
          onCancel={() => setShowAddBlock(false)}
        />
      </Modal>

      {/* ═══════════════ EDIT BLOCK MODAL ═══════════════ */}
      <Modal isOpen={showEditBlock} onClose={() => setShowEditBlock(false)} title="Edit Block" size="md">
        <BlockForm
          form={blockForm} saving={saving} isEdit={true}
          imagePreview={blockImagePreview}
          setB={setB}
          onImageChange={handleImageChange(setBlockImageFile, setBlockImagePreview)}
          onImageRemove={handleImageRemove(setBlockImageFile, setBlockImagePreview)}
          onSubmit={handleEditBlock}
          onCancel={() => setShowEditBlock(false)}
        />
      </Modal>

      {/* ═══════════════ VIEW BLOCK MODAL ═══════════════ */}
      <Modal isOpen={showViewBlock} onClose={() => setShowViewBlock(false)} title="Block Details" size="md">
        {selected && (
          <div className="space-y-4">
            {/* Block header image or gradient */}
            <div className="relative rounded-xl overflow-hidden h-36">
              {selected.image ? (
                <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-white/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="text-white font-bold text-lg">{selected.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.isActive ? 'bg-emerald-500/90 text-white' : 'bg-dark-600/90 text-dark-200'}`}>
                  {selected.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Type', selected.type],
                ['Total Floors', selected.totalFloors],
                ['Total Rooms', selected.totalRooms ?? 0],
                ['Address', selected.address || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-dark-400 uppercase font-medium">{label}</p>
                  <p className="text-dark-800 font-medium capitalize">{val}</p>
                </div>
              ))}
              {selected.description && (
                <div className="col-span-2">
                  <p className="text-xs text-dark-400 uppercase font-medium">Description</p>
                  <p className="text-dark-800 text-sm">{selected.description}</p>
                </div>
              )}
              {selected.facilities?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-dark-400 uppercase font-medium">Facilities</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selected.facilities.map(f => <span key={f} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs">{f}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════ DELETE CONFIRMATIONS ═══════════════ */}
      <ConfirmDialog
        isOpen={confirmRoom.open}
        onClose={() => setConfirmRoom({ open: false, id: null })}
        onConfirm={handleDeleteRoom}
        loading={deleting}
        title="Delete Room"
        message="This will permanently delete the room. This action cannot be undone."
      />

      <ConfirmDialog
        isOpen={confirmBlock.open}
        onClose={() => setConfirmBlock({ open: false, id: null })}
        onConfirm={handleDeleteBlock}
        loading={deleting}
        title="Delete Block"
        message="This will permanently delete the block. Remove all rooms from this block first. This action cannot be undone."
      />
    </div>
  );
}
