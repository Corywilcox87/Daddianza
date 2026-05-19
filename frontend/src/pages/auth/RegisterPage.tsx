import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { TrophyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface RegisterForm {
  tenantName: string;
  slug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const tenantName = watch('tenantName', '');

  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setValue('slug', slug);
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      login(res.data.data.user, res.data.data.token);
      toast.success('Account created! Welcome to Daddianza CRM.');
      navigate('/crm/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <TrophyIcon className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Start Free Trial</h1>
          <p className="text-brand-200 mt-2">14 days free — no credit card required</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Cattery / Organization Name</label>
              <input
                type="text"
                className={`input ${errors.tenantName ? 'input-error' : ''}`}
                placeholder="Silvermist Cattery"
                {...register('tenantName', { required: 'Organization name is required', onChange: handleTenantNameChange })}
              />
              {errors.tenantName && <p className="mt-1 text-xs text-red-500">{errors.tenantName.message}</p>}
            </div>

            <div>
              <label className="label">Workspace URL</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10">daddianza.com/</span>
                <input
                  type="text"
                  className="input rounded-l-none"
                  {...register('slug', { required: 'Workspace URL is required', pattern: { value: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' } })}
                />
              </div>
              {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input type="text" className="input" {...register('firstName', { required: true })} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input type="text" className="input" {...register('lastName', { required: true })} />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min 8 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
