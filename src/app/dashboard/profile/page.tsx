// src/app/dashboard/profile/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { formatDate } from '@/lib/api/findings';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

interface Session {
  session_id: string;
  created_at: string;
  expires_at: string;
}

function extractError(err: unknown): string {
  const e = err as any;
  if (Array.isArray(e?.response?.data?.detail)) {
    return e.response.data.detail.map((d: any) => d.msg).join(', ');
  }
  if (typeof e?.response?.data?.detail === 'string') return e.response.data.detail;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

// ─── Reusable section card ───────────────────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <span className="text-xl">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {type === 'success' ? '✓' : '✗'} {msg}
    </div>
  );
}

export default function ProfilePage() {
  const { setUser } = useAuthStore();

  const [user, setUserLocal] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch user + sessions
  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, sessRes] = await Promise.all([
          apiClient.get('/api/v1/me'),
          apiClient.get('/api/v1/me/sessions'),
        ]);
        setUserLocal(userRes.data);
        setFullName(userRes.data.full_name ?? '');
        setSessions(sessRes.data?.sessions ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Update profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingProfile(true);
    try {
      const res = await apiClient.patch('/api/v1/me', { full_name: fullName.trim() });
      setUserLocal(res.data);
      setUser(res.data); // update Zustand store too
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.post('/api/v1/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully');
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Logout all sessions
  const handleLogoutAll = async () => {
    if (!confirm('This will log you out of all devices. Continue?')) return;
    setLoggingOutAll(true);
    try {
      await apiClient.delete('/api/v1/me/sessions');
      showToast('Logged out from all devices');
      setSessions([]);
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setLoggingOutAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
          {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.is_verified && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                ✓ Verified
              </span>
            )}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <Card title="Account Information" icon="👤">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">User ID</p>
            <p className="font-mono text-gray-700 text-xs">{user?.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Role</p>
            <p className="text-gray-700 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Member Since</p>
            <p className="text-gray-700">{formatDate(user?.created_at, true)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Last Login</p>
            <p className="text-gray-700">{user?.last_login ? formatDate(user.last_login) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Account Status</p>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${user?.is_active ? 'text-green-700' : 'text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email Verified</p>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${user?.is_verified ? 'text-green-700' : 'text-yellow-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-400'}`} />
              {user?.is_verified ? 'Verified' : 'Not verified'}
            </span>
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card title="Edit Profile" icon="✏️">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full px-4 py-2.5 text-sm text-gray-400 border border-gray-100 rounded-xl bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button
            type="submit"
            disabled={savingProfile || !fullName.trim() || fullName === user?.full_name}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingProfile && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Card>

      {/* Change Password */}
      <Card title="Change Password" icon="🔒">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2.5 text-sm text-gray-900 border rounded-xl focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-all ${
                confirmPassword && newPassword !== confirmPassword
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              placeholder="••••••••"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2.5 text-sm font-semibold bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingPassword && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {savingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </Card>

      {/* Active Sessions */}
      <Card title={`Active Sessions (${sessions.length})`} icon="🖥️">
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">No active sessions found</p>
          ) : (
            sessions.map((session, i) => (
              <div key={session.session_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      Session {i + 1}
                    </span>
                    {i === 0 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {session.session_id.slice(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Created: {formatDate(session.created_at)} · Expires: {formatDate(session.expires_at, true)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {sessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loggingOutAll && <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
              {loggingOutAll ? 'Logging out...' : '🚪 Logout All Devices'}
            </button>
            <p className="text-xs text-gray-400 mt-2">This will terminate all active sessions including this one</p>
          </div>
        )}
      </Card>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}