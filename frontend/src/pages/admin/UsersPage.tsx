import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, UsersIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import clsx from 'clsx';
import { format } from 'date-fns';

const CRM_ROLES = ['ADMIN', 'MANAGER', 'AGENT', 'VIEWER'] as const;

const roleColors: Record<string, string> = {
  ADMIN: 'badge-red',
  MANAGER: 'badge-orange',
  AGENT: 'badge-blue',
  VIEWER: 'badge-gray',
};

const tabs = ['CRM Users', 'Portal Users'] as const;
type Tab = typeof tabs[number];

interface CreateCRMUserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

interface CreatePortalUserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactId: string;
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('CRM Users');
  const [crmModalOpen, setCrmModalOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: crmUsers, isLoading: crmLoading } = useQuery({
    queryKey: ['crm-users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const { data: portalUsers, isLoading: portalLoading } = useQuery({
    queryKey: ['portal-users'],
    queryFn: () => api.get('/users/portal').then(r => r.data),
    enabled: activeTab === 'Portal Users',
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => api.get('/contacts', { params: { limit: 200 } }).then(r => r.data.data),
    enabled: portalModalOpen,
  });

  const crmForm = useForm<CreateCRMUserForm>({
    defaultValues: { role: 'AGENT' },
  });

  const portalForm = useForm<CreatePortalUserForm>();

  const createCrmMutation = useMutation({
    mutationFn: (data: CreateCRMUserForm) => api.post('/users', data),
    onSuccess: () => {
      toast.success('CRM user created!');
      qc.invalidateQueries({ queryKey: ['crm-users'] });
      setCrmModalOpen(false);
      crmForm.reset({ role: 'AGENT' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const createPortalMutation = useMutation({
    mutationFn: (data: CreatePortalUserForm) =>
      api.post('/users/portal', {
        ...data,
        contactId: data.contactId || undefined,
      }),
    onSuccess: () => {
      toast.success('Portal user created!');
      qc.invalidateQueries({ queryKey: ['portal-users'] });
      setPortalModalOpen(false);
      portalForm.reset();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create portal user'),
  });

  const crmUsersArr: any[] = crmUsers?.data ?? crmUsers ?? [];
  const portalUsersArr: any[] = portalUsers?.data ?? portalUsers ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage CRM team members and client portal access</p>
        </div>
        {activeTab === 'CRM Users' ? (
          <button onClick={() => setCrmModalOpen(true)} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add CRM User
          </button>
        ) : (
          <button onClick={() => setPortalModalOpen(true)} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add Portal User
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
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'CRM Users' ? (
                <UsersIcon className="w-4 h-4" />
              ) : (
                <GlobeAltIcon className="w-4 h-4" />
              )}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* CRM Users Tab */}
      {activeTab === 'CRM Users' && (
        <>
          {crmLoading ? (
            <PageLoader />
          ) : crmUsersArr.length === 0 ? (
            <EmptyState
              title="No CRM users"
              description="Add team members to give them access to the CRM."
              icon={UsersIcon}
              action={
                <button onClick={() => setCrmModalOpen(true)} className="btn-primary">
                  Add CRM User
                </button>
              }
            />
          ) : (
            <div className="card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {crmUsersArr.map((user: any) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600">{user.email}</td>
                      <td>
                        <span className={roleColors[user.role] || 'badge-gray'}>
                          {user.role}
                        </span>
                      </td>
                      <td className="text-gray-500">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
                          : 'Never'}
                      </td>
                      <td>
                        <span className={user.isActive !== false ? 'badge-green' : 'badge-red'}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Portal Users Tab */}
      {activeTab === 'Portal Users' && (
        <>
          {portalLoading ? (
            <PageLoader />
          ) : portalUsersArr.length === 0 ? (
            <EmptyState
              title="No portal users"
              description="Create portal accounts to give clients access to their show and cat data."
              icon={GlobeAltIcon}
              action={
                <button onClick={() => setPortalModalOpen(true)} className="btn-primary">
                  Add Portal User
                </button>
              }
            />
          ) : (
            <div className="card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Linked Contact</th>
                    <th>Last Login</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {portalUsersArr.map((user: any) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold flex-shrink-0">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600">{user.email}</td>
                      <td>
                        {user.contact ? (
                          <span className="text-gray-700">
                            {user.contact.firstName} {user.contact.lastName}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-gray-500">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create CRM User Modal */}
      <Modal
        open={crmModalOpen}
        onClose={() => {
          setCrmModalOpen(false);
          crmForm.reset({ role: 'AGENT' });
        }}
        title="Create CRM User"
        size="lg"
      >
        <form
          onSubmit={crmForm.handleSubmit(d => createCrmMutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                className="input"
                {...crmForm.register('firstName', { required: true })}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                className="input"
                {...crmForm.register('lastName', { required: true })}
                placeholder="Smith"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                {...crmForm.register('email', { required: true })}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                className="input"
                {...crmForm.register('password', { required: true, minLength: 8 })}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" {...crmForm.register('role', { required: true })}>
                {CRM_ROLES.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setCrmModalOpen(false);
                crmForm.reset({ role: 'AGENT' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={createCrmMutation.isPending} className="btn-primary">
              {createCrmMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Portal User Modal */}
      <Modal
        open={portalModalOpen}
        onClose={() => {
          setPortalModalOpen(false);
          portalForm.reset();
        }}
        title="Create Portal User"
        size="lg"
      >
        <form
          onSubmit={portalForm.handleSubmit(d => createPortalMutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                className="input"
                {...portalForm.register('firstName', { required: true })}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                className="input"
                {...portalForm.register('lastName', { required: true })}
                placeholder="Smith"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                {...portalForm.register('email', { required: true })}
                placeholder="jane@example.com"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Password *</label>
              <input
                type="password"
                className="input"
                {...portalForm.register('password', { required: true, minLength: 8 })}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Link to Contact (optional)</label>
              <select className="input" {...portalForm.register('contactId')}>
                <option value="">No contact linked</option>
                {contactsData?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                    {c.email ? ` — ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setPortalModalOpen(false);
                portalForm.reset();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPortalMutation.isPending}
              className="btn-primary"
            >
              {createPortalMutation.isPending ? 'Creating...' : 'Create Portal User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
