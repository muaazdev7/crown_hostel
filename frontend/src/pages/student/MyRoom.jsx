import { useState, useEffect } from 'react';
import {
  BedDouble, Users, Wifi, Wind, Bath, BookOpen,
  Building2, Layers, DollarSign, Package, ChevronDown, ChevronUp,
  Loader2, User, Home,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import { getMyRoom } from '../../api';
import toast from 'react-hot-toast';

const FACILITY_ICONS = {
  WiFi: Wifi, AC: Wind, 'Attached Bathroom': Bath,
  'Study Table': BookOpen, Gym: Users,
};

export default function MyRoom() {
  const [room, setRoom] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const { data } = await getMyRoom();
      setRoom(data.data.room);
      setAllocation(data.data.allocation);
      setInventory(data.data.inventory || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // No room assigned
  if (!room) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="page-title">My Room</h1>
          <p className="page-subtitle">Room details and allocation information</p>
        </div>
        <div className="card p-12 text-center">
          <Home className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">No Room Assigned</p>
          <p className="text-dark-400 text-sm mt-1">You don't have a room assigned yet. Apply for one from the Applications page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">My Room</h1>
        <p className="page-subtitle">Room details and allocation information</p>
      </div>

      {/* Room Hero */}
      <div className="card overflow-hidden">
        <div className="relative h-48 sm:h-56">
          {room.image ? (
            <img src={room.image} alt="Room" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-500 to-primary-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Room {room.roomNumber}</h2>
              <Badge status={room.status} />
            </div>
            <p className="text-sm text-white/80 mt-1">
              {room.block?.name || '—'} — Floor {room.floor}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Room Type', value: room.type, icon: BedDouble, color: 'bg-primary-50 text-primary-600' },
              { label: 'Capacity', value: `${room.currentOccupancy}/${room.capacity}`, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Floor', value: room.floor, icon: Layers, color: 'bg-purple-50 text-purple-600' },
              { label: 'Monthly Rent', value: room.monthlyRent ? `Rs ${room.monthlyRent.toLocaleString()}` : '—', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-dark-900 capitalize">{value}</p>
                  <p className="text-xs text-dark-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Facilities */}
          {room.facilities?.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-dark-100">
                <h3 className="font-semibold text-dark-800">Room Facilities</h3>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {room.facilities.map(f => {
                  const Icon = FACILITY_ICONS[f] || Package;
                  return (
                    <div key={f} className="flex items-center gap-2 px-3 py-2.5 bg-dark-50 rounded-xl">
                      <Icon className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-medium text-dark-700">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Roommates */}
          {room.occupants?.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-dark-100">
                <h3 className="font-semibold text-dark-800">Roommates</h3>
              </div>
              <div className="divide-y divide-dark-50">
                {room.occupants.map((o) => (
                  <div key={o._id} className="flex items-center gap-4 px-5 py-4">
                    {o.profileImage ? (
                      <img src={o.profileImage} alt={o.user?.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-dark-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-dark-800">{o.user?.name || '—'}</p>
                      <p className="text-xs text-dark-400">{o.rollNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory */}
          {inventory.length > 0 && (
            <div className="card">
              <button
                onClick={() => setShowInventory(!showInventory)}
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-dark-500" />
                  <h3 className="font-semibold text-dark-800">Room Inventory</h3>
                  <span className="text-xs bg-dark-100 text-dark-500 px-2 py-0.5 rounded-full">{inventory.length}</span>
                </div>
                {showInventory ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
              </button>
              {showInventory && (
                <div className="px-5 pb-5 animate-fade-in">
                  <div className="bg-dark-50 rounded-xl divide-y divide-dark-100">
                    {inventory.map(item => (
                      <div key={item._id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.inventory?.image ? (
                            <img src={item.inventory.image} alt={item.inventory.itemName} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center">
                              <Package className="w-4 h-4 text-dark-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-dark-800">{item.inventory?.itemName || '—'}</p>
                            <p className="text-xs text-dark-400 capitalize">{item.inventory?.category || '—'} — Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <Badge status={item.condition} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Allocation Details */}
          {allocation && (
            <div className="card">
              <div className="px-5 py-4 border-b border-dark-100">
                <h3 className="font-semibold text-dark-800">Allocation</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Bed Number', value: allocation.bedNumber || '—' },
                  { label: 'Start Date', value: allocation.startDate ? new Date(allocation.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                  { label: 'End Date', value: allocation.endDate ? new Date(allocation.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                  { label: 'Status', value: allocation.status, badge: true },
                ].map(({ label, value, badge }) => (
                  <div key={label}>
                    <p className="text-xs text-dark-400">{label}</p>
                    {badge ? <Badge status={value} /> : <p className="text-sm font-semibold text-dark-800">{value}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Block Info */}
          {room.block && (
            <div className="card">
              <div className="px-5 py-4 border-b border-dark-100">
                <h3 className="font-semibold text-dark-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-500" /> Block Info
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs text-dark-400">Block Name</p>
                  <p className="text-sm font-semibold text-dark-800">{room.block.name}</p>
                </div>
                {room.block.type && (
                  <div>
                    <p className="text-xs text-dark-400">Block Type</p>
                    <p className="text-sm font-semibold text-dark-800 capitalize">{room.block.type}</p>
                  </div>
                )}
                {room.block.facilities?.length > 0 && (
                  <div>
                    <p className="text-xs text-dark-400">Block Facilities</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {room.block.facilities.map(f => (
                        <span key={f} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
