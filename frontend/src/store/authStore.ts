import { create } from 'zustand';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  tenant: Tenant;
}

interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  contact?: { id: string; firstName: string; lastName: string } | null;
  tenant: { id: string; name: string; slug: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  portalUser: PortalUser | null;
  portalToken: string | null;
  isAuthenticated: boolean;
  isPortalAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  portalLogin: (user: PortalUser, token: string) => void;
  portalLogout: () => void;
}

const storedUser = localStorage.getItem('crm_user');
const storedToken = localStorage.getItem('crm_token');
const storedPortalUser = localStorage.getItem('portal_user');
const storedPortalToken = localStorage.getItem('portal_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  portalUser: storedPortalUser ? JSON.parse(storedPortalUser) : null,
  portalToken: storedPortalToken || null,
  isAuthenticated: !!storedToken && !!storedUser,
  isPortalAuthenticated: !!storedPortalToken && !!storedPortalUser,

  login: (user, token) => {
    localStorage.setItem('crm_user', JSON.stringify(user));
    localStorage.setItem('crm_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  portalLogin: (user, token) => {
    localStorage.setItem('portal_user', JSON.stringify(user));
    localStorage.setItem('portal_token', token);
    set({ portalUser: user, portalToken: token, isPortalAuthenticated: true });
  },

  portalLogout: () => {
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_token');
    set({ portalUser: null, portalToken: null, isPortalAuthenticated: false });
  },
}));
