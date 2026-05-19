import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import clsx from 'clsx';
import { format } from 'date-fns';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    users: number | null;
    cats: number | null;
  };
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'mo',
    limits: { users: 3, cats: 25 },
    features: [
      'Up to 3 CRM users',
      'Up to 25 cat profiles',
      'Contacts & Accounts',
      'Show management',
      'Client portal access',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'mo',
    limits: { users: 15, cats: 200 },
    features: [
      'Up to 15 CRM users',
      'Up to 200 cat profiles',
      'Everything in Starter',
      'Leads & Opportunities',
      'Advanced reporting',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'mo',
    limits: { users: null, cats: null },
    features: [
      'Unlimited CRM users',
      'Unlimited cat profiles',
      'Everything in Professional',
      'Custom integrations',
      'Dedicated account manager',
      'SLA & phone support',
    ],
  },
];

const statusColors: Record<string, string> = {
  active: 'badge-green',
  trialing: 'badge-blue',
  past_due: 'badge-red',
  canceled: 'badge-gray',
  inactive: 'badge-gray',
};

export default function BillingPage() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: () => api.get('/billing/subscription').then(r => r.data.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => api.get('/billing/plans').then(r => r.data.data),
  });

  const plans: Plan[] = plansData ?? DEFAULT_PLANS;

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) =>
      api.post('/billing/checkout', { planId }).then(r => r.data),
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.success('Plan updated!');
      }
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to start checkout'),
  });

  const portalMutation = useMutation({
    mutationFn: () => api.post('/billing/portal').then(r => r.data),
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not open billing portal');
      }
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to open billing portal'),
  });

  if (isLoading) return <PageLoader />;

  const currentPlanId = subscription?.plan?.id ?? subscription?.planId ?? '';
  const status = subscription?.status ?? 'inactive';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Manage your subscription, plan, and invoices</p>
        </div>
        {subscription && (
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="btn-secondary"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            {portalMutation.isPending ? 'Opening...' : 'Manage Billing'}
          </button>
        )}
      </div>

      {/* Current subscription */}
      {subscription && (
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Current Subscription</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  <CreditCardIcon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {subscription.plan?.name ?? 'Current Plan'}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={statusColors[status] || 'badge-gray'}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-8 sm:ml-auto">
                {subscription.currentPeriodEnd && (
                  <div className="flex items-start gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Next billing date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                )}
                {subscription.plan?.price != null && (
                  <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-sm font-medium text-gray-900">
                      ${subscription.plan.price}/mo
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan, i) => {
          const isCurrent =
            currentPlanId === plan.id ||
            subscription?.plan?.name?.toLowerCase() === plan.name.toLowerCase();
          const isPopular = i === 1;

          return (
            <div
              key={plan.id}
              className={clsx(
                'card flex flex-col relative',
                isPopular && 'ring-2 ring-brand-600'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="card-header">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-500">/{plan.interval}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {plan.limits.users != null
                    ? `${plan.limits.users} users`
                    : 'Unlimited users'}
                  {' · '}
                  {plan.limits.cats != null
                    ? `${plan.limits.cats} cats`
                    : 'Unlimited cats'}
                </div>
              </div>
              <div className="card-body flex-1">
                <ul className="space-y-2">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6">
                {isCurrent ? (
                  <button disabled className="btn-secondary w-full opacity-60 cursor-default">
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => checkoutMutation.mutate(plan.id)}
                    disabled={checkoutMutation.isPending}
                    className={clsx('w-full', isPopular ? 'btn-primary' : 'btn-secondary')}
                  >
                    {checkoutMutation.isPending ? 'Loading...' : 'Choose Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice history */}
      <InvoiceHistory />
    </div>
  );
}

function InvoiceHistory() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => api.get('/billing/invoices').then(r => r.data.data).catch(() => []),
  });

  if (isLoading) return null;
  const list: any[] = invoices ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
      {list.length === 0 ? (
        <div className="card">
          <div className="card-body text-sm text-gray-400 text-center py-8">
            No invoices found
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {list.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="font-mono text-xs">{inv.number ?? inv.id}</td>
                  <td>
                    {inv.created
                      ? format(new Date(inv.created * 1000), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td>${((inv.amount_paid ?? inv.amount ?? 0) / 100).toFixed(2)}</td>
                  <td>
                    <span
                      className={
                        inv.status === 'paid'
                          ? 'badge-green'
                          : inv.status === 'open'
                          ? 'badge-yellow'
                          : 'badge-red'
                      }
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.invoice_pdf ?? inv.pdf ? (
                      <a
                        href={inv.invoice_pdf ?? inv.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:text-brand-800 text-xs flex items-center gap-1"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" /> Download
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
