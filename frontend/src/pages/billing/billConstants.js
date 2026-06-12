export const BILL_TYPES = [
  { value: 'electricity',          label: 'Electricity' },
  { value: 'internet',             label: 'Internet' },
  { value: 'water',                label: 'Water' },
  { value: 'gas',                  label: 'Gas' },
  { value: 'generator_fuel',       label: 'Generator Fuel' },
  { value: 'maintenance_services', label: 'Maintenance Services' },
  { value: 'security_services',    label: 'Security Services' },
  { value: 'waste_management',     label: 'Waste Management' },
  { value: 'other',                label: 'Other' },
];

export const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'];

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const typeLabel = (v) => BILL_TYPES.find((t) => t.value === v)?.label || v;

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export const fmtMoney = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
