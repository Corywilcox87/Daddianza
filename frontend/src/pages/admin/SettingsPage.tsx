import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const tabs = ['Profile', 'Organization', 'Security'] as const;
type Tab = typeof tabs[number];

const tabIcons: Record<Tab, React.ComponentType<{ className?: string }>> = {
  Profile: UserCircleIcon,
  Organization: BuildingOfficeIcon,
  Security: ShieldCheckIcon,
};

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
}

interface OrgForm {
  name: string;
  primaryColor: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const { user } = useAuthStore();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile, organization, and security preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="w-full md:w-52 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tabIcons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'sidebar-link w-full text-left',
                    activeTab === tab && 'active'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'Profile' && <ProfileTab user={user} />}
          {activeTab === 'Organization' && <OrganizationTab user={user} />}
          {activeTab === 'Security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const { login } = useAuthStore();

  const { register, handleSubmit, formState: { isDirty } } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.put(`/users/${user?.id}`, data),
    onSuccess: res => {
      toast.success('Profile updated!');
      // Refresh user in store if the API returns the updated user
      if (res.data?.data && user) {
        const token = localStorage.getItem('crm_token') ?? '';
        login({ ...user, ...res.data.data }, token);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile'),
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">Profile Information</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Update your personal details and contact info
        </p>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold flex-shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </>
              )}
            </div>
            <div className="flex-1">
              <label className="label">Avatar URL</label>
              <input
                className="input"
                {...register('avatarUrl')}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

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
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input bg-gray-50 cursor-not-allowed"
              value={user?.email ?? ''}
              readOnly
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support to update your email.</p>
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

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrganizationTab({ user }: { user: any }) {
  const tenant = user?.tenant;

  const { register, handleSubmit, formState: { isDirty } } = useForm<OrgForm>({
    defaultValues: {
      name: tenant?.name ?? '',
      primaryColor: tenant?.primaryColor ?? '#6366f1',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: OrgForm) => api.put('/tenant', data),
    onSuccess: () => {
      toast.success('Organization settings saved!');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update organization'),
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">Organization Settings</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure your organization name and branding
        </p>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-5">
          <div>
            <label className="label">Organization Name *</label>
            <input
              className="input"
              {...register('name', { required: true })}
              placeholder="CFA Show Management"
            />
          </div>

          <div>
            <label className="label">Slug</label>
            <input
              className="input bg-gray-50 cursor-not-allowed"
              value={tenant?.slug ?? ''}
              readOnly
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">
              Used in portal URLs. Contact support to change your slug.
            </p>
          </div>

          <div>
            <label className="label">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                {...register('primaryColor')}
              />
              <input
                className="input flex-1"
                {...register('primaryColor')}
                placeholder="#6366f1"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Used as the accent color in the client portal and emails.
            </p>
          </div>

          <div>
            <label className="label">Current Plan</label>
            <div className="flex items-center gap-2">
              <span className="badge-blue">{tenant?.plan ?? 'STARTER'}</span>
              <a href="/crm/billing" className="text-sm text-brand-600 hover:text-brand-700">
                Manage subscription
              </a>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordForm>();
  const newPassword = watch('newPassword');

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      reset();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">Change Password</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Update your password to keep your account secure
        </p>
      </div>
      <div className="card-body">
        <form
          onSubmit={handleSubmit(d => changePasswordMutation.mutate(d))}
          className="space-y-4 max-w-md"
        >
          <div>
            <label className="label">Current Password *</label>
            <input
              type="password"
              className={clsx('input', errors.currentPassword && 'input-error')}
              {...register('currentPassword', { required: 'Current password is required' })}
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              className={clsx('input', errors.newPassword && 'input-error')}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
              placeholder="Min 8 characters"
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <input
              type="password"
              className={clsx('input', errors.confirmPassword && 'input-error')}
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: value => value === newPassword || 'Passwords do not match',
              })}
              placeholder="Repeat new password"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-medium mb-1">Password requirements:</p>
            <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
              <li>At least 8 characters long</li>
              <li>Mix of letters and numbers recommended</li>
              <li>Avoid reusing recent passwords</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
