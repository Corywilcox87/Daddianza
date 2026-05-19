import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BuildingOffice2Icon, UsersIcon, TrophyIcon, CalendarDaysIcon,
  BriefcaseIcon, TagIcon, ArrowTrendingUpIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const statCards = [
    { label: 'Accounts', value: stats?.counts.accounts, icon: BuildingOffice2Icon, color: 'bg-blue-100 text-blue-600', href: '/crm/accounts' },
    { label: 'Contacts', value: stats?.counts.contacts, icon: UsersIcon, color: 'bg-purple-100 text-purple-600', href: '/crm/contacts' },
    { label: 'Active Cats', value: stats?.counts.cats, icon: TrophyIcon, color: 'bg-amber-100 text-amber-600', href: '/crm/cats' },
    { label: 'Open Leads', value: stats?.counts.leads, icon: TagIcon, color: 'bg-green-100 text-green-600', href: '/crm/leads' },
    { label: 'Opportunities', value: stats?.counts.openOpportunities, icon: BriefcaseIcon, color: 'bg-indigo-100 text-indigo-600', href: '/crm/opportunities' },
    { label: 'Tasks Due', value: stats?.counts.tasksDue, icon: CheckCircleIcon, color: 'bg-red-100 text-red-600', href: '/crm/tasks' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.firstName}!</h1>
          <p className="page-subtitle">Here's what's happening with {user?.tenant.name}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/crm/shows" className="btn-secondary">View Shows</Link>
          <Link to="/crm/cats" className="btn-primary">Add Cat</Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.href} className="stat-card group hover:shadow-md transition-shadow">
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Shows */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Shows</h2>
            <Link to="/crm/shows" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.upcomingShows?.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No upcoming shows</div>
            )}
            {stats?.upcomingShows?.map((show: any) => (
              <Link key={show.id} to={`/crm/shows/${show.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarDaysIcon className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{show.name}</div>
                  <div className="text-xs text-gray-500">{show.city}, {show.state} · {format(new Date(show.showDate), 'MMM d, yyyy')}</div>
                </div>
                <div className="text-xs text-gray-400">{show._count?.entries} entries</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Entries */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Show Entries</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.recentEntries?.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No recent entries</div>
            )}
            {stats?.recentEntries?.map((entry: any) => (
              <div key={entry.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{entry.cat?.name}</div>
                  <div className="text-xs text-gray-500">{entry.cat?.breed}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{entry.show?.name}</div>
                  <div className="text-xs text-gray-400">{format(new Date(entry.show?.showDate), 'MMM d')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Value */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <ArrowTrendingUpIcon className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-gray-900">Sales Pipeline</h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            ${Number(stats?.pipelineValue || 0).toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">total pipeline value</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {stats?.counts.openOpportunities} open opportunities
        </p>
        <Link to="/crm/opportunities" className="btn-secondary btn-sm mt-3 inline-flex">
          View Pipeline
        </Link>
      </div>
    </div>
  );
}
