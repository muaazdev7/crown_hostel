import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';
import { PageSpinner } from './Spinner';

export default function Table({
  columns, data, loading,
  emptyTitle = 'No records found', emptyDesc,
  page, pages, onPageChange,
  keyField = '_id',
}) {
  if (loading) return <PageSpinner />;
  if (!data?.length) return <EmptyState title={emptyTitle} description={emptyDesc} />;

  return (
    <div>
      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-dark-50 border-b border-dark-100">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row[keyField] || i} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-dark-700">
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-dark-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-dark-200 text-dark-500 hover:bg-dark-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="p-1.5 rounded-lg border border-dark-200 text-dark-500 hover:bg-dark-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
