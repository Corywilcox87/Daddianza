import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import clsx from 'clsx';

const LEAD_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROCESS', 'CONVERTED', 'DEAD'] as const;
type LeadStatus = typeof LEAD_STATUSES[number];

const LEAD_SOURCES = [
  'WEB', 'PHONE', 'EMAIL', 'REFERRAL', 'SOCIAL', 'EVENT', 'TRADE_SHOW', 'OTHER',
] as const;

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROCESS: 'In Process',
  CONVERTED: 'Converted',
  DEAD: 'Dead',
};

const statusColors: Record<LeadStatus, string> = {
  NEW: 'badge-blue',
  ASSIGNED: 'badge-purple',
  IN_PROCESS: 'badge-yellow',
  CONVERTED: 'badge-green',
  DEAD: 'badge-red',
};

const columnBg: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50',
  ASSIGNED: 'bg-purple-50',
  IN_PROCESS: 'bg-yellow-50',
  CONVERTED: 'bg-green-50',
  DEAD: 'bg-red-50',
};

const sourceColors: Record<string, string> = {
  WEB: 'badge-blue',
  PHONE: 'badge-gray',
  EMAIL: 'badge-purple',
  REFERRAL: 'badge-green',
  SOCIAL: 'badge-orange',
  EVENT: 'badge-yellow',
  TRADE_SHOW: 'badge-orange',
  OTHER: 'badge-gray',
};

interface CreateLeadForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: string;
  source: string;
  description: string;
}

export default function LeadsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.get('/leads', { params: { limit: 200 } }).then(r => r.data),
  });

  const { register, handleSubmit, reset } = useForm<CreateLeadForm>({
    defaultValues: { status: 'NEW', source: 'WEB' },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeadForm) => api.post('/leads', data),
    onSuccess: () => {
      toast.success('Lead created!');
      qc.invalidateQueries({ queryKey: ['leads'] });
      setModalOpen(false);
      reset({ status: 'NEW', source: 'WEB' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create lead'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/leads/${id}`, { status }),
    onSuccess: () => {
      toast.success('Lead updated!');
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update lead'),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => api.post(`/leads/${id}/convert`),
    onSuccess: () => {
      toast.success('Lead converted to contact!');
      qc.invalidateQueries({ queryKey: ['leads'] });
      setConvertingId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to convert lead'),
  });

  const leads: any[] = data?.data ?? [];

  const getColumnLeads = (status: LeadStatus) =>
    leads.filter((l: any) => l.status === status);

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Track and manage prospective customers through your sales funnel</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Add your first lead to start building your sales pipeline."
          icon={TagIcon}
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              Add Lead
            </button>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map(status => {
            const colLeads = getColumnLeads(status);
            return (
              <div key={status} className="kanban-column flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {statusLabels[status]}
                  </h3>
                  <span
                    className={clsx(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                      columnBg[status],
                      'text-gray-700'
                    )}
                  >
                    {colLeads.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {colLeads.map((lead: any) => (
                    <div key={lead.id} className="kanban-card">
                      <div className="font-medium text-sm text-gray-900 mb-0.5">
                        {lead.firstName} {lead.lastName}
                      </div>
                      {lead.company && (
                        <div className="text-xs text-gray-500 mb-1">{lead.company}</div>
                      )}
                      {lead.email && (
                        <div className="text-xs text-gray-400 truncate mb-2">{lead.email}</div>
                      )}
                      {lead.source && (
                        <div className="mb-2">
                          <span className={clsx(sourceColors[lead.source] || 'badge-gray', 'text-xs')}>
                            {lead.source.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        <select
                          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 bg-white flex-1"
                          value={lead.status}
                          onChange={e =>
                            updateStatusMutation.mutate({ id: lead.id, status: e.target.value })
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          {LEAD_STATUSES.map(s => (
                            <option key={s} value={s}>
                              {statusLabels[s]}
                            </option>
                          ))}
                        </select>
                        {lead.status !== 'CONVERTED' && lead.status !== 'DEAD' && (
                          <button
                            onClick={() => {
                              setConvertingId(lead.id);
                              convertMutation.mutate(lead.id);
                            }}
                            disabled={convertMutation.isPending && convertingId === lead.id}
                            className="text-xs text-brand-600 hover:text-brand-800 font-medium whitespace-nowrap flex items-center gap-1"
                            title="Convert to contact"
                          >
                            <ArrowPathIcon className="w-3 h-3" />
                            Convert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">No leads</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset({ status: 'NEW', source: 'WEB' });
        }}
        title="Create Lead"
        size="xl"
      >
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
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
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                {...register('email')}
                placeholder="jane@example.com"
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
              <label className="label">Company</label>
              <input
                className="input"
                {...register('company')}
                placeholder="Silver Paws Cattery"
              />
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                {...register('title')}
                placeholder="Breeder"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...register('status')}>
                {LEAD_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" {...register('source')}>
                {LEAD_SOURCES.map(s => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              {...register('description')}
              placeholder="Add notes about this lead..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                reset({ status: 'NEW', source: 'WEB' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
