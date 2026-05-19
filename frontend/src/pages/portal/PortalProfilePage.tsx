import { useQuery } from '@tanstack/react-query';
import {
  UserCircleIcon,
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { portalApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/common/LoadingSpinner';

interface ProfileField {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}

function ProfileRow({ label, value, icon: Icon, mono }: ProfileField) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      {Icon && (
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`text-sm text-gray-900 ${mono ? 'font-mono' : 'font-medium'}`}>
          {value || <span className="text-gray-400 font-normal">Not set</span>}
        </div>
      </div>
    </div>
  );
}

export default function PortalProfilePage() {
  const { portalUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: () => portalApi.get('/portal/profile').then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  // Use profile data if available, fall back to store user
  const firstName = profile?.firstName ?? portalUser?.firstName ?? '';
  const lastName = profile?.lastName ?? portalUser?.lastName ?? '';
  const email = profile?.email ?? portalUser?.email ?? '';
  const contact = profile?.contact ?? portalUser?.contact ?? null;
  const tenant = profile?.tenant ?? portalUser?.tenant ?? null;

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your exhibitor account information</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile header card */}
        <div className="card card-body flex items-center gap-5">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials || <UserCircleIcon className="w-9 h-9" />}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{email}</p>
            {tenant?.name && (
              <p className="text-xs text-gray-400 mt-1">{tenant.name} Exhibitor Portal</p>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Account Information</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <InformationCircleIcon className="w-4 h-4 text-amber-500" />
              Read-only — contact your administrator to update
            </div>
          </div>
          <div className="px-6">
            <ProfileRow
              label="First Name"
              value={firstName}
              icon={UserCircleIcon}
            />
            <ProfileRow
              label="Last Name"
              value={lastName}
              icon={UserCircleIcon}
            />
            <ProfileRow
              label="Email Address"
              value={email}
              icon={EnvelopeIcon}
            />
          </div>
        </div>

        {/* Contact / CFA Info */}
        {contact && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">CFA Contact Information</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                This information is linked from your exhibitor contact record and is managed by your administrator.
              </p>
            </div>
            <div className="px-6">
              <ProfileRow
                label="Contact Name"
                value={`${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || null}
                icon={UserCircleIcon}
              />
              {contact.cfaMemberId && (
                <ProfileRow
                  label="CFA Member ID"
                  value={contact.cfaMemberId}
                  icon={IdentificationIcon}
                  mono
                />
              )}
              {contact.phone && (
                <ProfileRow
                  label="Phone"
                  value={contact.phone}
                  icon={PhoneIcon}
                />
              )}
              {contact.email && contact.email !== email && (
                <ProfileRow
                  label="Contact Email"
                  value={contact.email}
                  icon={EnvelopeIcon}
                />
              )}
            </div>
          </div>
        )}

        {/* Tenant / Organization Info */}
        {tenant && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Organization</h3>
            </div>
            <div className="px-6">
              <ProfileRow
                label="Organization Name"
                value={tenant.name}
                icon={BuildingOfficeIcon}
              />
              {tenant.slug && (
                <ProfileRow
                  label="Portal URL"
                  value={`daddianza.com/${tenant.slug}`}
                  icon={BuildingOfficeIcon}
                  mono
                />
              )}
              {tenant.plan && (
                <ProfileRow
                  label="Plan"
                  value={tenant.plan}
                />
              )}
            </div>
          </div>
        )}

        {/* Info notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-0.5">Need to update your information?</p>
            <p>
              Your profile details are managed by your show administrator. Please contact them directly
              to update your name, email address, CFA membership number, or any other account information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
