import { useQuery } from '@tanstack/react-query';
import { TrophyIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { portalApi } from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import clsx from 'clsx';

const sexLabel = (sex: string) => {
  const map: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    ALTERED_MALE: 'Altered Male',
    ALTERED_FEMALE: 'Altered Female',
  };
  return map[sex] || sex;
};

const sexColor = (sex: string) => {
  if (sex === 'MALE' || sex === 'ALTERED_MALE') return 'badge-blue';
  return 'badge-purple';
};

export default function PortalCatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-cats'],
    queryFn: () => portalApi.get('/portal/cats').then(r => r.data.data ?? r.data),
  });

  if (isLoading) return <PageLoader />;

  const cats: any[] = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Cats</h1>
          <p className="page-subtitle">
            Your registered cats eligible for CFA shows — {cats.length} cat{cats.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {cats.length === 0 ? (
        <EmptyState
          title="No cats registered"
          description="Your cats will appear here once they have been added by your show manager. Contact your administrator to add cat profiles."
          icon={TrophyIcon}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cats.map((cat: any) => (
            <div key={cat.id} className="card hover:shadow-md transition-shadow">
              {/* Card header / avatar */}
              <div className="px-5 pt-5 pb-4 flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 leading-snug truncate" title={cat.name}>
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.breed}</p>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-gray-100 px-5 py-3 space-y-2">
                {/* Title badge */}
                {cat.currentTitle && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Title</span>
                    <span className="badge-purple">{cat.currentTitle}</span>
                  </div>
                )}

                {/* Sex */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Sex</span>
                  <span className={clsx('badge', sexColor(cat.sex))}>{sexLabel(cat.sex)}</span>
                </div>

                {/* Color */}
                {cat.color && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Color</span>
                    <span className="text-xs text-gray-700 font-medium">{cat.color}</span>
                  </div>
                )}

                {/* Registration */}
                {cat.registrationNumber && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <IdentificationIcon className="w-3.5 h-3.5" />
                      Reg #
                    </span>
                    <span className="text-xs font-mono text-gray-700 truncate max-w-[120px]">
                      {cat.registrationNumber}
                    </span>
                  </div>
                )}

                {/* Show count */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Shows Entered</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {cat._count?.showEntries ?? cat.showCount ?? 0}
                  </span>
                </div>

                {/* Active status */}
                {cat.isActive === false && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className="badge-red">Inactive</span>
                  </div>
                )}
              </div>

              {/* Owner info */}
              {cat.ownerName && (
                <div className="border-t border-gray-100 px-5 py-2">
                  <p className="text-xs text-gray-400">Owner: {cat.ownerName}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {cats.length > 0 && (
        <p className="mt-6 text-sm text-gray-400 text-center">
          Cat profiles are managed by your show administrator. Contact them to update cat information.
        </p>
      )}
    </div>
  );
}
