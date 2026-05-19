import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrophyIcon, CalendarDaysIcon, StarIcon, ClipboardDocumentListIcon,
  ArrowRightIcon, MapPinIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { portalApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  UPCOMING: 'badge-yellow',
  ENTRIES_OPEN: 'badge-green',
  ENTRIES_CLOSED: 'badge-orange',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-gray',
  CANCELLED: 'badge-red',
};

export default function PortalDashboard() {
  const { portalUser } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: () => portalApi.get('/portal/profile').then(r => r.data.data),
  });

  const { data: shows, isLoading: showsLoading } = useQuery({
    queryKey: ['portal-shows'],
    queryFn: () => portalApi.get('/portal/shows').then(r => r.data.data ?? r.data),
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['portal-entries'],
    queryFn: () => portalApi.get('/portal/entries').then(r => r.data.data ?? r.data),
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['portal-results'],
    queryFn: () => portalApi.get('/portal/results').then(r => r.data.data ?? r.data),
  });

  const { data: cats, isLoading: catsLoading } = useQuery({
    queryKey: ['portal-cats'],
    queryFn: () => portalApi.get('/portal/cats').then(r => r.data.data ?? r.data),
  });

  const isLoading = showsLoading || entriesLoading || resultsLoading || catsLoading;
  if (isLoading) return <PageLoader />;

  const catList = Array.isArray(cats) ? cats : [];
  const entryList = Array.isArray(entries) ? entries : [];
  const resultList = Array.isArray(results) ? results : [];
  const showList = Array.isArray(shows) ? shows : [];

  const upcomingShows = showList
    .filter((s: any) => s.status === 'UPCOMING' || s.status === 'ENTRIES_OPEN')
    .slice(0, 4);

  const recentResults = resultList.slice(0, 5);

  const totalPoints = resultList.reduce((sum: number, r: any) => sum + (Number(r.points) || 0), 0);
  const showsEntered = new Set(entryList.map((e: any) => e.show?.id ?? e.showId)).size;
  const upcomingEntries = entryList.filter((e: any) =>
    e.show?.status === 'UPCOMING' || e.show?.status === 'ENTRIES_OPEN'
  ).length;

  const stats = [
    {
      label: 'My Cats',
      value: catList.length,
      icon: TrophyIcon,
      color: 'bg-amber-100 text-amber-600',
      href: '/portal/cats',
    },
    {
      label: 'Upcoming Entries',
      value: upcomingEntries,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-100 text-blue-600',
      href: '/portal/entries',
    },
    {
      label: 'Total Points',
      value: totalPoints,
      icon: StarIcon,
      color: 'bg-purple-100 text-purple-600',
      href: '/portal/results',
    },
    {
      label: 'Shows Entered',
      value: showsEntered,
      icon: CalendarDaysIcon,
      color: 'bg-green-100 text-green-600',
      href: '/portal/entries',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {portalUser?.firstName}!
          </h1>
          <p className="page-subtitle">
            Here's your exhibitor overview for {portalUser?.tenant.name}
          </p>
        </div>
        <Link to="/portal/shows" className="btn-primary">
          <CalendarDaysIcon className="w-4 h-4" />
          Enter a Show
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href} className="stat-card group hover:shadow-md transition-shadow">
            <div className={clsx('stat-icon', stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shows */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Shows</h2>
            <Link to="/portal/shows" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingShows.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No upcoming shows at this time.
              </div>
            )}
            {upcomingShows.map((show: any) => {
              const deadlinePast = show.entryDeadline && isPast(new Date(show.entryDeadline));
              return (
                <div key={show.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-medium text-gray-900 text-sm leading-snug">{show.name}</div>
                    <span className={clsx(statusColors[show.status] || 'badge-gray', 'flex-shrink-0')}>
                      {show.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      {show.showDate ? format(new Date(show.showDate), 'MMM d, yyyy') : '—'}
                    </span>
                    {(show.city || show.state) && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {[show.city, show.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {show.entryDeadline && (
                      <span className={clsx('flex items-center gap-1', deadlinePast ? 'text-red-500' : 'text-amber-600')}>
                        <ClockIcon className="w-3.5 h-3.5" />
                        {deadlinePast
                          ? 'Deadline passed'
                          : `Deadline ${formatDistanceToNow(new Date(show.entryDeadline), { addSuffix: true })}`}
                      </span>
                    )}
                  </div>
                  {show.status === 'ENTRIES_OPEN' && !deadlinePast && (
                    <Link to="/portal/shows" className="btn-primary btn-sm mt-3 inline-flex">
                      Enter Show
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Results */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Results</h2>
            <Link to="/portal/results" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentResults.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No results yet. Enter a show to get started!
              </div>
            )}
            {recentResults.map((result: any) => (
              <div key={result.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <StarIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.cat?.name ?? result.catName ?? '—'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {result.show?.name ?? result.showName ?? '—'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {result.award && (
                    <div className={clsx(
                      'badge text-xs',
                      result.award === 'Best in Show' ? 'bg-yellow-100 text-yellow-800' :
                      result.award?.includes('Grand') ? 'badge-purple' : 'badge-blue'
                    )}>
                      {result.award}
                    </div>
                  )}
                  {result.points != null && (
                    <div className="text-xs text-gray-400 mt-0.5">{result.points} pts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 card card-body">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/portal/shows" className="btn-primary">
            <CalendarDaysIcon className="w-4 h-4" />
            Enter a Show
          </Link>
          <Link to="/portal/cats" className="btn-secondary">
            <TrophyIcon className="w-4 h-4" />
            View My Cats
          </Link>
          <Link to="/portal/entries" className="btn-secondary">
            <ClipboardDocumentListIcon className="w-4 h-4" />
            My Entries
          </Link>
          <Link to="/portal/results" className="btn-secondary">
            <StarIcon className="w-4 h-4" />
            View Results
          </Link>
        </div>
      </div>
    </div>
  );
}
