// src/app/dashboard/profile/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { formatDate } from '@/lib/api/findings';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

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
  if (Array.isArray(e?.response?.data?.detail))
    return e.response.data.detail.map((d: any) => d.msg).join(', ');
  if (typeof e?.response?.data?.detail === 'string') return e.response.data.detail;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

function calcStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (pw.length >= 12)         s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH = [
  { label: 'Weak',   color: 'var(--danger)'          },
  { label: 'Fair',   color: 'var(--severity-high)'   },
  { label: 'Good',   color: 'var(--severity-medium)' },
  { label: 'Strong', color: 'var(--accent)'          },
];

// ── Field wrapper ───────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  error,
  action,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          className="text-xs uppercase tracking-widest font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && !error && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
          ✗ {error}
        </p>
      )}
    </div>
  );
}

// ── Terminal-style text input ───────────────────────────────────────────────
function TermInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
) {
  const [focused, setFocused] = React.useState(false);
  const { hasError, ...rest } = props;
  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none"
        style={{ color: focused ? 'var(--accent)' : 'var(--text-faint)' }}
      >▸</span>
      <input
        {...rest}
        style={{
          width: '100%',
          padding: '9px 12px 9px 28px',
          fontSize: '12px',
          backgroundColor: props.disabled ? 'transparent' : 'var(--bg-hover)',
          border: `1px solid ${hasError ? 'var(--danger-border)' : focused ? 'var(--accent-border)' : 'var(--border-default)'}`,
          color: props.disabled ? 'var(--text-faint)' : 'var(--text-primary)',
          borderRadius: '2px',
          outline: 'none',
          cursor: props.disabled ? 'not-allowed' : 'text',
          opacity: props.disabled ? 0.55 : 1,
          transition: 'border-color 0.15s',
          ...mono,
        }}
        onFocus={e  => { setFocused(true);  props.onFocus?.(e); }}
        onBlur={e   => { setFocused(false); props.onBlur?.(e);  }}
      />
    </div>
  );
}

// ── Card section ────────────────────────────────────────────────────────────
function Card({
  title,
  subtitle,
  accent = false,
  danger = false,
  children,
}: {
  title: string;
  subtitle: string;
  accent?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const borderColor = danger ? 'var(--danger-border)' : accent ? 'var(--accent-border)' : 'var(--border-default)';
  const titleColor  = danger ? 'var(--danger)' : accent ? 'var(--accent)' : 'var(--text-primary)';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: '2px',
      }}
    >
      <div
        className="px-6 py-4"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <h3 className="text-sm font-bold" style={{ color: titleColor }}>{title}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{subtitle}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Primary action button ───────────────────────────────────────────────────
