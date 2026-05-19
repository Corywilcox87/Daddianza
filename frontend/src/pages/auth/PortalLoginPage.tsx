import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { TrophyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface PortalLoginForm {
  tenantSlug: string;
  email: string;
  password: string;
}

export default function PortalLoginPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PortalLoginForm>();
  const { portalLogin } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: PortalLoginForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/portal/login', data);
      portalLogin(res.data.data.user, res.data.data.token);
      toast.success('Welcome to the Exhibitor Portal!');
      navigate('/portal/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <TrophyIcon className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Exhibitor Portal</h1>
          <p className="text-gray-300 mt-2">CFA Show Tracker — Client Access</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your portal</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Cattery / Club Workspace</label>
              <input
                type="text"
                className={`input ${errors.tenantSlug ? 'input-error' : ''}`}
                placeholder="silvermist-cattery"
                {...register('tenantSlug', { required: 'Workspace is required' })}
              />
              {errors.tenantSlug && <p className="mt-1 text-xs text-red-500">{errors.tenantSlug.message}</p>}
              <p className="mt-1 text-xs text-gray-400">Your cattery's workspace slug (provided by your admin)</p>
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            CRM Admin?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
