const COLORS = {
  primary: 'bg-primary-50 text-primary-600',
  accent:  'bg-accent-50 text-accent-600',
  amber:   'bg-amber-50 text-amber-600',
  red:     'bg-red-50 text-red-600',
  blue:    'bg-blue-50 text-blue-600',
  purple:  'bg-purple-50 text-purple-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo:  'bg-indigo-50 text-indigo-600',
};

export default function StatsCard({ label, value, icon: Icon, color = 'primary', loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${COLORS[color] || COLORS.primary}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        {loading
          ? <div className="h-7 w-16 bg-dark-100 rounded animate-pulse mb-1" />
          : <p className="text-2xl font-bold text-dark-900">{value ?? '—'}</p>
        }
        <p className="text-sm text-dark-500 truncate">{label}</p>
      </div>
    </div>
  );
}
