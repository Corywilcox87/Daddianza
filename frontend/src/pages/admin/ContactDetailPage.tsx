import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  TrophyIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import { format } from 'date-fns';

const tabs = ['Overview', 'Cats', 'Show Entries', 'Notes'];

interface EditContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  title: string;
  accountId: string;
  cfaMemberId: string;
  city: string;
  state: string;
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => api.get(`/contacts/${id}`).then(r => r.data.data),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts-all'],
    queryFn: () => api.get('/accounts', { params: { limit: 200 } }).then(r => r.data.data),
    enabled: editing,
  });

  const { register, handleSubmit, reset } = useForm<EditContactForm>();

  const updateMutation = useMutation({
    mutationFn: (data: EditContactForm) =>
      api.put(`/contacts/${id}`, {
        ...data,
        accountId: data.accountId || undefined,
      }),
    onSuccess: () => {
      toast.success('Contact updated!');
      qc.invalidateQueries({ queryKey: ['contact', id] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const startEdit = () => {
    reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      title: contact.title || '',
      accountId: contact.accountId || '',
      cfaMemberId: contact.cfaMemberId || '',
      city: contact.city || '',
      state: contact.state || '',
    });
    setEditing(true);
  };

  if (isLoading) return <PageLoader />;
  if (!contact) return <div className="text-center py-16 text-gray-400">Contact not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/crm/contacts"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {contact.title && (
              <span className="text-sm text-gray-500">{contact.title}</span>
            )}
            {contact.account && (
              <RouterLink
                to={`/crm/accounts/${contact.account.id}`}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                {contact.account.name}
              </RouterLink>
            )}
            {contact.cfaMemberId && (
              <span className="badge-blue">CFA {contact.cfaMemberId}</span>
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
                <h3 className="font-semibold text-gray-900">Edit Contact</h3>
                <button onClick={() => setEditing(false)} className="btn-secondary btn-sm">
                  <XMarkIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
              <div className="card-body">
                <form
                  onSubmit={handleSubmit(d => updateMutation.mutate(d))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name *</label>
                      <input
                        className="input"
                        {...register('firstName', { required: true })}
                      />
                    </div>
                    <div>
                      <label className="label">Last Name *</label>
                      <input
                        className="input"
                        {...register('lastName', { required: true })}
                      />
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
                      <label className="label">Mobile</label>
                      <input type="tel" className="input" {...register('mobile')} />
                    </div>
                    <div>
                      <label className="label">Title / Role</label>
                      <input className="input" {...register('title')} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Account</label>
                      <select className="input" {...register('accountId')}>
                        <option value="">No account</option>
                        {accountsData?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">CFA Member ID</label>
                      <input className="input" {...register('cfaMemberId')} />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input className="input" {...register('city')} />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input className="input" {...register('state')} />
                    </div>
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
                  <h3 className="font-semibold text-gray-900">Contact Details</h3>
                </div>
                <div className="card-body space-y-4 text-sm">
                  {contact.title && (
                    <DetailRow label="Title">{contact.title}</DetailRow>
                  )}
                  {contact.email && (
                    <DetailRow label="Email">
                      <a href={`mailto:${contact.email}`} className="text-brand-600 hover:underline">
                        {contact.email}
                      </a>
                    </DetailRow>
                  )}
                  {contact.phone && (
                    <DetailRow label="Phone">{contact.phone}</DetailRow>
                  )}
                  {contact.mobile && (
                    <DetailRow label="Mobile">{contact.mobile}</DetailRow>
                  )}
                  {contact.account && (
                    <DetailRow label="Account">
                      <RouterLink
                        to={`/crm/accounts/${contact.account.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {contact.account.name}
                      </RouterLink>
                    </DetailRow>
                  )}
                  {contact.cfaMemberId && (
                    <DetailRow label="CFA ID">{contact.cfaMemberId}</DetailRow>
                  )}
                  {(contact.city || contact.state) && (
                    <DetailRow label="Location">
                      {[contact.city, contact.state].filter(Boolean).join(', ')}
                    </DetailRow>
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
                      { label: 'Cats', value: contact._count?.cats ?? 0, icon: TrophyIcon },
                      {
                        label: 'Show Entries',
                        value: contact._count?.showEntries ?? 0,
                        icon: CalendarDaysIcon,
                      },
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
              {contact.cats?.map((cat: any) => (
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
              {(!contact.cats || contact.cats.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No cats linked to this contact
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Show Entries Tab */}
      {activeTab === 'Show Entries' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Show Entries</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Show</th>
                <th>Date</th>
                <th>Cat</th>
                <th>Entry #</th>
                <th>Paid</th>
                <th>Confirmed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {contact.showEntries?.map((entry: any) => (
                <tr key={entry.id}>
                  <td>
                    <RouterLink
                      to={`/crm/shows/${entry.show?.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {entry.show?.name}
                    </RouterLink>
                  </td>
                  <td>
                    {entry.show?.showDate
                      ? format(new Date(entry.show.showDate), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td>
                    {entry.cat ? (
                      <RouterLink
                        to={`/crm/cats/${entry.cat.id}`}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        {entry.cat.name}
                      </RouterLink>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{entry.entryNumber || '—'}</td>
                  <td>
                    <span className={entry.isPaid ? 'badge-green' : 'badge-red'}>
                      {entry.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    <span className={entry.isConfirmed ? 'badge-green' : 'badge-yellow'}>
                      {entry.isConfirmed ? 'Yes' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!contact.showEntries || contact.showEntries.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No show entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'Notes' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Notes</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {contact.notes?.length > 0 ? (
              contact.notes.map((note: any) => (
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
