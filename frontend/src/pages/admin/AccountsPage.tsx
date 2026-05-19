import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';

const ACCOUNT_TYPES = ['EXHIBITOR', 'CATTERY', 'CLUB', 'JUDGE', 'SPONSOR', 'VENDOR', 'OTHER'] as const;

const typeColors: Record<string, string> = {
  EXHIBITOR: 'badge-blue',
  CATTERY: 'badge-purple',
  CLUB: 'badge-green',
  JUDGE: 'badge-orange',
  SPONSOR: 'badge-yellow',
  VENDOR: 'badge-gray',
  OTHER: 'badge-gray',
};

interface CreateAccountForm {
  name: string;
  type: string;
  email: string;
  phone: string;
  website: string;
  billingCity: string;
  billingState: string;
  description: string;
}

export default function AccountsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', page, search, type],
    queryFn: () =>
      api
        .get('/accounts', {
          params: { page, limit: 20, search: search || undefined, type: type || undefined },
        })
        .then(r => r.data),
  });

  const { register, handleSubmit, reset } = useForm<CreateAccountForm>();

  const createMutation = useMutation({
    mutationFn: (data: CreateAccountForm) => api.post('/accounts', data),
    onSuccess: () => {
      toast.success('Account created!');
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create account'),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage exhibitors, catteries, clubs, and other organizations</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Account
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="input pl-9"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input w-44"
          value={type}
          onChange={e => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          {ACCOUNT_TYPES.map(t => (
            <option key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {data?.data?.length === 0 ? (
            <EmptyState
              title="No accounts found"
              description="Add your first account to start managing exhibitors, catteries, and clubs."
              icon={BuildingOffice2Icon}
              action={
                <button onClick={() => setModalOpen(true)} className="btn-primary">
                  Add Account
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
                      <th>Type</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th>Contacts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data?.data?.map((account: any) => (
                      <tr key={account.id}>
                        <td>
                          <Link
                            to={`/crm/accounts/${account.id}`}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {account.name}
                          </Link>
                          {account.website && (
                            <div className="text-xs text-gray-400 truncate max-w-[180px]">
                              {account.website}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={typeColors[account.type] || 'badge-gray'}>
                            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td>{account.email || '—'}</td>
                        <td>{account.phone || '—'}</td>
                        <td>
                          {account.billingCity && account.billingState
                            ? `${account.billingCity}, ${account.billingState}`
                            : account.billingCity || account.billingState || '—'}
                        </td>
                        <td>{account._count?.contacts ?? 0}</td>
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

      {/* Create Account Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="Create Account"
        size="xl"
      >
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Account Name *</label>
              <input
                className="input"
                {...register('name', { required: true })}
                placeholder="Silver Paws Cattery"
              />
            </div>
            <div>
              <label className="label">Type *</label>
              <select className="input" {...register('type', { required: true })}>
                <option value="">Select type...</option>
                {ACCOUNT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                {...register('email')}
                placeholder="info@example.com"
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
              <label className="label">Website</label>
              <input
                className="input"
                {...register('website')}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" {...register('billingCity')} placeholder="Kansas City" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" {...register('billingState')} placeholder="MO" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              {...register('description')}
              placeholder="Brief description of this account..."
            />
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
              {createMutation.isPending ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
