const STYLES = {
  pending:       'bg-amber-100 text-amber-700 border-amber-200',
  approved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:      'bg-red-100 text-red-700 border-red-200',
  active:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive:      'bg-dark-100 text-dark-500 border-dark-200',
  available:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  occupied:      'bg-blue-100 text-blue-700 border-blue-200',
  full:          'bg-red-100 text-red-700 border-red-200',
  maintenance:   'bg-amber-100 text-amber-700 border-amber-200',
  reserved:      'bg-purple-100 text-purple-700 border-purple-200',
  paid:          'bg-emerald-100 text-emerald-700 border-emerald-200',
  partial:       'bg-amber-100 text-amber-700 border-amber-200',
  unpaid:        'bg-red-100 text-red-700 border-red-200',
  overdue:       'bg-red-100 text-red-700 border-red-200',
  cancelled:     'bg-dark-100 text-dark-500 border-dark-200',
  waitlisted:    'bg-orange-100 text-orange-700 border-orange-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress:   'bg-blue-100 text-blue-700 border-blue-200',
  resolved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed:        'bg-dark-100 text-dark-500 border-dark-200',
  'on-leave':    'bg-purple-100 text-purple-700 border-purple-200',
  low:           'bg-dark-100 text-dark-500 border-dark-200',
  medium:        'bg-amber-100 text-amber-700 border-amber-200',
  high:          'bg-red-100 text-red-700 border-red-200',
  urgent:        'bg-red-200 text-red-800 border-red-300',
  good:          'bg-emerald-100 text-emerald-700 border-emerald-200',
  fair:          'bg-amber-100 text-amber-700 border-amber-200',
  poor:          'bg-orange-100 text-orange-700 border-orange-200',
  damaged:       'bg-red-100 text-red-700 border-red-200',
  present:       'bg-emerald-100 text-emerald-700 border-emerald-200',
  absent:        'bg-red-100 text-red-700 border-red-200',
  open:          'bg-amber-100 text-amber-700 border-amber-200',
  done:          'bg-emerald-100 text-emerald-700 border-emerald-200',
  // Inventory report statuses
  in_review:        'bg-blue-100 text-blue-700 border-blue-200',
  repair_scheduled: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  repaired:         'bg-emerald-100 text-emerald-700 border-emerald-200',
  replaced:         'bg-teal-100 text-teal-700 border-teal-200',
  // Damage severity
  minor:            'bg-dark-100 text-dark-500 border-dark-200',
  moderate:         'bg-amber-100 text-amber-700 border-amber-200',
  severe:           'bg-red-100 text-red-700 border-red-200',
  // Maintenance request statuses & priority
  assigned:         'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  emergency:        'bg-red-200 text-red-800 border-red-300',
};

export default function Badge({ status, label }) {
  const style = STYLES[status] || 'bg-dark-100 text-dark-600 border-dark-200';
  const text = label || (status ? status.replace(/[-_]/g, ' ') : '');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {text}
    </span>
  );
}
