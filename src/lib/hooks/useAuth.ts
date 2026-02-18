'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';

export function useAuth() {
  const router = useRouter();
  const { setUser, logout: logoutStore } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login({ email, password });

      // Store session
      localStorage.setItem('session_id', response.session_id);
      localStorage.setItem('user', JSON.stringify(response.user))

      // Store user in Zustand
      setUser(response.user);

      // Redirect to dashboard
      router.push('/dashboard');

      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('session_id');
      logoutStore();
      router.push('/auth/login');
    }
  };

  return { login, logout, isLoading, error, setError };
}