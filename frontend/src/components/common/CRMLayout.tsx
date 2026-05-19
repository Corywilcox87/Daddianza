import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  HomeIcon, BuildingOffice2Icon, UsersIcon, TagIcon,
  TrophyIcon, CalendarDaysIcon, FunnelIcon, BriefcaseIcon,
  UserGroupIcon, CreditCardIcon, Cog6ToothIcon,
  Bars3Icon, XMarkIcon, ChevronDownIcon, BellIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/crm/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/crm/accounts', icon: BuildingOffice2Icon },
  { name: 'Contacts', href: '/crm/contacts', icon: UsersIcon },
  { name: 'Leads', href: '/crm/leads', icon: TagIcon },
  { name: 'Opportunities', href: '/crm/opportunities', icon: BriefcaseIcon },
  { name: 'divider' },
  { name: 'Cat Registry', href: '/crm/cats', icon: TrophyIcon },
  { name: 'CFA Shows', href: '/crm/shows', icon: CalendarDaysIcon },
  { name: 'divider' },
  { name: 'Users', href: '/crm/users', icon: UserGroupIcon },
  { name: 'Billing', href: '/crm/billing', icon: CreditCardIcon },
  { name: 'Settings', href: '/crm/settings', icon: Cog6ToothIcon },
];

export default function CRMLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx('flex flex-col h-full', mobile ? '' : 'w-64')}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <TrophyIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">Daddianza CRM</div>
          <div className="text-xs text-gray-500 truncate max-w-[160px]">{user?.tenant.name}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item, i) =>
          item.name === 'divider' ? (
            <div key={i} className="my-2 border-t border-gray-100" />
          ) : (
            <NavLink
              key={item.href}
              to={item.href!}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'active')
              }
            >
              {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
              {item.name}
            </NavLink>
          )
        )}
      </nav>

      {/* Plan badge */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between px-3 py-2 bg-brand-50 rounded-lg">
          <span className="text-xs font-medium text-brand-700">{user?.tenant.plan} Plan</span>
          <NavLink to="/crm/billing" className="text-xs text-brand-600 hover:text-brand-800 font-medium">
            Upgrade
          </NavLink>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <Sidebar mobile />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 relative">
              <BellIcon className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                    <div className="text-xs text-brand-600 mt-0.5 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</div>
                  </div>
                  <NavLink to="/crm/settings" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Profile Settings
                  </NavLink>
                  <NavLink to="/portal" target="_blank" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Client Portal
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
