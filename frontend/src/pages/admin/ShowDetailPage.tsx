import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CalendarDaysIcon, MapPinIcon, UserGroupIcon, TrophyIcon,
  PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  UPCOMING: 'badge-yellow', ENTRIES_OPEN: 'badge-green', ENTRIES_CLOSED: 'badge-orange',
  IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-gray', CANCELLED: 'badge-red',
};

const tabs = ['Overview', 'Entries', 'Results', 'Judges'];

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Overview');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: show, isLoading } = useQuery({
    queryKey: ['show', id],
    queryFn: () => api.get(`/shows/${id}`).then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['show-stats', id],
    queryFn: () => api.get(`/shows/${id}/stats`).then(r => r.data.data),
  });

  const { data: cats } = useQuery({
    queryKey: ['cats-all'],
    queryFn: () => api.get('/cats', { params: { limit: 200 } }).then(r => r.data.data),
  });

  const entryForm = useForm<any>();
  const resultForm = useForm<any>();

  const addEntryMutation = useMutation({
    mutationFn: (data: any) => api.post(`/shows/${id}/entries`, data),
    onSuccess: () => { toast.success('Entry added!'); qc.invalidateQueries({ queryKey: ['show', id] }); qc.invalidateQueries({ queryKey: ['show-stats', id] }); setEntryModalOpen(false); entryForm.reset(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const addResultMutation = useMutation({
    mutationFn: (data: any) => api.post(`/shows/${id}/results`, data),
    onSuccess: () => { toast.success('Result saved!'); qc.invalidateQueries({ queryKey: ['show', id] }); setResultModalOpen(false); resultForm.reset(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/shows/${id}`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['show', id] }); },
  });

  if (isLoading) return <PageLoader />;
  if (!show) return <div className="text-center py-16 text-gray-400">Show not found</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/crm/shows" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{show.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={statusColors[show.status] || 'badge-gray'}>{show.status.replace('_', ' ')}</span>
            {show.cfaShowNumber && <span className="text-sm text-gray-400">#{show.cfaShowNumber}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {show.status === 'UPCOMING' && (
            <button onClick={() => updateStatusMutation.mutate('ENTRIES_OPEN')} className="btn-primary btn-sm">Open Entries</button>
          )}
          {show.status === 'ENTRIES_OPEN' && (
            <button onClick={() => updateStatusMutation.mutate('ENTRIES_CLOSED')} className="btn-secondary btn-sm">Close Entries</button>
          )}
          {show.status === 'ENTRIES_CLOSED' && (
            <button onClick={() => updateStatusMutation.mutate('IN_PROGRESS')} className="btn-secondary btn-sm">Start Show</button>
          )}
          {show.status === 'IN_PROGRESS' && (
            <button onClick={() => updateStatusMutation.mutate('COMPLETED')} className="btn-secondary btn-sm">Complete Show</button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entries', value: stats?.entryCount ?? show._count?.entries },
          { label: 'Paid Entries', value: stats?.paidCount ?? '—' },
          { label: 'Breeds', value: stats?.uniqueBreedCount ?? '—' },
          { label: 'Revenue', value: stats?.totalRevenue != null ? `$${Number(stats.totalRevenue).toFixed(2)}` : '—' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-gray-900">Show Details</h3></div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex gap-2"><CalendarDaysIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div>{format(new Date(show.showDate), 'EEEE, MMMM d, yyyy')}</div>
                  {show.showEndDate && <div className="text-gray-400">to {format(new Date(show.showEndDate), 'MMMM d, yyyy')}</div>}
                  {show.entryDeadline && <div className="text-gray-400 mt-1">Entry deadline: {format(new Date(show.entryDeadline), 'MMM d, yyyy')}</div>}
                </div>
              </div>
              <div className="flex gap-2"><MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  {show.venue && <div>{show.venue}</div>}
                  <div className="text-gray-600">{show.city}, {show.state} {show.zip}</div>
                </div>
              </div>
              <div className="flex gap-2"><UserGroupIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  {show.clubName && <div>{show.clubName}</div>}
                  <div className="text-gray-500">{show.ringCount} ring{show.ringCount !== 1 ? 's' : ''}</div>
                </div>
              </div>
              {show.entryFee && <div><span className="text-gray-500">Entry Fee: </span><span className="font-medium">${Number(show.entryFee).toFixed(2)}</span></div>}
              {show.showManager && <div><span className="text-gray-500">Show Manager: </span>{show.showManager}</div>}
              {show.masterClerk && <div><span className="text-gray-500">Master Clerk: </span>{show.masterClerk}</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-gray-900">Breeds Entered</h3></div>
            <div className="card-body">
              {stats?.breeds?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.breeds.map((breed: string) => (
                    <span key={breed} className="badge-blue">{breed}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No entries yet</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Entries' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setEntryModalOpen(true)} className="btn-primary btn-sm">
              <PlusIcon className="w-4 h-4" /> Add Entry
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Cat</th>
                  <th>Breed</th>
                  <th>Sex</th>
                  <th>Entry #</th>
                  <th>Cage</th>
                  <th>Paid</th>
                  <th>Confirmed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {show.entries?.map((entry: any) => (
                  <tr key={entry.id}>
                    <td>
                      <Link to={`/crm/cats/${entry.cat?.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                        {entry.cat?.name}
                      </Link>
                      {entry.cat?.currentTitle && <div className="text-xs text-gray-400">{entry.cat.currentTitle}</div>}
                    </td>
                    <td>{entry.cat?.breed}</td>
                    <td className="capitalize">{entry.cat?.sex?.toLowerCase().replace('_', ' ')}</td>
                    <td>{entry.entryNumber || '—'}</td>
                    <td>{entry.cageNumber || '—'}</td>
                    <td>
                      <span className={entry.isPaid ? 'badge-green' : 'badge-red'}>{entry.isPaid ? 'Paid' : 'Unpaid'}</span>
                    </td>
                    <td>
                      <span className={entry.isConfirmed ? 'badge-green' : 'badge-yellow'}>{entry.isConfirmed ? 'Yes' : 'Pending'}</span>
                    </td>
                  </tr>
                ))}
                {show.entries?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No entries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Results' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setResultModalOpen(true)} className="btn-primary btn-sm">
              <PlusIcon className="w-4 h-4" /> Add Result
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Cat</th>
                  <th>Ring</th>
                  <th>Judge</th>
                  <th>Award</th>
                  <th>Placement</th>
                  <th>Points</th>
                  <th>Final</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {show.results?.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/crm/cats/${r.catId}`} className="font-medium text-brand-600">{r.cat?.name}</Link>
                      <div className="text-xs text-gray-400">{r.cat?.breed}</div>
                    </td>
                    <td>Ring {r.ringNumber}</td>
                    <td>{r.judgeName || '—'}</td>
                    <td>{r.awardType ? r.awardType.replace(/_/g, ' ') : '—'}</td>
                    <td>{r.placement || '—'}</td>
                    <td>{r.points || 0}</td>
                    <td>{r.isFinal ? <span className="badge-green">Final</span> : '—'}</td>
                  </tr>
                ))}
                {(!show.results || show.results.length === 0) && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No results recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Judges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {show.judges?.map((judge: any) => (
            <div key={judge.id} className="card p-4">
              <div className="font-semibold text-gray-900">{judge.judgeName}</div>
              {judge.judgeNumber && <div className="text-xs text-gray-400">#{judge.judgeNumber}</div>}
              <div className="text-sm text-gray-500 mt-1">Ring {judge.ringNumber}</div>
              {judge.specialty && <div className="text-xs text-gray-400 mt-1">{judge.specialty}</div>}
            </div>
          ))}
          {show.judges?.length === 0 && <p className="col-span-3 text-sm text-gray-400">No judges assigned</p>}
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal open={entryModalOpen} onClose={() => { setEntryModalOpen(false); entryForm.reset(); }} title="Add Show Entry">
        <form onSubmit={entryForm.handleSubmit(d => addEntryMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Select Cat *</label>
            <select className="input" {...entryForm.register('catId', { required: true })}>
              <option value="">Choose a cat...</option>
              {cats?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name} — {cat.breed}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Entry Number</label>
              <input className="input" {...entryForm.register('entryNumber')} />
            </div>
            <div>
              <label className="label">Cage Number</label>
              <input className="input" {...entryForm.register('cageNumber')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaid" {...entryForm.register('isPaid')} />
              <label htmlFor="isPaid" className="text-sm">Paid</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isConfirmed" {...entryForm.register('isConfirmed')} />
              <label htmlFor="isConfirmed" className="text-sm">Confirmed</label>
            </div>
          </div>
          <div>
            <label className="label">Special Requests</label>
            <textarea className="input" rows={2} {...entryForm.register('specialRequests')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setEntryModalOpen(false); entryForm.reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={addEntryMutation.isPending} className="btn-primary">
              {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Result Modal */}
      <Modal open={resultModalOpen} onClose={() => { setResultModalOpen(false); resultForm.reset(); }} title="Record Result">
        <form onSubmit={resultForm.handleSubmit(d => addResultMutation.mutate({ ...d, ringNumber: parseInt(d.ringNumber), placement: d.placement ? parseInt(d.placement) : undefined, points: d.points ? parseInt(d.points) : 0 }))} className="space-y-4">
          <div>
            <label className="label">Cat *</label>
            <select className="input" {...resultForm.register('catId', { required: true })}>
              <option value="">Choose a cat...</option>
              {show.entries?.map((e: any) => (
                <option key={e.catId} value={e.catId}>{e.cat?.name} — {e.cat?.breed}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ring # *</label>
              <input type="number" className="input" {...resultForm.register('ringNumber', { required: true })} />
            </div>
            <div>
              <label className="label">Judge Name</label>
              <input className="input" {...resultForm.register('judgeName')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Award Type</label>
              <select className="input" {...resultForm.register('awardType')}>
                <option value="">None</option>
                <option value="BEST_IN_SHOW">Best in Show</option>
                <option value="SECOND_BEST_IN_SHOW">Second Best in Show</option>
                <option value="BEST_OF_COLOR_CLASS">Best of Color Class</option>
                <option value="BEST_OF_BREED">Best of Breed</option>
                <option value="BEST_CHAMPION">Best Champion</option>
                <option value="GRAND_CHAMPION">Grand Champion</option>
                <option value="DOUBLE_GRAND">Double Grand</option>
                <option value="TRIPLE_GRAND">Triple Grand</option>
                <option value="BEST_KITTEN">Best Kitten</option>
                <option value="BEST_PREMIER">Best Premier</option>
                <option value="REGIONAL_WINNER">Regional Winner</option>
                <option value="NATIONAL_WINNER">National Winner</option>
              </select>
            </div>
            <div>
              <label className="label">Placement</label>
              <input type="number" className="input" {...resultForm.register('placement')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Points</label>
              <input type="number" className="input" {...resultForm.register('points')} defaultValue="0" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="isFinal" {...resultForm.register('isFinal')} />
              <label htmlFor="isFinal" className="text-sm">Finals placement</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setResultModalOpen(false); resultForm.reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={addResultMutation.isPending} className="btn-primary">
              {addResultMutation.isPending ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
