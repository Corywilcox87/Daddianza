import { useQuery } from '@tanstack/react-query';
import { TrophyIcon, StarIcon, CalendarDaysIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { portalApi } from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { format } from 'date-fns';
import clsx from 'clsx';

// Award badge styling — gold for Best in Show, purple for Grand Champion, blue otherwise
const awardBadgeClass = (award: string | null | undefined) => {
  if (!award) return '';
  if (award === 'Best in Show' || award === 'Best Cat in Show') {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300';
  }
  if (award.includes('Grand Champion') || award.includes('Grand Premier') || award === 'Grand') {
    return 'badge-purple';
  }
  if (award.includes('Best') || award.includes('National Winner') || award === 'NW') {
    return 'badge-orange';
  }
  return 'badge-blue';
};

export default function PortalResultsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-results'],
    queryFn: () => portalApi.get('/portal/results').then(r => r.data.data ?? r.data),
  });

  if (isLoading) return <PageLoader />;

  const results: any[] = Array.isArray(data) ? data : [];

  // Summary stats
  const totalPoints = results.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
  const showIds = new Set(results.map(r => r.show?.id ?? r.showId).filter(Boolean));
  const showsCompeted = showIds.size;
  const finalsList = results.filter(r => r.finals === true || r.isFinals === true || r.inFinals === true);
  const finalsCount = finalsList.length;

  // Best placement: lower number = better (1st is best)
  const placements = results
    .map(r => Number(r.placement))
    .filter(p => !isNaN(p) && p > 0);
  const bestPlacement = placements.length > 0 ? Math.min(...placements) : null;

  // Group results by show
  const grouped: Record<string, { show: any; results: any[] }> = {};
  for (const r of results) {
    const showId = r.show?.id ?? r.showId ?? 'unknown';
    if (!grouped[showId]) {
      grouped[showId] = { show: r.show ?? { id: showId, name: r.showName ?? 'Unknown Show' }, results: [] };
    }
    grouped[showId].results.push(r);
  }
  const groups = Object.values(grouped).sort((a, b) => {
    const dateA = new Date(a.show?.showDate ?? 0).getTime();
    const dateB = new Date(b.show?.showDate ?? 0).getTime();
    return dateB - dateA; // most recent first
  });

  const summaryStats = [
    {
      label: 'Total Points',
      value: totalPoints.toLocaleString(),
      icon: StarIcon,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Best Placement',
      value: bestPlacement != null ? `#${bestPlacement}` : '—',
      icon: TrophyIcon,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Shows Competed',
      value: showsCompeted,
      icon: CalendarDaysIcon,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Finals Appearances',
      value: finalsCount,
      icon: SparklesIcon,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Results History</h1>
          <p className="page-subtitle">
            Your show results across all competitions
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={clsx('stat-icon', stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="Your show results will appear here once your entries have been judged. Enter a show to get started!"
          icon={TrophyIcon}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ show, results: groupResults }) => (
            <div key={show.id} className="card overflow-hidden">
              {/* Show header */}
              <div className="card-header bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-gray-900">{show.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                      {show.showDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {format(new Date(show.showDate), 'MMMM d, yyyy')}
                        </span>
                      )}
                      {(show.city || show.state) && (
                        <span>{[show.city, show.state].filter(Boolean).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="badge-gray">
                      {groupResults.length} result{groupResults.length !== 1 ? 's' : ''}
                    </span>
                    {groupResults.reduce((s, r) => s + (Number(r.points) || 0), 0) > 0 && (
                      <span className="badge-purple font-semibold">
                        {groupResults.reduce((s, r) => s + (Number(r.points) || 0), 0)} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Results table */}
              <div className="table-container border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cat</th>
                      <th>Ring</th>
                      <th>Judge</th>
                      <th>Award</th>
                      <th>Placement</th>
                      <th>Points</th>
                      <th>Finals</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {groupResults.map((result: any) => (
                      <tr key={result.id}>
                        {/* Cat */}
                        <td>
                          <div className="font-medium text-gray-900">
                            {result.cat?.name ?? result.catName ?? '—'}
                          </div>
                          {(result.cat?.breed || result.breed) && (
                            <div className="text-xs text-gray-400">
                              {result.cat?.breed ?? result.breed}
                            </div>
                          )}
                        </td>

                        {/* Ring */}
                        <td className="text-sm text-gray-700">
                          {result.ringNumber ?? result.ring ?? '—'}
                        </td>

                        {/* Judge */}
                        <td className="text-sm text-gray-700">
                          {result.judge?.name ?? result.judgeName ?? result.judge ?? '—'}
                        </td>

                        {/* Award */}
                        <td>
                          {result.award ? (
                            <span className={awardBadgeClass(result.award)}>
                              {result.award}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Placement */}
                        <td>
                          {result.placement != null ? (
                            <span className={clsx(
                              'font-semibold text-sm',
                              result.placement === 1 ? 'text-amber-600' :
                              result.placement === 2 ? 'text-gray-500' :
                              result.placement === 3 ? 'text-amber-800' : 'text-gray-700'
                            )}>
                              {result.placement === 1 ? '1st' :
                               result.placement === 2 ? '2nd' :
                               result.placement === 3 ? '3rd' :
                               `${result.placement}th`}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Points */}
                        <td>
                          {result.points != null && Number(result.points) > 0 ? (
                            <span className="font-semibold text-gray-900">
                              {Number(result.points).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Finals */}
                        <td>
                          {(result.finals === true || result.isFinals === true || result.inFinals === true) ? (
                            <span className="inline-flex items-center gap-1 badge-green">
                              <SparklesIcon className="w-3.5 h-3.5" />
                              Finals
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
