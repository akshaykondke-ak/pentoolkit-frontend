
import { useEffect } from 'react';
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_verified?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  loadUserFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  logout: () => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  loadUserFromStorage: () => {
    try {
      const sessionId = localStorage.getItem('session_id');
      const userStr = localStorage.getItem('user');

      if (sessionId && userStr) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      set({ isLoading: false });
    }
  },
}));