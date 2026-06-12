import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-dark-100 rounded-2xl flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-dark-400" />
      </div>
      <p className="text-dark-700 font-semibold">{title}</p>
      {description && <p className="text-dark-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
