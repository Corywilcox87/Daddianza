import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrophyIcon,
  CalendarDaysIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import { format } from 'date-fns';

const CFA_BREEDS = [
  'Abyssinian', 'American Bobtail', 'American Curl', 'American Shorthair', 'American Wirehair',
  'Balinese', 'Bengal', 'Birman', 'Bombay', 'British Shorthair', 'Burmese', 'Burmilla',
  'Chartreux', 'Colorpoint Shorthair', 'Cornish Rex', 'Devon Rex', 'Egyptian Mau',
  'European Burmese', 'Exotic', 'Havana Brown', 'Japanese Bobtail', 'Javanese',
  'Khao Manee', 'Korat', 'Kurilian Bobtail', 'LaPerm', 'Lykoi', 'Maine Coon',
  'Manx', 'Norwegian Forest Cat', 'Ocicat', 'Oriental', 'Persian', 'Peterbald',
  'Ragamuffin', 'Ragdoll', 'Russian Blue', 'Selkirk Rex', 'Siamese', 'Siberian',
  'Singapura', 'Somali', 'Sphynx', 'Thai', 'Tonkinese', 'Toyger', 'Turkish Angora', 'Turkish Van',
  'Household Pet',
];

const sexLabel = (sex: string) => {
  const map: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    ALTERED_MALE: 'Altered Male',
    ALTERED_FEMALE: 'Altered Female',
  };
  return map[sex] || sex;
};

const tabs = ['Overview', 'Show History'];

