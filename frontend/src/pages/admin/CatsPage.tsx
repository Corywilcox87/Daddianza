import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';

const CFA_BREEDS = [
  'Abyssinian','American Bobtail','American Curl','American Shorthair','American Wirehair',
  'Balinese','Bengal','Birman','Bombay','British Shorthair','Burmese','Burmilla',
  'Chartreux','Colorpoint Shorthair','Cornish Rex','Devon Rex','Egyptian Mau',
  'European Burmese','Exotic','Havana Brown','Japanese Bobtail','Javanese',
  'Khao Manee','Korat','Kurilian Bobtail','LaPerm','Lykoi','Maine Coon',
  'Manx','Norwegian Forest Cat','Ocicat','Oriental','Persian','Peterbald',
  'Ragamuffin','Ragdoll','Russian Blue','Selkirk Rex','Siamese','Siberian',
  'Singapura','Somali','Sphynx','Thai','Tonkinese','Toyger','Turkish Angora','Turkish Van',
  'Household Pet'
];

export default function CatsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [breed, setBreed] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cats', page, search, breed],
    queryFn: () => api.get('/cats', { params: { page, limit: 20, search: search || undefined, breed: breed || undefined } }).then(r => r.data),
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/cats', data),
    onSuccess: () => {
      toast.success('Cat profile created!');
      qc.invalidateQueries({ queryKey: ['cats'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create cat'),
  });

  const sexLabel = (sex: string) => {
    const map: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', ALTERED_MALE: 'Altered Male', ALTERED_FEMALE: 'Altered Female' };
    return map[sex] || sex;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cat Registry</h1>
          <p className="page-subtitle">Manage cat profiles for CFA show entries</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Cat
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search cats..." className="input pl-9"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-48" value={breed} onChange={e => { setBreed(e.target.value); setPage(1); }}>
          <option value="">All Breeds</option>
          {CFA_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <>
          {data?.data?.length === 0 ? (
            <EmptyState title="No cats found" description="Add cats to start tracking CFA show entries." icon={TrophyIcon}
              action={<button onClick={() => setModalOpen(true)} className="btn-primary">Add Cat</button>} />
          ) : (
            <div className="card overflow-hidden">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cat Name</th>
                      <th>Registration</th>
                      <th>Breed</th>
                      <th>Sex</th>
                      <th>Title</th>
                      <th>Owner</th>
                      <th>Shows</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data?.data?.map((cat: any) => (
                      <tr key={cat.id}>
                        <td>
                          <Link to={`/crm/cats/${cat.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                            {cat.name}
                          </Link>
                          {!cat.isActive && <span className="ml-2 badge-red">Inactive</span>}
                        </td>
                        <td className="font-mono text-xs">{cat.registrationNumber || '—'}</td>
                        <td>{cat.breed}</td>
                        <td>{sexLabel(cat.sex)}</td>
                        <td>{cat.currentTitle ? <span className="badge-purple">{cat.currentTitle}</span> : '—'}</td>
                        <td>
                          {cat.contact ? (
                            <Link to={`/crm/contacts/${cat.contact.id}`} className="text-brand-600 hover:text-brand-700">
                              {cat.contact.firstName} {cat.contact.lastName}
                            </Link>
                          ) : cat.ownerName || '—'}
                        </td>
                        <td>{cat._count?.showEntries ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data?.pagination && (
                <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages}
                  total={data.pagination.total} limit={data.pagination.limit} onChange={setPage} />
              )}
            </div>
          )}
        </>
      )}

      {/* Create Cat Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Add Cat Profile" size="2xl">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Cat Name *</label>
              <input className="input" {...register('name', { required: true })} placeholder="GC RW Silvermist Moonbeam" />
            </div>
            <div>
              <label className="label">CFA Registration #</label>
              <input className="input" {...register('registrationNumber')} placeholder="CFA2024XXXX" />
            </div>
            <div>
              <label className="label">Breed *</label>
              <select className="input" {...register('breed', { required: true })}>
                <option value="">Select breed...</option>
                {CFA_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sex *</label>
              <select className="input" {...register('sex', { required: true })}>
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="ALTERED_MALE">Altered Male</option>
                <option value="ALTERED_FEMALE">Altered Female</option>
              </select>
            </div>
            <div>
              <label className="label">Color / Pattern</label>
              <input className="input" {...register('color')} placeholder="Blue tabby" />
            </div>
            <div>
              <label className="label">Birth Date</label>
              <input type="date" className="input" {...register('birthDate')} />
            </div>
            <div>
              <label className="label">Current Title</label>
              <input className="input" {...register('currentTitle')} placeholder="GC, RW, NW..." />
            </div>
            <div>
              <label className="label">Owner Name</label>
              <input className="input" {...register('ownerName')} />
            </div>
            <div>
              <label className="label">Breeder Name</label>
              <input className="input" {...register('breederName')} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Cat Profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