function ActionBtn({
  loading,
  disabled,
  label,
  loadingLabel,
  variant = 'accent',
  onClick,
  type = 'submit',
}: {
  loading: boolean;
  disabled: boolean;
  label: string;
  loadingLabel: string;
  variant?: 'accent' | 'neutral' | 'danger';
  onClick?: () => void;
  type?: 'submit' | 'button';
}) {
  const colors = {
    accent:  { color: 'var(--accent)',      bg: 'var(--accent-dim)',  border: 'var(--accent-border)'  },
    neutral: { color: 'var(--text-primary)', bg: 'var(--bg-hover)',   border: 'var(--border-strong)'  },
    danger:  { color: 'var(--danger)',       bg: 'var(--danger-dim)', border: 'var(--danger-border)'  },
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-sm tracking-widest uppercase transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
      style={{ color: colors.color, backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
    >
      {loading && (
        <span
          className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
          style={{ borderColor: colors.color, borderTopColor: 'transparent' }}
        />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── Stat chip ───────────────────────────────────────────────────────────────
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const { setUser } = useAuthStore();

  const [user, setUserLocal]         = useState<User | null>(null);
  const [sessions, setSessions]      = useState<Session[]>([]);
  const [loading, setLoading]        = useState(true);
  const [toast, setToast]            = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [fullName, setFullName]           = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw]  = useState('');
  const [newPw, setNewPw]          = useState('');
  const [confirmPw, setConfirmPw]  = useState('');
  const [showPw, setShowPw]        = useState(false);
  const [savingPw, setSavingPw]    = useState(false);

  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const [u, s] = await Promise.all([
          apiClient.get('/api/v1/me'),
          apiClient.get('/api/v1/me/sessions'),
        ]);
        setUserLocal(u.data);
        setFullName(u.data.full_name ?? '');
        setSessions(s.data?.sessions ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingProfile(true);
    try {
      const res = await apiClient.patch('/api/v1/me', { full_name: fullName.trim() });
      setUserLocal(res.data);
      setUser(res.data);
      showToast('Profile updated successfully');
    } catch (err) { showToast(extractError(err), 'error'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    if (newPw.length < 8)   { showToast('Min 8 characters required', 'error'); return; }
    setSavingPw(true);
    try {
      await apiClient.post('/api/v1/me/change-password', {
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password changed successfully');
    } catch (err) { showToast(extractError(err), 'error'); }
    finally { setSavingPw(false); }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Log out from all devices?')) return;
    setLoggingOutAll(true);
    try {
      await apiClient.delete('/api/v1/me/sessions');
      setSessions([]);
      showToast('Logged out from all devices');
    } catch (err) { showToast(extractError(err), 'error'); }
    finally { setLoggingOutAll(false); }
  };

  const strength   = calcStrength(newPw);
  const sc         = STRENGTH[Math.min(Math.floor((strength / 5) * 4), 3)];
  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw;
  const initials   = user?.full_name?.charAt(0)?.toUpperCase() ?? 'U';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3" style={mono}>
        <div
          className="w-5 h-5 border border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}
        />
        <span className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 " style={mono}>

      {/* ══ HERO BANNER ═══════════════════════════════════════════════════ */}
      <div
        className="rounded-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Accent top bar */}
        <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--accent)' }} />

        <div className="p-6 flex items-start gap-6">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-sm flex items-center justify-center text-3xl font-black flex-shrink-0 select-none"
            style={{
              backgroundColor: 'var(--accent-dim)',
              border: '2px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
          >
            {initials}
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name}
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {user?.email}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {user?.is_verified && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold"
                    style={{
                      color: 'var(--accent)',
                      backgroundColor: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    Verified
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs capitalize"
                  style={{
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {user?.role}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium"
                  style={{
                    color:           user?.is_active ? 'var(--accent)' : 'var(--danger)',
                    backgroundColor: user?.is_active ? 'var(--accent-dim)' : 'var(--danger-dim)',
                    border:          `1px solid ${user?.is_active ? 'var(--accent-border)' : 'var(--danger-border)'}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: user?.is_active ? 'var(--accent)' : 'var(--danger)' }}
                  />
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Meta stats row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mt-4 pt-4"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              <StatChip label="Member Since" value={formatDate(user?.created_at, true)} />
              <StatChip label="Last Login"   value={user?.last_login ? formatDate(user.last_login) : 'Never'} />
              <StatChip label="User ID"      value={`…${user?.id?.slice(-12)}`} />
              <StatChip
                label="Email Status"
                value={user?.is_verified ? 'Verified ✓' : 'Unverified'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ TWO-COLUMN CONTENT ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT ── */}
        <div className="space-y-5">

          {/* Edit Profile */}
          <Card title="Edit Profile" subtitle="Update your display name">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Field label="Full Name">
                <TermInput
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </Field>
              <Field label="Email Address" hint="Email address cannot be changed">
                <TermInput
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                />
              </Field>
              <ActionBtn
                loading={savingProfile}
                disabled={!fullName.trim() || fullName === user?.full_name}
                label="Save Changes"
                loadingLabel="Saving..."
                variant="accent"
              />
            </form>
          </Card>

          {/* Account Details */}
          <Card title="Account Details" subtitle="Read-only account metadata">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                { label: 'Role',         value: user?.role, capitalize: true },
                { label: 'Full User ID', value: user?.id,  truncate: true   },
              ].map(({ label, value, capitalize, truncate }) => (
                <div key={label} className={truncate ? 'col-span-2' : ''}>
                  <p
                    className="text-xs uppercase tracking-widest mb-1.5 font-medium"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    {label}
                  </p>
                  <p
                    className={`text-xs ${truncate ? 'truncate' : ''} ${capitalize ? 'capitalize' : ''}`}
                    style={{ color: 'var(--text-secondary)' }}
                    title={truncate ? value : undefined}
                  >
                    {value}
                  </p>
                </div>
              ))}

              {/* Account Status */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-1.5 font-medium" style={{ color: 'var(--text-faint)' }}>
                  Account
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: user?.is_active ? 'var(--accent)' : 'var(--danger)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user?.is_active ? 'var(--accent)' : 'var(--danger)' }} />
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Email verified */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-1.5 font-medium" style={{ color: 'var(--text-faint)' }}>
                  Email
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: user?.is_verified ? 'var(--accent)' : 'var(--warn)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user?.is_verified ? 'var(--accent)' : 'var(--warn)' }} />
                  {user?.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-5">

          {/* Change Password */}
          <Card title="Change Password" subtitle="Use a strong, unique password">
            <form onSubmit={handleChangePw} className="space-y-4">

              <Field label="Current Password">
                <TermInput
                  type={showPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              <Field
                label="New Password"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--text-faint)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
                  >
                    {showPw ? '⊘ Hide' : '⊙ Show'}
                  </button>
                }
              >
                <TermInput
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Min 8 characters"
                />
                {/* Strength bar */}
                {newPw && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="h-0.5 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: i < Math.ceil((strength / 5) * 4)
                              ? sc.color
                              : 'var(--border-default)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs w-10 text-right" style={{ color: sc.color }}>{sc.label}</span>
                  </div>
                )}
              </Field>

              <Field
                label="Confirm Password"
                error={pwMismatch ? 'Passwords do not match' : undefined}
              >
                <TermInput
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  hasError={pwMismatch}
                />
              </Field>

              <ActionBtn
                loading={savingPw}
                disabled={!currentPw || !newPw || !confirmPw || !!pwMismatch}
                label="Change Password"
                loadingLabel="Changing..."
                variant="neutral"
              />
            </form>
          </Card>

          {/* Active Sessions */}
          <Card title="Active Sessions" subtitle={`${sessions.length} device${sessions.length !== 1 ? 's' : ''} currently signed in`}>
            {sessions.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No active sessions found</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session, i) => (
                  <div
                    key={session.session_id}
                    className="p-3 rounded-sm flex items-start justify-between gap-3"
                    style={{
                      backgroundColor: i === 0 ? 'var(--accent-dim)' : 'var(--bg-hover)',
                      border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-bold"
                          style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)' }}
                        >
                          Session {i + 1}
                        </span>
                        {i === 0 && (
                          <span
                            className="px-1.5 py-0.5 text-xs rounded-sm"
                            style={{ color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                        {session.session_id.slice(0, 26)}…
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        Expires {formatDate(session.expires_at, true)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sessions.length > 0 && (
              <div
                className="mt-4 pt-4 flex items-center justify-between gap-3"
                style={{ borderTop: '1px solid var(--border-default)' }}
              >
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                  Terminates all sessions including this one
                </p>
                <ActionBtn
                  type="button"
                  loading={loggingOutAll}
                  disabled={false}
                  label="Logout All"
                  loadingLabel="Logging out..."
                  variant="danger"
                  onClick={handleLogoutAll}
                />
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-5 py-3 rounded-sm text-xs font-medium z-50 flex items-center gap-2"
          style={{
            ...mono,
            backgroundColor: toast.type === 'success' ? 'var(--accent-dim)' : 'var(--danger-dim)',
            border:          `1px solid ${toast.type === 'success' ? 'var(--accent-border)' : 'var(--danger-border)'}`,
            color:           toast.type === 'success' ? 'var(--accent)' : 'var(--danger)',
            boxShadow:       '0 8px 32px rgba(0,0,0,0.35)',
          }}
        >
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
}