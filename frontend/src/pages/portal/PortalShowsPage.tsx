import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDaysIcon, MapPinIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { portalApi } from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  UPCOMING: 'badge-yellow',
  ENTRIES_OPEN: 'badge-green',
  ENTRIES_CLOSED: 'badge-orange',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-gray',
  CANCELLED: 'badge-red',
};

interface EntryForm {
  catId: string;
  specialRequests: string;
}

export default function PortalShowsPage() {
  const [enterShow, setEnterShow] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ['portal-shows'],
    queryFn: () => portalApi.get('/portal/shows').then(r => r.data.data ?? r.data),
  });

  const { data: catsData, isLoading: catsLoading } = useQuery({
    queryKey: ['portal-cats'],
    queryFn: () => portalApi.get('/portal/cats').then(r => r.data.data ?? r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntryForm>();

  const entryMutation = useMutation({
    mutationFn: (data: EntryForm) =>
      portalApi.post('/portal/entries', {
        showId: enterShow?.id,
        catId: data.catId,
        specialRequests: data.specialRequests || undefined,
      }),
    onSuccess: () => {
      toast.success('Entry submitted successfully!');
      qc.invalidateQueries({ queryKey: ['portal-entries'] });
      qc.invalidateQueries({ queryKey: ['portal-shows'] });
      setEnterShow(null);
      reset();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to submit entry'),
  });

  const isLoading = showsLoading || catsLoading;
  if (isLoading) return <PageLoader />;

  const shows: any[] = Array.isArray(showsData) ? showsData : [];
  const cats: any[] = Array.isArray(catsData) ? catsData : [];
  const activeCats = cats.filter((c: any) => c.isActive !== false);

  const getDeadlineLabel = (deadline: string | null | undefined) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    if (isPast(date)) return { label: 'Deadline passed', className: 'text-red-500', urgent: false };
    const days = differenceInDays(date, new Date());
    const label = days === 0
      ? 'Deadline today!'
      : days === 1
        ? 'Deadline tomorrow!'
        : `${formatDistanceToNow(date, { addSuffix: true })}`;
    return { label, className: days <= 2 ? 'text-red-500' : days <= 7 ? 'text-amber-600' : 'text-gray-500', urgent: days <= 2 };
  };

  const canEnter = (show: any) => show.status === 'ENTRIES_OPEN' && !isPast(new Date(show.entryDeadline ?? '9999'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upcoming Shows</h1>
          <p className="page-subtitle">Browse and enter CFA shows available in your area</p>
        </div>
      </div>

      {shows.length === 0 ? (
        <EmptyState
          title="No upcoming shows"
          description="There are no upcoming shows available at this time. Check back soon!"
          icon={CalendarDaysIcon}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {shows.map((show: any) => {
            const deadline = getDeadlineLabel(show.entryDeadline);
            const open = canEnter(show);

            return (
              <div key={show.id} className={clsx('card flex flex-col', show.status === 'CANCELLED' && 'opacity-60')}>
                {/* Card header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 leading-snug flex-1">{show.name}</h3>
                    <span className={clsx(statusColors[show.status] || 'badge-gray', 'flex-shrink-0 text-xs')}>
                      {show.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {show.cfaShowNumber && (
                    <p className="text-xs text-gray-400 mb-2">{show.cfaShowNumber}</p>
                  )}
                </div>

                {/* Details */}
                <div className="border-t border-gray-100 px-5 py-3 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {show.showDate ? format(new Date(show.showDate), 'EEEE, MMMM d, yyyy') : '—'}
                      {show.showEndDate && show.showEndDate !== show.showDate
                        ? ` – ${format(new Date(show.showEndDate), 'MMMM d')}`
                        : ''}
                    </span>
                  </div>

                  {(show.city || show.state) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>
                        {show.venue ? `${show.venue}, ` : ''}
                        {[show.city, show.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {show.ringCount && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <TrophyIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{show.ringCount} ring{show.ringCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {deadline && (
                    <div className={clsx('flex items-center gap-2 text-sm font-medium', deadline.className)}>
                      <ClockIcon className="w-4 h-4 flex-shrink-0" />
                      <span>Entry deadline: {deadline.label}</span>
                    </div>
                  )}

                  {show.entryFee && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Entry fee</span>
                      <span className="font-semibold text-gray-900">${Number(show.entryFee).toFixed(2)}</span>
                    </div>
                  )}

                  {show.clubName && (
                    <div className="text-xs text-gray-400">{show.clubName}</div>
                  )}
                </div>

                {/* Action */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                  {open ? (
                    <button
                      onClick={() => { setEnterShow(show); reset(); }}
                      className="btn-primary w-full"
                    >
                      Enter Show
                    </button>
                  ) : (
                    <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                      {show.status === 'ENTRIES_CLOSED' || show.status === 'IN_PROGRESS' || show.status === 'COMPLETED'
                        ? 'Entries Closed'
                        : show.status === 'CANCELLED'
                          ? 'Cancelled'
                          : 'Not Open Yet'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enter Show Modal */}
      <Modal
        open={!!enterShow}
        onClose={() => { setEnterShow(null); reset(); }}
        title={`Enter: ${enterShow?.name ?? ''}`}
        size="lg"
      >
        {activeCats.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            You have no active cats registered. Contact your administrator to add cat profiles before entering a show.
          </div>
        ) : (
          <form onSubmit={handleSubmit(d => entryMutation.mutate(d))} className="space-y-4">
            {enterShow && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 space-y-1">
                <div className="font-medium">{enterShow.name}</div>
                <div className="text-gray-500 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                  {enterShow.showDate && (
                    <span>{format(new Date(enterShow.showDate), 'MMMM d, yyyy')}</span>
                  )}
                  {(enterShow.city || enterShow.state) && (
                    <span>{[enterShow.city, enterShow.state].filter(Boolean).join(', ')}</span>
                  )}
                  {enterShow.entryFee && (
                    <span className="font-semibold text-gray-700">Fee: ${Number(enterShow.entryFee).toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="label">Select Cat *</label>
              <select
                className={clsx('input', errors.catId && 'input-error')}
                {...register('catId', { required: 'Please select a cat' })}
                defaultValue=""
              >
                <option value="" disabled>Choose a cat...</option>
                {activeCats.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}{cat.currentTitle ? ` (${cat.currentTitle})` : ''} — {cat.breed}
                  </option>
                ))}
              </select>
              {errors.catId && (
                <p className="mt-1 text-xs text-red-500">{errors.catId.message}</p>
              )}
            </div>

            <div>
              <label className="label">Special Requests <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="input"
                rows={3}
                placeholder="Any accommodations, cage size preferences, or notes for the show secretary..."
                {...register('specialRequests')}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setEnterShow(null); reset(); }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={entryMutation.isPending}
                className="btn-primary"
              >
                {entryMutation.isPending ? 'Submitting...' : 'Submit Entry'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
