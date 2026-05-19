import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  ListBulletIcon,
  Link as LinkIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';
import clsx from 'clsx';
import { format } from 'date-fns';

const STAGES = [
  'PROSPECTING',
  'QUALIFICATION',
  'NEEDS_ANALYSIS',
  'VALUE_PROPOSITION',
  'DECISION_MAKERS',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;
type Stage = typeof STAGES[number];

const stageLabels: Record<Stage, string> = {
  PROSPECTING: 'Prospecting',
  QUALIFICATION: 'Qualification',
  NEEDS_ANALYSIS: 'Needs Analysis',
  VALUE_PROPOSITION: 'Value Proposition',
  DECISION_MAKERS: 'Decision Makers',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

const stageBadge: Record<Stage, string> = {
  PROSPECTING: 'badge-gray',
  QUALIFICATION: 'badge-blue',
  NEEDS_ANALYSIS: 'badge-blue',
  VALUE_PROPOSITION: 'badge-purple',
  DECISION_MAKERS: 'badge-purple',
  PROPOSAL: 'badge-yellow',
  NEGOTIATION: 'badge-orange',
  CLOSED_WON: 'badge-green',
  CLOSED_LOST: 'badge-red',
};

interface CreateOppForm {
  name: string;
  accountId: string;
  amount: string;
  stage: string;
  probability: string;
  closeDate: string;
  description: string;
}

export default function OpportunitiesPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', page],
    queryFn: () =>
      api.get('/opportunities', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const { data: pipeline } = useQuery({
    queryKey: ['opportunities-pipeline'],
    queryFn: () => api.get('/opportunities/pipeline').then(r => r.data.data),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts-all'],
    queryFn: () => api.get('/accounts', { params: { limit: 200 } }).then(r => r.data.data),
    enabled: modalOpen,
  });

  const { register, handleSubmit, reset } = useForm<CreateOppForm>({
    defaultValues: { stage: 'PROSPECTING', probability: '10' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOppForm) =>
      api.post('/opportunities', {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        probability: data.probability ? parseInt(data.probability) : undefined,
        accountId: data.accountId || undefined,
      }),
    onSuccess: () => {
      toast.success('Opportunity created!');
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunities-pipeline'] });
      setModalOpen(false);
      reset({ stage: 'PROSPECTING', probability: '10' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create opportunity'),
  });

  const opps: any[] = data?.data ?? [];
  const pipelineByStage: Record<string, any> = {};
  if (Array.isArray(pipeline)) {
    pipeline.forEach((s: any) => {
      pipelineByStage[s.stage] = s;
    });
  }

  const totalValue = opps
    .filter(o => o.stage !== 'CLOSED_LOST')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  const getStageOpps = (stage: Stage) => opps.filter(o => o.stage === stage);

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Opportunities</h1>
          <p className="page-subtitle">
            Manage your sales pipeline — ${totalValue.toLocaleString()} total value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={clsx(
                'px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
                view === 'kanban'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <Squares2X2Icon className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setView('list')}
              className={clsx(
                'px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
                view === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <ListBulletIcon className="w-4 h-4" /> List
            </button>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add Opportunity
          </button>
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STAGES.map(stage => {
          const stageData = pipelineByStage[stage];
          const count = stageData?.count ?? getStageOpps(stage).length;
          const value = stageData?.totalValue
            ? Number(stageData.totalValue)
            : getStageOpps(stage).reduce((s, o) => s + (Number(o.amount) || 0), 0);
          return (
            <div
              key={stage}
              className="flex-shrink-0 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[120px]"
            >
              <div className="text-xs text-gray-500 mb-0.5 truncate">
                {stageLabels[stage]}
              </div>
              <div className="text-sm font-bold text-gray-900">{count}</div>
              {value > 0 && (
                <div className="text-xs text-gray-400">${value.toLocaleString()}</div>
              )}
            </div>
          );
        })}
      </div>

      {opps.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Add your first opportunity to start tracking your sales pipeline."
          icon={BriefcaseIcon}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              Add Opportunity
            </button>
          }
        />
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const colOpps = getStageOpps(stage);
            return (
              <div key={stage} className="kanban-column flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 truncate">
                    {stageLabels[stage]}
                  </h3>
                  <span className="badge-gray text-xs">{colOpps.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {colOpps.map((opp: any) => (
                    <div key={opp.id} className="kanban-card">
                      <div className="font-medium text-sm text-gray-900 mb-0.5 leading-tight">
                        {opp.name}
                      </div>
                      {opp.account && (
                        <div className="text-xs text-gray-500 mb-1 truncate">
                          {opp.account.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {opp.amount != null ? (
                          <span className="text-sm font-semibold text-gray-900">
                            ${Number(opp.amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No value</span>
                        )}
                        {opp.probability != null && (
                          <span className="text-xs text-gray-400">{opp.probability}%</span>
                        )}
                      </div>
                      {opp.closeDate && (
                        <div className="text-xs text-gray-400 mt-1">
                          Close: {format(new Date(opp.closeDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  ))}
                  {colOpps.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Account</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Probability</th>
                  <th>Close Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {opps.map((opp: any) => (
                  <tr key={opp.id}>
                    <td>
                      <div className="font-medium text-gray-900">{opp.name}</div>
                      {opp.description && (
                        <div className="text-xs text-gray-400 truncate max-w-[220px]">
                          {opp.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {opp.account ? (
                        <Link
                          to={`/crm/accounts/${opp.account.id}`}
                          className="text-brand-600 hover:text-brand-700"
                        >
                          {opp.account.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={stageBadge[opp.stage as Stage] || 'badge-gray'}>
                        {stageLabels[opp.stage as Stage] || opp.stage}
                      </span>
                    </td>
                    <td>
                      {opp.amount != null
                        ? `$${Number(opp.amount).toLocaleString()}`
                        : '—'}
                    </td>
                    <td>{opp.probability != null ? `${opp.probability}%` : '—'}</td>
                    <td>
                      {opp.closeDate
                        ? format(new Date(opp.closeDate), 'MMM d, yyyy')
                        : '—'}
                    </td>
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

      {/* Create Opportunity Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset({ stage: 'PROSPECTING', probability: '10' });
        }}
        title="Create Opportunity"
        size="xl"
      >
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Opportunity Name *</label>
              <input
                className="input"
                {...register('name', { required: true })}
                placeholder="Silver Paws Annual Sponsorship"
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
              <label className="label">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                {...register('amount')}
                placeholder="5000"
              />
            </div>
            <div>
              <label className="label">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                {...register('probability')}
                placeholder="50"
              />
            </div>
            <div>
              <label className="label">Stage *</label>
              <select className="input" {...register('stage', { required: true })}>
                {STAGES.map(s => (
                  <option key={s} value={s}>
                    {stageLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Close Date</label>
              <input type="date" className="input" {...register('closeDate')} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              {...register('description')}
              placeholder="Add notes about this opportunity..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                reset({ stage: 'PROSPECTING', probability: '10' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
