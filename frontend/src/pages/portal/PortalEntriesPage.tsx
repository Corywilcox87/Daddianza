import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardDocumentListIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { portalApi } from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import { format } from 'date-fns';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  UPCOMING: 'badge-yellow',
  ENTRIES_OPEN: 'badge-green',
  ENTRIES_CLOSED: 'badge-orange',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-gray',
  CANCELLED: 'badge-red',
};

const statusLabel = (status: string) => status.replace(/_/g, ' ');

const canWithdraw = (status: string) =>
  status === 'UPCOMING' || status === 'ENTRIES_OPEN';

export default function PortalEntriesPage() {
  const [withdrawEntry, setWithdrawEntry] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['portal-entries'],
    queryFn: () => portalApi.get('/portal/entries').then(r => r.data.data ?? r.data),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => portalApi.delete(`/portal/entries/${id}`),
    onSuccess: () => {
      toast.success('Entry withdrawn successfully.');
      qc.invalidateQueries({ queryKey: ['portal-entries'] });
      setWithdrawEntry(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to withdraw entry'),
  });

  if (isLoading) return <PageLoader />;

  const entries: any[] = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Entries</h1>
          <p className="page-subtitle">
            All your show entries — {entries.length} total
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No entries yet"
          description="You haven't entered any shows yet. Browse upcoming shows to get started!"
          icon={ClipboardDocumentListIcon}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cat Name</th>
                  <th>Show</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Show Status</th>
                  <th>Payment</th>
                  <th>Confirmed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {entries.map((entry: any) => {
                  const show = entry.show ?? {};
                  const showStatus = show.status ?? entry.showStatus ?? 'UPCOMING';
                  const isPaid = entry.isPaid ?? false;
                  const isConfirmed = entry.isConfirmed ?? false;
                  const withdrawable = canWithdraw(showStatus);

                  return (
                    <tr key={entry.id}>
                      {/* Cat Name */}
                      <td>
                        <div className="font-medium text-gray-900">
                          {entry.cat?.name ?? entry.catName ?? '—'}
                        </div>
                        {(entry.cat?.breed || entry.breed) && (
                          <div className="text-xs text-gray-400">
                            {entry.cat?.breed ?? entry.breed}
                          </div>
                        )}
                      </td>

                      {/* Show */}
                      <td>
                        <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">
                          {show.name ?? entry.showName ?? '—'}
                        </div>
                        {show.cfaShowNumber && (
                          <div className="text-xs text-gray-400">{show.cfaShowNumber}</div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="text-sm text-gray-700">
                        {show.showDate
                          ? format(new Date(show.showDate), 'MMM d, yyyy')
                          : '—'}
                      </td>

                      {/* Location */}
                      <td className="text-sm text-gray-700">
                        {[show.city, show.state].filter(Boolean).join(', ') || '—'}
                        {show.venue && (
                          <div className="text-xs text-gray-400 truncate max-w-[120px]">
                            {show.venue}
                          </div>
                        )}
                      </td>

                      {/* Show Status */}
                      <td>
                        <span className={clsx(statusColors[showStatus] || 'badge-gray')}>
                          {statusLabel(showStatus)}
                        </span>
                      </td>

                      {/* Payment */}
                      <td>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 badge-green">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 badge-red">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Confirmed */}
                      <td>
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 badge-green">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="badge-yellow">Pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        {withdrawable ? (
                          <button
                            onClick={() => setWithdrawEntry(entry)}
                            className="btn-danger btn-sm inline-flex items-center gap-1"
                            title="Withdraw entry"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Withdraw
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Withdraw Confirm Modal */}
      <Modal
        open={!!withdrawEntry}
        onClose={() => setWithdrawEntry(null)}
        title="Withdraw Entry"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to withdraw{' '}
            <span className="font-semibold">
              {withdrawEntry?.cat?.name ?? withdrawEntry?.catName ?? 'this entry'}
            </span>{' '}
            from{' '}
            <span className="font-semibold">
              {withdrawEntry?.show?.name ?? withdrawEntry?.showName ?? 'this show'}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setWithdrawEntry(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => withdrawMutation.mutate(withdrawEntry.id)}
              disabled={withdrawMutation.isPending}
              className="btn-danger"
            >
              {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Entry'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
