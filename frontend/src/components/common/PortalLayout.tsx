import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  HomeIcon, TrophyIcon, CalendarDaysIcon, ClipboardDocumentListIcon,
  StarIcon, UserCircleIcon, Bars3Icon, XMarkIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/portal/dashboard', icon: HomeIcon },
  { name: 'My Cats', href: '/portal/cats', icon: TrophyIcon },
  { name: 'Upcoming Shows', href: '/portal/shows', icon: CalendarDaysIcon },
  { name: 'My Entries', href: '/portal/entries', icon: ClipboardDocumentListIcon },
  { name: 'Results', href: '/portal/results', icon: StarIcon },
  { name: 'Profile', href: '/portal/profile', icon: UserCircleIcon },
];

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { portalUser, portalLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    portalLogout();
    navigate('/portal/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <TrophyIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Exhibitor Portal</div>
            <div className="text-xs text-gray-500 truncate max-w-[160px]">{portalUser?.tenant.name}</div>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-0.5">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-gray-100">
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
            Exhibitor Portal — Powered by Daddianza
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-400">
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pr-2 py-1 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {portalUser?.firstName[0]}{portalUser?.lastName[0]}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {portalUser?.firstName} {portalUser?.lastName}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
                  <NavLink to="/portal/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    My Profile
                  </NavLink>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
