// src/app/dashboard/admin/page.tsx
'use client';
import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { formatDate } from '@/lib/api/findings';
import { useAdminUsers } from '@/lib/hooks/useAdminUsers';
import type { AdminUser } from '@/lib/api/admin';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed bottom-6 right-6 px-5 py-3 rounded-sm text-xs font-medium z-50 flex items-center gap-2"
      style={{
        ...mono,
        backgroundColor: type === 'success' ? 'var(--accent-dim)' : 'var(--danger-dim)',
        border: `1px solid ${type === 'success' ? 'var(--accent-border)' : 'var(--danger-border)'}`,
        color: type === 'success' ? 'var(--accent)' : 'var(--danger)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {type === 'success' ? '✓' : '✗'} {msg}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  title, message, confirmLabel, danger, loading, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; loading: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-sm"
        style={{
          ...mono,
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${danger ? 'var(--danger-border)' : 'var(--border-default)'}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4"
          style={{ borderBottom: `1px solid ${danger ? 'var(--danger-border)' : 'var(--border-default)'}` }}>
          <p className="text-xs uppercase tracking-widest font-bold"
            style={{ color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>
            {title}
          </p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="px-6 py-4 flex items-center justify-end gap-3"
          style={{ borderTop: '1px solid var(--border-default)' }}>
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-1.5 rounded-sm text-xs disabled:opacity-50"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-bold disabled:opacity-40"
            style={{
              color: danger ? 'var(--danger)' : 'var(--accent)',
              backgroundColor: danger ? 'var(--danger-dim)' : 'var(--accent-dim)',
              border: `1px solid ${danger ? 'var(--danger-border)' : 'var(--accent-border)'}`,
              ...mono,
            }}>
            {loading && (
              <span className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                style={{ borderColor: danger ? 'var(--danger)' : 'var(--accent)', borderTopColor: 'transparent' }} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium capitalize"
      style={{
        color: isAdmin ? 'var(--warn)' : 'var(--text-muted)',
        backgroundColor: isAdmin ? 'var(--warn-dim)' : 'var(--bg-hover)',
        border: `1px solid ${isAdmin ? 'rgba(255,170,0,0.25)' : 'var(--border-default)'}`,
      }}>
      {isAdmin && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--warn)' }} />}
      {role}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium"
      style={{
        color: active ? 'var(--accent)' : 'var(--danger)',
        backgroundColor: active ? 'var(--accent-dim)' : 'var(--danger-dim)',
        border: `1px solid ${active ? 'var(--accent-border)' : 'var(--danger-border)'}`,
      }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: active ? 'var(--accent)' : 'var(--danger)' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Row Actions Dropdown ──────────────────────────────────────────────────────
function UserActionsMenu({
  user, currentUserId, onRoleChange, onStatusToggle, onDelete,
}: {
  user: AdminUser; currentUserId: string;
  onRoleChange: (u: AdminUser) => void;
  onStatusToggle: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSelf = user.id === currentUserId;
  const btnBase: React.CSSProperties = {
    width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12,
    background: 'none', border: 'none', cursor: isSelf ? 'not-allowed' : 'pointer',
    opacity: isSelf ? 0.35 : 1, ...mono,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-3 py-1 rounded-sm text-xs"
        style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)', backgroundColor: 'transparent', ...mono }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        ···
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>

            <button disabled={isSelf} style={{ ...btnBase, color: 'var(--text-secondary)' }}
              onClick={() => { setOpen(false); onRoleChange(user); }}
              onMouseEnter={e => { if (!isSelf) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              {user.role === 'admin' ? '↓ Demote to User' : '↑ Promote to Admin'}
            </button>

            <button disabled={isSelf} style={{ ...btnBase, color: user.is_active ? 'var(--warn)' : 'var(--accent)' }}
              onClick={() => { setOpen(false); onStatusToggle(user); }}
              onMouseEnter={e => { if (!isSelf) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              {user.is_active ? '⊘ Deactivate' : '⊙ Activate'}
            </button>

            <div style={{ height: 1, backgroundColor: 'var(--border-default)' }} />

            <button disabled={isSelf} style={{ ...btnBase, color: 'var(--danger)' }}
              onClick={() => { setOpen(false); onDelete(user); }}
              onMouseEnter={e => { if (!isSelf) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger-dim)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              ✕ Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

export default function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const {
    users, loading, error: fetchError,
    updateUserRole, updateUserStatus, deleteUser,
  } = useAdminUsers();

  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState<'all' | 'admin' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  type ConfirmState = {
    title: string; message: string; confirmLabel: string;
    danger?: boolean; loading: boolean; action: () => Promise<void>;
  };
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirm(c => c ? { ...c, loading: true } : null);
    await confirm.action();
    setConfirm(null);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRoleChange = (u: AdminUser) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setConfirm({
      title: newRole === 'admin' ? 'Promote to Admin' : 'Demote to User',
      message: `Change ${u.full_name}'s role from "${u.role}" to "${newRole}"?`,
      confirmLabel: newRole === 'admin' ? 'Promote' : 'Demote',
      loading: false,
      action: async () => {
        const res = await updateUserRole(u.id, newRole);
        res.success ? showToast(`${u.full_name} is now ${newRole}`) : showToast(res.error ?? 'Failed', 'error');
      },
    });
  };

  const handleStatusToggle = (u: AdminUser) => {
    const next = !u.is_active;
    setConfirm({
      title: next ? 'Activate User' : 'Deactivate User',
      message: `${next ? 'Activate' : 'Deactivate'} account for ${u.full_name}?`,
      confirmLabel: next ? 'Activate' : 'Deactivate',
      danger: !next,
      loading: false,
      action: async () => {
        const res = await updateUserStatus(u.id, next);
        res.success
          ? showToast(`${u.full_name} ${next ? 'activated' : 'deactivated'}`)
          : showToast(res.error ?? 'Failed', 'error');
      },
    });
  };

  const handleDelete = (u: AdminUser) => {
    setConfirm({
      title: 'Delete User',
      message: `Permanently delete ${u.full_name} (${u.email})? All their scans and findings will be deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      loading: false,
      action: async () => {
        const res = await deleteUser(u.id);
        res.success ? showToast(`${u.full_name} deleted`) : showToast(res.error ?? 'Failed', 'error');
      },
    });
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'active'   && u.is_active)
      || (filterStatus === 'inactive' && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin').length,
    active:   users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  const COL = 'minmax(160px,1fr) minmax(180px,1fr) 90px 90px 110px 60px';

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3" style={mono}>
        <div className="w-5 h-5 border border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
        <span className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>Loading users...</span>
      </div>
    );
  }

  // ── Fetch error state ──────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3" style={mono}>
        <p className="text-xs" style={{ color: 'var(--danger)' }}>✗ {fetchError}</p>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Make sure you have admin privileges and the API is reachable.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl" style={mono}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rounded-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--warn)' }} />
        <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: 'var(--warn)' }}>$</span>
              <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>admin --users</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              User Management
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Manage roles, statuses, and accounts across the platform
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {([
              { label: 'Total',    value: stats.total,    color: 'var(--text-secondary)' },
              { label: 'Admins',   value: stats.admins,   color: 'var(--warn)'           },
              { label: 'Active',   value: stats.active,   color: 'var(--accent)'         },
              { label: 'Inactive', value: stats.inactive, color: 'var(--danger)'         },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="text-center px-3 py-2 rounded-sm"
                style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                <div className="text-sm font-bold" style={{ color }}>{value}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 rounded-sm"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>

        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--text-faint)' }}>▸</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 26px', fontSize: 12,
              backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', borderRadius: 2, outline: 'none', ...mono,
            }}
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'admin', 'user'] as const).map(v => (
            <button key={v} onClick={() => setFilterRole(v)}
              className="px-3 py-1.5 rounded-sm text-xs capitalize"
              style={{
                color: filterRole === v ? 'var(--warn)' : 'var(--text-muted)',
                backgroundColor: filterRole === v ? 'var(--warn-dim)' : 'transparent',
                border: `1px solid ${filterRole === v ? 'rgba(255,170,0,0.25)' : 'var(--border-default)'}`,
                ...mono,
              }}>
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'active', 'inactive'] as const).map(v => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className="px-3 py-1.5 rounded-sm text-xs capitalize"
              style={{
                color: filterStatus === v ? (v === 'inactive' ? 'var(--danger)' : 'var(--accent)') : 'var(--text-muted)',
                backgroundColor: filterStatus === v ? (v === 'inactive' ? 'var(--danger-dim)' : 'var(--accent-dim)') : 'transparent',
                border: `1px solid ${filterStatus === v ? (v === 'inactive' ? 'var(--danger-border)' : 'var(--accent-border)') : 'var(--border-default)'}`,
                ...mono,
              }}>
              {v}
            </button>
          ))}
        </div>

        <span className="text-xs ml-auto" style={{ color: 'var(--text-faint)' }}>
          {filtered.length} of {users.length} users
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>

        {/* Column headers */}
        <div className="grid items-center px-5 py-3 text-xs uppercase tracking-widest font-medium"
          style={{
            gridTemplateColumns: COL, gap: 12,
            borderBottom: '1px solid var(--border-default)',
            color: 'var(--text-faint)',
            backgroundColor: 'var(--bg-hover)',
          }}>
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {users.length === 0
                ? 'No users returned — check API connectivity or admin privileges'
                : 'No users match your filters'}
            </p>
          </div>
        ) : (
          filtered.map((u, i) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <div key={u.id}
                className="grid items-center px-5 py-3.5"
                style={{
                  gridTemplateColumns: COL, gap: 12,
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  backgroundColor: isSelf ? 'var(--accent-glow)' : 'transparent',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => { if (!isSelf) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelf ? 'var(--accent-glow)' : 'transparent'; }}
              >
                {/* Name + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: isSelf ? 'var(--accent-dim)' : 'var(--bg-hover)',
                      border: `1px solid ${isSelf ? 'var(--accent-border)' : 'var(--border-default)'}`,
                      color: isSelf ? 'var(--accent)' : 'var(--text-muted)',
                    }}>
                    {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {u.full_name}
                      {isSelf && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-sm"
                          style={{ color: 'var(--accent)', border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-dim)' }}>
                          you
                        </span>
                      )}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {u.is_verified ? '✓ verified' : '⚠ unverified'}
                    </p>
                  </div>
                </div>

                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{u.email}</p>
                <RoleBadge role={u.role} />
                <ActiveBadge active={u.is_active} />
                <p className="text-xs whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                  {formatDate(u.created_at, true)}
                </p>
                <div className="flex justify-end">
                  <UserActionsMenu
                    user={u} currentUserId={currentUser?.id ?? ''}
                    onRoleChange={handleRoleChange}
                    onStatusToggle={handleStatusToggle}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals / Toasts */}
      {confirm && (
        <ConfirmModal
          title={confirm.title} message={confirm.message}
          confirmLabel={confirm.confirmLabel} danger={confirm.danger}
          loading={confirm.loading} onConfirm={runConfirm} onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}