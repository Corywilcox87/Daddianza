import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';
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

export default function ShowsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shows', page, search, status],
    queryFn: () => api.get('/shows', { params: { page, limit: 20, search: search || undefined, status: status || undefined } }).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/shows', data),
    onSuccess: () => {
      toast.success('Show created!');
      qc.invalidateQueries({ queryKey: ['shows'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create show'),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">CFA Shows</h1>
          <p className="page-subtitle">Manage show schedule, entries, and results</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Show
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search shows..."
            className="input pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ENTRIES_OPEN">Entries Open</option>
          <option value="ENTRIES_CLOSED">Entries Closed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          {data?.data?.length === 0 ? (
            <EmptyState
              title="No shows found"
              description="Add your first CFA show to start tracking entries and results."
              icon={CalendarDaysIcon}
              action={<button onClick={() => setModalOpen(true)} className="btn-primary">Add Show</button>}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Show Name</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Entries</th>
                      <th>Entry Fee</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data?.data?.map((show: any) => (
                      <tr key={show.id}>
                        <td>
                          <Link to={`/crm/shows/${show.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                            {show.name}
                          </Link>
                          {show.cfaShowNumber && <div className="text-xs text-gray-400">{show.cfaShowNumber}</div>}
                        </td>
                        <td>
                          <div>{format(new Date(show.showDate), 'MMM d, yyyy')}</div>
                          {show.entryDeadline && (
                            <div className="text-xs text-gray-400">Deadline: {format(new Date(show.entryDeadline), 'MMM d')}</div>
                          )}
                        </td>
                        <td>
                          <div>{show.city}, {show.state}</div>
                          {show.venue && <div className="text-xs text-gray-400 truncate max-w-[150px]">{show.venue}</div>}
                        </td>
                        <td>
                          <span className="badge-gray badge">{show.showType}</span>
                        </td>
                        <td>
                          <span className={statusColors[show.status] || 'badge-gray'}>
                            {show.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{show._count?.entries ?? 0}</td>
                        <td>{show.entryFee ? `$${Number(show.entryFee).toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data?.pagination && (
                <Pagination
                  page={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  total={data.pagination.total}
                  limit={data.pagination.limit}
                  onChange={setPage}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Create Show Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Add CFA Show" size="xl">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Show Name *</label>
              <input className="input" {...register('name', { required: true })} placeholder="Heartland CFA All-Breed Show" />
            </div>
            <div>
              <label className="label">CFA Show Number</label>
              <input className="input" {...register('cfaShowNumber')} placeholder="CFA-2026-001" />
            </div>
            <div>
              <label className="label">Show Type *</label>
              <select className="input" {...register('showType', { required: true })}>
                <option value="ALLBREED">All Breed</option>
                <option value="SPECIALTY">Specialty</option>
                <option value="HOUSEHOLD_PET">Household Pet</option>
                <option value="PREMIER">Premier</option>
              </select>
            </div>
            <div>
              <label className="label">Show Date *</label>
              <input type="date" className="input" {...register('showDate', { required: true })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" {...register('showEndDate')} />
            </div>
            <div>
              <label className="label">Entry Deadline</label>
              <input type="date" className="input" {...register('entryDeadline')} />
            </div>
            <div>
              <label className="label">Entry Fee ($)</label>
              <input type="number" step="0.01" className="input" {...register('entryFee')} placeholder="95.00" />
            </div>
            <div>
              <label className="label">Venue</label>
              <input className="input" {...register('venue')} placeholder="Convention Center" />
            </div>
            <div>
              <label className="label">City *</label>
              <input className="input" {...register('city', { required: true })} />
            </div>
            <div>
              <label className="label">State *</label>
              <input className="input" {...register('state', { required: true })} placeholder="MO" />
            </div>
            <div>
              <label className="label">Club Name</label>
              <input className="input" {...register('clubName')} />
            </div>
            <div>
              <label className="label">Ring Count</label>
              <input type="number" className="input" {...register('ringCount')} defaultValue={1} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...register('status')}>
                <option value="UPCOMING">Upcoming</option>
                <option value="ENTRIES_OPEN">Entries Open</option>
                <option value="ENTRIES_CLOSED">Entries Closed</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="isPublic" {...register('isPublic')} defaultChecked />
              <label htmlFor="isPublic" className="text-sm text-gray-700">Visible to exhibitors in portal</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Show'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
