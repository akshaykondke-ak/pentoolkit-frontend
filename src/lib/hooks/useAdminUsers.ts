// src/lib/hooks/useAdminUsers.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI, AdminUser } from '@/lib/api/admin';

interface UseAdminUsersReturn {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'user' | 'admin') => Promise<{ success: boolean; error?: string }>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.listUsers();
      setUsers(data);
    } catch (err) {
      const msg = extractMsg(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await adminAPI.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      return { success: true };
    } catch (err) {
      return { success: false, error: extractMsg(err) };
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminAPI.updateStatus(userId, isActive);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: isActive } : u));
      return { success: true };
    } catch (err) {
      return { success: false, error: extractMsg(err) };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      return { success: true };
    } catch (err) {
      return { success: false, error: extractMsg(err) };
    }
  };

  return { users, loading, error, refetch: fetch, updateUserRole, updateUserStatus, deleteUser };
}

function extractMsg(err: unknown): string {
  const e = err as any;
  if (Array.isArray(e?.response?.data?.detail))
    return e.response.data.detail.map((d: any) => d.msg).join(', ');
  if (typeof e?.response?.data?.detail === 'string') return e.response.data.detail;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}