export default function CatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();

  const { data: cat, isLoading } = useQuery({
    queryKey: ['cat', id],
    queryFn: () => api.get(`/cats/${id}`).then(r => r.data.data),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['cat-history', id],
    queryFn: () => api.get(`/cats/${id}/show-history`).then(r => r.data.data),
    enabled: activeTab === 'Show History',
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/cats/${id}`, data),
    onSuccess: () => {
      toast.success('Cat updated!');
      qc.invalidateQueries({ queryKey: ['cat', id] });
      qc.invalidateQueries({ queryKey: ['cats'] });
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const startEdit = () => {
    reset({
      name: cat.name,
      registrationNumber: cat.registrationNumber || '',
      breed: cat.breed,
      sex: cat.sex,
      color: cat.color || '',
      birthDate: cat.birthDate ? cat.birthDate.split('T')[0] : '',
      currentTitle: cat.currentTitle || '',
      ownerName: cat.ownerName || '',
      breederName: cat.breederName || '',
      notes: cat.notes || '',
    });
    setEditing(true);
  };

  if (isLoading) return <PageLoader />;
  if (!cat) return <div className="text-center py-16 text-gray-400">Cat not found</div>;

  const totalPoints =
    history?.reduce((sum: number, r: any) => sum + (r.points || 0), 0) ?? cat.totalPoints ?? 0;
  const finalsCount = history?.filter((r: any) => r.isFinal).length ?? 0;
  const showsCount = new Set(history?.map((r: any) => r.showId)).size ?? cat._count?.showEntries ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/crm/cats"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{cat.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{cat.breed}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{sexLabel(cat.sex)}</span>
            {cat.currentTitle && <span className="badge-purple">{cat.currentTitle}</span>}
            {!cat.isActive && <span className="badge-red">Inactive</span>}
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className="btn-secondary btn-sm">
            <PencilIcon className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Points', value: totalPoints, icon: TrophyIcon },
          { label: 'Shows Entered', value: showsCount, icon: CalendarDaysIcon },
          { label: 'Finals', value: finalsCount, icon: StarIcon },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <s.icon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
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

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <>
          {editing ? (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Edit Cat</h3>
                <button onClick={() => setEditing(false)} className="btn-secondary btn-sm">
                  <XMarkIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="label">Cat Name *</label>
                      <input
                        className="input"
                        {...register('name', { required: true })}
                        placeholder="GC RW Silvermist Moonbeam"
                      />
                    </div>
                    <div>
                      <label className="label">CFA Registration #</label>
                      <input className="input" {...register('registrationNumber')} />
                    </div>
                    <div>
                      <label className="label">Breed *</label>
                      <select className="input" {...register('breed', { required: true })}>
                        <option value="">Select breed...</option>
                        {CFA_BREEDS.map(b => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Sex *</label>
                      <select className="input" {...register('sex', { required: true })}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="ALTERED_MALE">Altered Male</option>
                        <option value="ALTERED_FEMALE">Altered Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Color / Pattern</label>
                      <input className="input" {...register('color')} />
                    </div>
                    <div>
                      <label className="label">Birth Date</label>
                      <input type="date" className="input" {...register('birthDate')} />
                    </div>
                    <div>
                      <label className="label">Current Title</label>
                      <input className="input" {...register('currentTitle')} placeholder="GC, RW, NW..." />
                    </div>
                    <div>
                      <label className="label">Owner Name</label>
                      <input className="input" {...register('ownerName')} />
                    </div>
                    <div>
                      <label className="label">Breeder Name</label>
                      <input className="input" {...register('breederName')} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea className="input" rows={3} {...register('notes')} />
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Registration Info</h3>
                </div>
                <div className="card-body space-y-4 text-sm">
                  {cat.registrationNumber && (
                    <DetailRow label="Reg #">
                      <span className="font-mono">{cat.registrationNumber}</span>
                    </DetailRow>
                  )}
                  <DetailRow label="Breed">{cat.breed}</DetailRow>
                  <DetailRow label="Sex">{sexLabel(cat.sex)}</DetailRow>
                  {cat.color && <DetailRow label="Color">{cat.color}</DetailRow>}
                  {cat.birthDate && (
                    <DetailRow label="Born">
                      {format(new Date(cat.birthDate), 'MMMM d, yyyy')}
                    </DetailRow>
                  )}
                  {cat.currentTitle && (
                    <DetailRow label="Title">
                      <span className="badge-purple">{cat.currentTitle}</span>
                    </DetailRow>
                  )}
                  {cat.ownerName && <DetailRow label="Owner">{cat.ownerName}</DetailRow>}
                  {cat.contact && (
                    <DetailRow label="Contact">
                      <RouterLink
                        to={`/crm/contacts/${cat.contact.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {cat.contact.firstName} {cat.contact.lastName}
                      </RouterLink>
                    </DetailRow>
                  )}
                  {cat.breederName && (
                    <DetailRow label="Breeder">{cat.breederName}</DetailRow>
                  )}
                  {cat.account && (
                    <DetailRow label="Account">
                      <RouterLink
                        to={`/crm/accounts/${cat.account.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {cat.account.name}
                      </RouterLink>
                    </DetailRow>
                  )}
                </div>
              </div>

              {cat.notes && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Notes</h3>
                  </div>
                  <div className="card-body">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{cat.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Show History Tab */}
      {activeTab === 'Show History' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Show History</h3>
          </div>
          {historyLoading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Show Name</th>
                  <th>Date</th>
                  <th>Ring</th>
                  <th>Judge</th>
                  <th>Award</th>
                  <th>Placement</th>
                  <th>Points</th>
                  <th>Final</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {history?.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <RouterLink
                        to={`/crm/shows/${r.showId}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {r.show?.name || r.showName || '—'}
                      </RouterLink>
                    </td>
                    <td>
                      {r.show?.showDate
                        ? format(new Date(r.show.showDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
                    <td>Ring {r.ringNumber}</td>
                    <td>{r.judgeName || '—'}</td>
                    <td>
                      {r.awardType ? (
                        <span className="badge-yellow">
                          {r.awardType.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{r.placement || '—'}</td>
                    <td className="font-medium">{r.points || 0}</td>
                    <td>
                      {r.isFinal ? <span className="badge-green">Final</span> : '—'}
                    </td>
                  </tr>
                ))}
                {(!history || history.length === 0) && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No show history recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 text-xs font-medium text-gray-400 uppercase tracking-wide flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-gray-700">{children}</span>
    </div>
  );
}
