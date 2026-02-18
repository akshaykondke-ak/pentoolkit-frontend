'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  return <>{children}</>;
}