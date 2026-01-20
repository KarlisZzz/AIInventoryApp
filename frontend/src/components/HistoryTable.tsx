/**
 * HistoryTable Component
 * 
 * Displays lending history records in a formatted table.
 * Shows borrower information, dates, and condition notes.
 * 
 * @see T108 - User Story 4
 */

import type { LendingLog } from '../services/lendingService';

interface HistoryTableProps {
  history: LendingLog[];
}

export default function HistoryTable({ history }: HistoryTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (lentDate: string, returnedDate: string | null | undefined) => {
    const lent = new Date(lentDate);
    const returned = returnedDate ? new Date(returnedDate) : new Date();
    const diffMs = returned.getTime() - lent.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (returnedDate) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} (ongoing)`;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Borrower</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Lent Date</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Returned Date</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Duration</th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {history.map((log) => (
            <tr
              key={log.id}
              className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
            >
              {/* Borrower Name - denormalized field per FR-028 */}
              <td className="py-3 px-4 text-slate-200">
                {log.borrowerName}
              </td>

              {/* Borrower Email - denormalized field */}
              <td className="py-3 px-4 text-slate-400 text-xs">
                {log.borrowerEmail}
              </td>

              {/* Date Lent */}
              <td className="py-3 px-4 text-slate-300">
                {formatDate(log.dateLent)}
              </td>

              {/* Date Returned */}
              <td className="py-3 px-4">
                {log.dateReturned ? (
                  <span className="text-slate-300">{formatDate(log.dateReturned)}</span>
                ) : (
                  <span className="text-yellow-400 text-xs font-medium px-2 py-1 bg-yellow-500/10 rounded">
                    Still Out
                  </span>
                )}
              </td>

              {/* Duration */}
              <td className="py-3 px-4 text-slate-400 text-xs">
                {getDuration(log.dateLent, log.dateReturned)}
              </td>

              {/* Condition Notes */}
              <td className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">
                {log.conditionNotes || (
                  <span className="text-slate-600 italic">No notes</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
