// src/lib/api/admin.ts
import apiClient from '@/lib/api/client';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

function extractError(err: unknown): string {
  const e = err as any;
  if (Array.isArray(e?.response?.data?.detail))
    return e.response.data.detail.map((d: any) => d.msg).join(', ');
  if (typeof e?.response?.data?.detail === 'string') return e.response.data.detail;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

/**
 * Normalise whatever shape the server returns into AdminUser[].
 * Handles:
 *   - plain array:          [{ id, email, … }, …]
 *   - { users: […] }
 *   - { data: […] }
 *   - { items: […] }
 *   - single object (edge)
 */
function normaliseUsers(data: unknown): AdminUser[] {
  if (Array.isArray(data)) return data as AdminUser[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['users', 'data', 'items', 'results']) {
      if (Array.isArray(obj[key])) return obj[key] as AdminUser[];
    }
  }
  return [];
}

export const adminAPI = {
  /** List all users – fetches up to 100 at once (extend with pagination if needed) */
  async listUsers(skip = 0, limit = 100): Promise<AdminUser[]> {
    const res = await apiClient.get('/api/v1/admin/users', {
      params: { skip, limit },
    });
    return normaliseUsers(res.data);
  },

  /** Promote or demote a user's role */
  async updateRole(userId: string, newRole: 'user' | 'admin'): Promise<AdminUser> {
    const res = await apiClient.patch(
      `/api/v1/admin/users/${userId}/role`,
      null,                          // no body – role goes in query param
      { params: { new_role: newRole } },
    );
    return res.data as AdminUser;
  },

  /** Activate or deactivate an account */
  async updateStatus(userId: string, isActive: boolean): Promise<AdminUser> {
    const res = await apiClient.patch(
      `/api/v1/admin/users/${userId}/status`,
      null,                          // no body – flag goes in query param
      { params: { is_active: isActive } },
    );
    return res.data as AdminUser;
  },

  /** Permanently delete a user (CASCADE deletes scans + findings) */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/users/${userId}`);
  },
};

export { extractError };