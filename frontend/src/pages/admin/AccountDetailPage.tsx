import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  TrophyIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';

const ACCOUNT_TYPES = ['EXHIBITOR', 'CATTERY', 'CLUB', 'JUDGE', 'SPONSOR', 'VENDOR', 'OTHER'];

const typeColors: Record<string, string> = {
  EXHIBITOR: 'badge-blue',
  CATTERY: 'badge-purple',
  CLUB: 'badge-green',
  JUDGE: 'badge-orange',
  SPONSOR: 'badge-yellow',
  VENDOR: 'badge-gray',
  OTHER: 'badge-gray',
};

const tabs = ['Overview', 'Contacts', 'Cats', 'Activities', 'Notes'];

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();

  const { data: account, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => api.get(`/accounts/${id}`).then(r => r.data.data),
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/accounts/${id}`, data),
    onSuccess: (res) => {
      toast.success('Account updated!');
      qc.invalidateQueries({ queryKey: ['account', id] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const startEdit = () => {
    reset({
      name: account.name,
      type: account.type,
      email: account.email || '',
      phone: account.phone || '',
      website: account.website || '',
      billingCity: account.billingCity || '',
      billingState: account.billingState || '',
      description: account.description || '',
    });
    setEditing(true);
  };

  if (isLoading) return <PageLoader />;
  if (!account) return <div className="text-center py-16 text-gray-400">Account not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/crm/accounts" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{account.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={typeColors[account.type] || 'badge-gray'}>
              {account.type.charAt(0) + account.type.slice(1).toLowerCase()}
            </span>
            {account.billingCity && account.billingState && (
              <span className="text-sm text-gray-400">
                {account.billingCity}, {account.billingState}
              </span>
            )}
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className="btn-secondary btn-sm">
            <PencilIcon className="w-4 h-4" /> Edit
          </button>
        )}
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
                <h3 className="font-semibold text-gray-900">Edit Account</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="btn-secondary btn-sm"
                  >
                    <XMarkIcon className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="label">Account Name *</label>
                      <input className="input" {...register('name', { required: true })} />
                    </div>
                    <div>
                      <label className="label">Type *</label>
                      <select className="input" {...register('type', { required: true })}>
                        {ACCOUNT_TYPES.map(t => (
                          <option key={t} value={t}>
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input type="email" className="input" {...register('email')} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" className="input" {...register('phone')} />
                    </div>
                    <div>
                      <label className="label">Website</label>
                      <input className="input" {...register('website')} />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input className="input" {...register('billingCity')} />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input className="input" {...register('billingState')} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} {...register('description')} />
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="btn-primary"
                    >
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
                  <h3 className="font-semibold text-gray-900">Account Details</h3>
                </div>
                <div className="card-body space-y-4 text-sm">
                  <DetailRow label="Type">
                    <span className={typeColors[account.type] || 'badge-gray'}>
                      {account.type.charAt(0) + account.type.slice(1).toLowerCase()}
                    </span>
                  </DetailRow>
                  {account.email && <DetailRow label="Email">{account.email}</DetailRow>}
                  {account.phone && <DetailRow label="Phone">{account.phone}</DetailRow>}
                  {account.website && (
                    <DetailRow label="Website">
                      <a
                        href={account.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {account.website}
                      </a>
                    </DetailRow>
                  )}
                  {(account.billingCity || account.billingState) && (
                    <DetailRow label="Location">
                      {[account.billingCity, account.billingState].filter(Boolean).join(', ')}
                    </DetailRow>
                  )}
                  {account.description && (
                    <div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Description
                      </div>
                      <p className="text-gray-600">{account.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Summary</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Contacts', value: account._count?.contacts ?? 0, icon: UserGroupIcon },
                      { label: 'Cats', value: account._count?.cats ?? 0, icon: TrophyIcon },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
                      >
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <s.icon className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contacts Tab */}
      {activeTab === 'Contacts' && (
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Contacts</h3>
            <RouterLink to="/crm/contacts" className="btn-secondary btn-sm">
              <UserGroupIcon className="w-4 h-4" /> View All Contacts
            </RouterLink>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>CFA Member ID</th>
                <th>Cats</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {account.contacts?.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <RouterLink
                      to={`/crm/contacts/${c.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {c.firstName} {c.lastName}
                    </RouterLink>
                    {c.title && <div className="text-xs text-gray-400">{c.title}</div>}
                  </td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.cfaMemberId || '—'}</td>
                  <td>{c._count?.cats ?? 0}</td>
                </tr>
              ))}
              {(!account.contacts || account.contacts.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No contacts linked to this account
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cats Tab */}
      {activeTab === 'Cats' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Cats</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Cat Name</th>
                <th>Registration</th>
                <th>Breed</th>
                <th>Sex</th>
                <th>Title</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {account.cats?.map((cat: any) => (
                <tr key={cat.id}>
                  <td>
                    <RouterLink
                      to={`/crm/cats/${cat.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {cat.name}
                    </RouterLink>
                  </td>
                  <td className="font-mono text-xs">{cat.registrationNumber || '—'}</td>
                  <td>{cat.breed}</td>
                  <td className="capitalize">{cat.sex?.toLowerCase().replace('_', ' ')}</td>
                  <td>
                    {cat.currentTitle ? (
                      <span className="badge-purple">{cat.currentTitle}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {(!account.cats || account.cats.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No cats linked to this account
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'Activities' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Activities</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {account.activities?.length > 0 ? (
              account.activities.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.subject}</div>
                    {activity.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{activity.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {activity.createdAt
                      ? new Date(activity.createdAt).toLocaleDateString()
                      : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No activities recorded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'Notes' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Notes</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {account.notes?.length > 0 ? (
              account.notes.map((note: any) => (
                <div key={note.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                      {note.author && ` · ${note.author.firstName} ${note.author.lastName}`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No notes recorded
              </div>
            )}
          </div>
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
