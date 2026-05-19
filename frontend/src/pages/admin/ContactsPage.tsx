import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';

interface CreateContactForm {
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

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: () =>
      api
        .get('/contacts', {
          params: { page, limit: 20, search: search || undefined },
        })
        .then(r => r.data),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts-all'],
    queryFn: () => api.get('/accounts', { params: { limit: 200 } }).then(r => r.data.data),
    enabled: modalOpen,
  });

  const { register, handleSubmit, reset } = useForm<CreateContactForm>();

  const createMutation = useMutation({
    mutationFn: (data: CreateContactForm) =>
      api.post('/contacts', {
        ...data,
        accountId: data.accountId || undefined,
      }),
    onSuccess: () => {
      toast.success('Contact created!');
      qc.invalidateQueries({ queryKey: ['contacts'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create contact'),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Manage individual exhibitors and CFA members</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="input pl-9"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {data?.data?.length === 0 ? (
            <EmptyState
              title="No contacts found"
              description="Add your first contact to start tracking CFA members and exhibitors."
              icon={UsersIcon}
              action={
                <button onClick={() => setModalOpen(true)} className="btn-primary">
                  Add Contact
                </button>
              }
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Account</th>
                      <th>CFA Member ID</th>
                      <th>Cats</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data?.data?.map((contact: any) => (
                      <tr key={contact.id}>
                        <td>
                          <Link
                            to={`/crm/contacts/${contact.id}`}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {contact.firstName} {contact.lastName}
                          </Link>
                          {contact.title && (
                            <div className="text-xs text-gray-400">{contact.title}</div>
                          )}
                        </td>
                        <td>{contact.email || '—'}</td>
                        <td>{contact.phone || contact.mobile || '—'}</td>
                        <td>
                          {contact.account ? (
                            <Link
                              to={`/crm/accounts/${contact.account.id}`}
                              className="text-brand-600 hover:text-brand-700"
                            >
                              {contact.account.name}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{contact.cfaMemberId || '—'}</td>
                        <td>{contact._count?.cats ?? 0}</td>
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

      {/* Create Contact Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="Create Contact"
        size="xl"
      >
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                className="input"
                {...register('firstName', { required: true })}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                className="input"
                {...register('lastName', { required: true })}
                placeholder="Smith"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                {...register('email')}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                {...register('phone')}
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input
                type="tel"
                className="input"
                {...register('mobile')}
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="label">Title / Role</label>
              <input
                className="input"
                {...register('title')}
                placeholder="Show Manager"
              />
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
              <input
                className="input"
                {...register('cfaMemberId')}
                placeholder="CFA-12345"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" {...register('city')} placeholder="Kansas City" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" {...register('state')} placeholder="MO" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
