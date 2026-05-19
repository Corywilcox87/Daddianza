import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import PortalLoginPage from '@/pages/auth/PortalLoginPage';

// Admin CRM layout & pages
import CRMLayout from '@/components/common/CRMLayout';
import Dashboard from '@/pages/admin/Dashboard';
import AccountsPage from '@/pages/admin/AccountsPage';
import AccountDetailPage from '@/pages/admin/AccountDetailPage';
import ContactsPage from '@/pages/admin/ContactsPage';
import ContactDetailPage from '@/pages/admin/ContactDetailPage';
import CatsPage from '@/pages/admin/CatsPage';
import CatDetailPage from '@/pages/admin/CatDetailPage';
import ShowsPage from '@/pages/admin/ShowsPage';
import ShowDetailPage from '@/pages/admin/ShowDetailPage';
import LeadsPage from '@/pages/admin/LeadsPage';
import OpportunitiesPage from '@/pages/admin/OpportunitiesPage';
import UsersPage from '@/pages/admin/UsersPage';
import BillingPage from '@/pages/admin/BillingPage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Portal layout & pages
import PortalLayout from '@/components/common/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';
import PortalCatsPage from '@/pages/portal/PortalCatsPage';
import PortalShowsPage from '@/pages/portal/PortalShowsPage';
import PortalEntriesPage from '@/pages/portal/PortalEntriesPage';
import PortalResultsPage from '@/pages/portal/PortalResultsPage';
import PortalProfilePage from '@/pages/portal/PortalProfilePage';

// Public landing
import LandingPage from '@/pages/LandingPage';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const RequirePortalAuth = ({ children }: { children: React.ReactNode }) => {
  const { isPortalAuthenticated } = useAuthStore();
  return isPortalAuthenticated ? <>{children}</> : <Navigate to="/portal/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/portal/login" element={<PortalLoginPage />} />

        {/* CRM Admin */}
        <Route path="/crm" element={<RequireAuth><CRMLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/crm/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:id" element={<AccountDetailPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="cats" element={<CatsPage />} />
          <Route path="cats/:id" element={<CatDetailPage />} />
          <Route path="shows" element={<ShowsPage />} />
          <Route path="shows/:id" element={<ShowDetailPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Client Portal */}
        <Route path="/portal" element={<RequirePortalAuth><PortalLayout /></RequirePortalAuth>}>
          <Route index element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="cats" element={<PortalCatsPage />} />
          <Route path="shows" element={<PortalShowsPage />} />
          <Route path="entries" element={<PortalEntriesPage />} />
          <Route path="results" element={<PortalResultsPage />} />
          <Route path="profile" element={<PortalProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
