import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'STUDENT' | 'GUIDE' | 'ADMIN';
  bio?: string;
  topics?: string[];
  averageRating?: number;
}

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  mustChangePassword: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  setMustChangePassword: (val: boolean) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      mustChangePassword: false,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user: { ...user, role: user.role.replace('ROLE_', '') as any } }),
      setMustChangePassword: (val) => set({ mustChangePassword: val }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, mustChangePassword: false }),
    }),
    {
      name: 'guide-student-auth',
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        user: state.user,
        mustChangePassword: state.mustChangePassword
      }),
    }
  )
);
