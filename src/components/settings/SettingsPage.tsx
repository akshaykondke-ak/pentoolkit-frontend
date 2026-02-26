"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "@/lib/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  role: string;
  created_at: string;
  last_login: string | null;
}

interface SessionInfo {
  session_id: string;
  created_at: string;
  expires_at: string;
}

interface NotificationPrefs {
  manual_complete:    boolean;
  manual_failed:      boolean;
  scheduled_complete: boolean;
  scheduled_failed:   boolean;
  min_severity: "critical" | "high" | "medium" | "low" | null;
}

interface PrefsResponse {
  user_id:       string;
  notifications: NotificationPrefs;
  updated_at:    string | null;
}

type Section = "notifications" | "profile" | "security";

const SEVERITY_OPTIONS = [
  { value: null,       label: "All findings",   color: "var(--text-muted)" },
  { value: "low",      label: "Low +",           color: "var(--severity-low)" },
  { value: "medium",   label: "Medium +",        color: "var(--severity-medium)" },
  { value: "high",     label: "High +",          color: "var(--severity-high)" },
  { value: "critical", label: "Critical only",   color: "var(--severity-critical)" },
] as const;

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Bell: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Warn: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Eye: ({ visible }: { visible: boolean }) => visible ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Key: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
    </svg>
  ),
  Logout: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled = false }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative", width: "38px", height: "21px",
        borderRadius: "11px", border: "1px solid",
        borderColor: checked ? "var(--accent)" : "var(--border-default)",
        background: checked ? "var(--accent)" : "var(--bg-hover)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.16s ease",
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0, padding: 0, outline: "none",
      }}
    >
      <span style={{
        position: "absolute", top: "2px",
        left: checked ? "18px" : "2px",
        width: "15px", height: "15px", borderRadius: "50%",
        background: checked ? "#0a1a0f" : "var(--text-muted)",
        transition: "left 0.16s ease",
      }} />
    </button>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      display: "flex", alignItems: "center", gap: "8px",
      padding: "10px 15px", borderRadius: "7px", border: "1px solid",
      borderColor: type === "success" ? "var(--accent-border)" : "var(--danger-border)",
      background: "var(--bg-card)",
      color: type === "success" ? "var(--accent)" : "var(--danger)",
      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
      fontSize: "12px", zIndex: 9999,
      boxShadow: "var(--card-shadow)",
      animation: "toastIn 0.18s ease",
    }}>
      {type === "success" ? <Icons.Check /> : <Icons.Warn />}
      {message}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ w = "100%", h = "13px" }: { w?: string; h?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: "4px",
      background: "var(--bg-hover)",
      animation: "skelPulse 1.5s ease-in-out infinite",
    }} />
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ label, icon, active, onClick }: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 10px", borderRadius: "6px",
        border: "1px solid",
        borderColor: active ? "var(--accent-border)" : "transparent",
        background: active ? "var(--accent-dim)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        fontFamily: "var(--font-mono, monospace)", fontSize: "12px",
        fontWeight: active ? 600 : 400,
        cursor: "pointer", width: "100%", textAlign: "left",
        transition: "all 0.14s ease",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
        }
      }}
    >
      <span style={{ color: active ? "var(--accent)" : "var(--text-muted)", display: "flex" }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ title, subtitle, icon, children, action }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-default)",
      borderRadius: "9px", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-hover)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "var(--bg-card)", color: "var(--accent)",
          }}>
            {icon}
          </span>
          <div>
            <div style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: "12px",
              fontWeight: 600, color: "var(--text-primary)",
            }}>{title}</div>
            <div style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
              color: "var(--text-muted)", marginTop: "1px",
            }}>{subtitle}</div>
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: "0 18px" }}>{children}</div>
    </div>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

function Row({ label, sub, control, last = false }: {
  label: string;
  sub: string;
  control: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "16px", padding: "15px 0",
      borderBottom: last ? "none" : "1px solid var(--border-subtle)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-mono, monospace)", fontSize: "12px",
          color: "var(--text-primary)", fontWeight: 500, marginBottom: "2px",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-mono, monospace)", fontSize: "11px",
          color: "var(--text-muted)", lineHeight: 1.5,
        }}>{sub}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Input({ value, onChange, type = "text", placeholder, disabled, suffix }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: suffix ? "9px 38px 9px 12px" : "9px 12px",
          background: "var(--bg-hover)", border: "1px solid var(--border-default)",
          borderRadius: "6px", outline: "none",
          fontFamily: "var(--font-mono, monospace)", fontSize: "12px",
          color: "var(--text-primary)",
          transition: "border-color 0.15s ease",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--accent-border)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
      />
      {suffix && (
        <div style={{
          position: "absolute", right: "10px", top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)", cursor: "pointer",
        }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

function Btn({ children, onClick, variant = "default", disabled, size = "md" }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "accent" | "danger" | "ghost";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--bg-hover)", border: "1px solid var(--border-default)",
      color: "var(--text-secondary)",
    },
    accent: {
      background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
      color: "var(--accent)",
    },
    danger: {
      background: "var(--danger-dim)", border: "1px solid var(--danger-border)",
      color: "var(--danger)",
    },
    ghost: {
      background: "transparent", border: "1px solid transparent",
      color: "var(--text-muted)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        fontFamily: "var(--font-mono, monospace)",
        fontSize: size === "sm" ? "11px" : "12px",
        padding: size === "sm" ? "5px 10px" : "8px 14px",
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.14s ease",
        display: "inline-flex", alignItems: "center", gap: "6px",
        flexShrink: 0, fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

// ─── Severity picker ──────────────────────────────────────────────────────────

function SeverityPicker({ value, onChange }: {
  value: NotificationPrefs["min_severity"];
  onChange: (v: NotificationPrefs["min_severity"]) => void;
}) {
  return (
    <div style={{ padding: "15px 0 6px" }}>
      <div style={{
        fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
        color: "var(--text-muted)", marginBottom: "9px",
        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        Minimum severity to notify
      </div>
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {SEVERITY_OPTIONS.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "11px",
                padding: "5px 10px", borderRadius: "5px", cursor: "pointer",
                border: "1px solid",
                borderColor: active ? opt.color : "var(--border-default)",
                background: active
                  ? `color-mix(in srgb, ${opt.color} 12%, transparent)`
                  : "var(--bg-hover)",
                color: active ? opt.color : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
                transition: "all 0.14s ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div style={{
        fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
        color: "var(--text-faint)", marginTop: "7px",
      }}>
        {value === null
          ? "Notifying on all completed scans regardless of findings."
          : `Only notifying when ${value} or higher severity findings are found.`}
      </div>
    </div>
  );
}

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection({ prefs, loading, saving, profile, onToggle, onSeverity, onReset }: {
  prefs: NotificationPrefs | null;
  loading: boolean;
  saving: boolean;
  profile: UserProfile | null;
  onToggle: (key: keyof Omit<NotificationPrefs, "min_severity">, val: boolean) => void;
  onSeverity: (val: NotificationPrefs["min_severity"]) => void;
  onReset: () => void;
}) {
  const skelRows = (n: number) => Array.from({ length: n }).map((_, i) => (
    <div key={i} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "15px 0",
      borderBottom: i < n - 1 ? "1px solid var(--border-subtle)" : "none",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <Skel w="130px" />
        <Skel w="200px" h="10px" />
      </div>
      <Skel w="38px" h="21px" />
    </div>
  ));

  return (
    <>
      {/* Unverified warning */}
      {!loading && profile && !profile.is_verified && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "9px",
          padding: "11px 13px", borderRadius: "7px",
          border: "1px solid var(--warn)", background: "var(--warn-dim)",
        }}>
          <span style={{ color: "var(--warn)", display: "flex", marginTop: "1px" }}>
            <Icons.Warn />
          </span>
          <p style={{
            fontFamily: "var(--font-mono, monospace)", margin: 0,
            fontSize: "11px", color: "var(--warn)", lineHeight: 1.5,
          }}>
            Email not verified — notifications won't send until you verify your address.
          </p>
        </div>
      )}

      {/* Manual scans */}
      <Card icon={<Icons.Bell />} title="Manual Scans" subtitle="Scans you trigger directly from the dashboard.">
        {loading ? skelRows(2) : (
          <>
            <Row
              label="Scan complete"
              sub="Email when a manually triggered scan finishes successfully."
              control={
                <Toggle
                  checked={prefs?.manual_complete ?? true}
                  onChange={v => onToggle("manual_complete", v)}
                  disabled={saving}
                />
              }
            />
            <Row
              label="Scan failed"
              sub="Email when a manually triggered scan encounters an error."
              control={
                <Toggle
                  checked={prefs?.manual_failed ?? true}
                  onChange={v => onToggle("manual_failed", v)}
                  disabled={saving}
                />
              }
              last
            />
          </>
        )}
      </Card>

      {/* Scheduled scans */}
      <Card icon={<Icons.Bell />} title="Scheduled Scans" subtitle="Automated scans running on a cron schedule.">
        {loading ? skelRows(2) : (
          <>
            <Row
              label="Scan complete"
              sub="Email when a scheduled scan finishes. Also requires the per-schedule notify flag."
              control={
                <Toggle
                  checked={prefs?.scheduled_complete ?? true}
                  onChange={v => onToggle("scheduled_complete", v)}
                  disabled={saving}
                />
              }
            />
            <Row
              label="Scan failed"
              sub="Email when a scheduled scan fails. Also requires the per-schedule notify flag."
              control={
                <Toggle
                  checked={prefs?.scheduled_failed ?? true}
                  onChange={v => onToggle("scheduled_failed", v)}
                  disabled={saving}
                />
              }
              last
            />
          </>
        )}
      </Card>

      {/* Severity filter */}
      <Card icon={<Icons.Bell />} title="Severity Filter" subtitle="Only notify when findings meet your threshold.">
        <div style={{ paddingBottom: "15px" }}>
          {loading ? (
            <div style={{ padding: "15px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skel w="150px" h="10px" />
              <div style={{ display: "flex", gap: "5px" }}>
                {[80, 55, 68, 55, 86].map((w, i) => <Skel key={i} w={`${w}px`} h="27px" />)}
              </div>
            </div>
          ) : (
            <SeverityPicker value={prefs?.min_severity ?? null} onChange={onSeverity} />
          )}
        </div>
      </Card>

      {/* Reset */}
      {!loading && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn onClick={onReset} disabled={saving} variant="ghost" size="sm">
            Reset to defaults
          </Btn>
        </div>
      )}
    </>
  );
}

// ─── Profile section ──────────────────────────────────────────────────────────

function ProfileSection({ profile, loading, onToast }: {
  profile: UserProfile | null;
  loading: boolean;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (profile) setName(profile.full_name || "");
  }, [profile]);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiClient.patch("/api/v1/auth/me", { full_name: name.trim() });
      onToast("Name updated", "success");
      setEditing(false);
    } catch {
      onToast("Failed to update name", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(profile?.full_name || "");
    setEditing(false);
  };

  if (loading) {
    return (
      <Card icon={<Icons.User />} title="Profile" subtitle="Your account information.">
        <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <Skel w="64px" h="10px" />
              <Skel w="160px" h="11px" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <Card
      icon={<Icons.User />}
      title="Profile"
      subtitle="Your account information."
      action={
        !editing ? (
          <Btn onClick={() => setEditing(true)} variant="ghost" size="sm">
            <Icons.Edit /> Edit
          </Btn>
        ) : undefined
      }
    >
      <div style={{ padding: "6px 0" }}>

        {/* Name row — editable */}
        <div style={{
          display: "flex", gap: "14px", alignItems: editing ? "flex-start" : "baseline",
          padding: "13px 0", borderBottom: "1px solid var(--border-subtle)",
        }}>
          <span style={{
            fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
            color: "var(--text-muted)", width: "70px", flexShrink: 0,
            textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: editing ? "9px" : 0,
          }}>Name</span>
          {editing ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <Input
                value={name}
                onChange={setName}
                placeholder="Your name"
                disabled={saving}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <Btn onClick={saveName} variant="accent" size="sm" disabled={saving || !name.trim()}>
                  {saving ? "Saving…" : "Save"}
                </Btn>
                <Btn onClick={cancelEdit} variant="ghost" size="sm" disabled={saving}>
                  Cancel
                </Btn>
              </div>
            </div>
          ) : (
            <span style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: "12px",
              color: "var(--text-primary)",
            }}>
              {profile.full_name || "—"}
            </span>
          )}
        </div>

        {/* Static fields */}
        {[
          { label: "Email",   value: profile.email },
          { label: "Role",    value: profile.role },
          {
            label: "Status",
            value: profile.is_verified ? "Verified ✓" : "Unverified",
            warn: !profile.is_verified,
          },
          { label: "Joined",     value: fmtDate(profile.created_at) },
          {
            label: "Last login",
            value: profile.last_login ? fmtDateTime(profile.last_login) : "—",
          },
        ].map(({ label, value, warn }, i, arr) => (
          <div key={label} style={{
            display: "flex", gap: "14px", alignItems: "baseline",
            padding: "13px 0",
            borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}>
            <span style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
              color: "var(--text-muted)", width: "70px", flexShrink: 0,
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {label}
            </span>
            <span style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: "12px",
              color: warn ? "var(--warn)" : "var(--text-primary)",
            }}>
              {value}
            </span>
          </div>
        ))}

      </div>
    </Card>
  );
}

// ─── Security section ─────────────────────────────────────────────────────────

function SecuritySection({ onToast }: {
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  // ── Change password state ──────────────────────────────────────────────────
  const [pwOpen,   setPwOpen]   = useState(false);
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState<string | null>(null);

  // ── Sessions state ─────────────────────────────────────────────────────────
  const [sessions,  setSessions]  = useState<SessionInfo[]>([]);
  const [sessLoad,  setSessLoad]  = useState(true);
  const [sessError, setSessError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    apiClient.get<{ total: number; sessions: SessionInfo[] }>("/api/v1/auth/me/sessions")
      .then(r => setSessions(r.data.sessions ?? []))
      .catch(() => setSessError("Could not load sessions."))
      .finally(() => setSessLoad(false));
  }, []);

  const changePassword = async () => {
    setPwError(null);
    if (!current || !next || !confirm) {
      setPwError("All fields are required."); return;
    }
    if (next.length < 8) {
      setPwError("New password must be at least 8 characters."); return;
    }
    if (next !== confirm) {
      setPwError("Passwords do not match."); return;
    }
    setPwSaving(true);
    try {
      await apiClient.post("/api/v1/auth/me/change-password", {
        current_password: current,
        new_password: next,
      });
      onToast("Password changed", "success");
      setCurrent(""); setNext(""); setConfirm("");
      setPwOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Failed to change password.";
      setPwError(typeof msg === "string" ? msg : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const logoutAll = async () => {
    setLoggingOut(true);
    try {
      await apiClient.delete("/api/v1/auth/me/sessions");
      onToast("All sessions terminated", "success");
      setSessions([]);
    } catch {
      onToast("Failed to logout all sessions", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Change password */}
      <Card
        icon={<Icons.Key />}
        title="Change Password"
        subtitle="Update your account password."
        action={
          !pwOpen ? (
            <Btn onClick={() => setPwOpen(true)} variant="ghost" size="sm">
              <Icons.Edit /> Change
            </Btn>
          ) : undefined
        }
      >
        {pwOpen ? (
          <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Current password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
                color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                Current password
              </label>
              <Input
                value={current}
                onChange={setCurrent}
                type={showCurr ? "text" : "password"}
                placeholder="Enter current password"
                disabled={pwSaving}
                suffix={
                  <span onClick={() => setShowCurr(v => !v)}>
                    <Icons.Eye visible={showCurr} />
                  </span>
                }
              />
            </div>

            {/* New password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
                color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                New password
              </label>
              <Input
                value={next}
                onChange={setNext}
                type={showNext ? "text" : "password"}
                placeholder="Minimum 8 characters"
                disabled={pwSaving}
                suffix={
                  <span onClick={() => setShowNext(v => !v)}>
                    <Icons.Eye visible={showNext} />
                  </span>
                }
              />
            </div>

            {/* Confirm */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
                color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                Confirm new password
              </label>
              <Input
                value={confirm}
                onChange={setConfirm}
                type="password"
                placeholder="Repeat new password"
                disabled={pwSaving}
              />
            </div>

            {/* Match indicator */}
            {next && confirm && (
              <div style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "11px",
                color: next === confirm ? "var(--accent)" : "var(--danger)",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                {next === confirm ? <Icons.Check /> : <Icons.Warn />}
                {next === confirm ? "Passwords match" : "Passwords do not match"}
              </div>
            )}

            {/* Error */}
            {pwError && (
              <div style={{
                fontFamily: "var(--font-mono, monospace)", fontSize: "11px",
                color: "var(--danger)", display: "flex", alignItems: "center", gap: "5px",
              }}>
                <Icons.Warn /> {pwError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "7px", paddingTop: "4px" }}>
              <Btn
                onClick={changePassword}
                variant="accent"
                disabled={pwSaving || !current || !next || !confirm}
              >
                {pwSaving ? "Saving…" : "Update password"}
              </Btn>
              <Btn onClick={() => {
                setPwOpen(false);
                setCurrent(""); setNext(""); setConfirm(""); setPwError(null);
              }} variant="ghost" disabled={pwSaving}>
                Cancel
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ padding: "14px 0" }}>
            <p style={{
              fontFamily: "var(--font-mono, monospace)", margin: 0,
              fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6,
            }}>
              Your password was last changed when you registered. Use a strong, unique password.
            </p>
          </div>
        )}
      </Card>

      {/* Active sessions */}
      <Card
        icon={<Icons.Shield />}
        title="Active Sessions"
        subtitle="Devices currently logged into your account."
        action={
          sessions.length > 0 ? (
            <Btn onClick={logoutAll} variant="danger" size="sm" disabled={loggingOut}>
              <Icons.Logout />
              {loggingOut ? "Logging out…" : "Logout all"}
            </Btn>
          ) : undefined
        }
      >
        <div style={{ padding: "6px 0 14px" }}>
          {sessLoad ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
              {[1, 2].map(i => (
                <div key={i} style={{
                  padding: "12px", borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-hover)",
                  display: "flex", flexDirection: "column", gap: "6px",
                }}>
                  <Skel w="140px" h="11px" />
                  <Skel w="100px" h="10px" />
                </div>
              ))}
            </div>
          ) : sessError ? (
            <p style={{
              fontFamily: "var(--font-mono, monospace)", margin: "12px 0",
              fontSize: "11px", color: "var(--danger)",
            }}>
              {sessError}
            </p>
          ) : sessions.length === 0 ? (
            <p style={{
              fontFamily: "var(--font-mono, monospace)", margin: "12px 0",
              fontSize: "11px", color: "var(--text-muted)",
            }}>
              No active sessions found.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              {sessions.map((s, i) => (
                <div key={s.session_id} style={{
                  padding: "11px 13px", borderRadius: "6px",
                  border: i === 0
                    ? "1px solid var(--accent-border)"
                    : "1px solid var(--border-subtle)",
                  background: i === 0 ? "var(--accent-dim)" : "var(--bg-hover)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      fontFamily: "var(--font-mono, monospace)", fontSize: "11px",
                      color: i === 0 ? "var(--accent)" : "var(--text-primary)",
                      fontWeight: 500,
                    }}>
                      {i === 0 ? "Current session" : `Session ${i + 1}`}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
                      color: "var(--text-faint)",
                    }}>
                      {timeAgo(s.created_at)}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono, monospace)", fontSize: "10px",
                    color: "var(--text-muted)", marginTop: "3px",
                  }}>
                    Expires {fmtDateTime(s.expires_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
  };

  const [section, setSection] = useState<Section>("notifications");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefs,   setPrefs]   = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      apiClient.get<UserProfile>("/api/v1/auth/me"),
      apiClient.get<PrefsResponse>("/api/v1/preferences"),
    ]).then(([profileRes, prefsRes]) => {
      setProfile(profileRes.data);
      setPrefs(prefsRes.data.notifications);
    }).catch(() => {
      showToast("Failed to load settings", "error");
    }).finally(() => setLoading(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type });

  const savePrefs = useCallback(async (updated: NotificationPrefs) => {
    setSaving(true);
    setPrefs(updated);
    try {
      await apiClient.patch("/api/v1/preferences", { notifications: updated });
      showToast("Saved", "success");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, []);

  const togglePref = (key: keyof Omit<NotificationPrefs, "min_severity">, val: boolean) => {
    if (!prefs) return;
    savePrefs({ ...prefs, [key]: val });
  };

  const setSeverity = (val: NotificationPrefs["min_severity"]) => {
    if (!prefs) return;
    savePrefs({ ...prefs, min_severity: val });
  };

  const resetPrefs = async () => {
    setSaving(true);
    try {
      await apiClient.delete("/api/v1/preferences");
      const res = await apiClient.get<PrefsResponse>("/api/v1/preferences");
      setPrefs(res.data.notifications);
      showToast("Reset to defaults", "success");
    } catch {
      showToast("Reset failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes skelPulse {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.85; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px", maxWidth: "800px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "3px" }}>
            <h1 style={{
              ...mono, margin: 0, fontSize: "18px", fontWeight: 700,
              color: "var(--text-primary)", letterSpacing: "-0.02em",
            }}>
              Settings
            </h1>
            {saving && (
              <span style={{ ...mono, fontSize: "10px", color: "var(--text-faint)" }}>
                saving…
              </span>
            )}
          </div>
          <p style={{ ...mono, margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
            Account preferences, profile, and security.
          </p>
        </div>

        {/* Layout */}
        <div style={{
          display: "grid", gridTemplateColumns: "168px 1fr",
          gap: "18px", maxWidth: "800px",
        }}>

          {/* Sidebar */}
          <nav style={{
            display: "flex", flexDirection: "column", gap: "2px",
            alignSelf: "start", position: "sticky", top: "20px",
          }}>
            <NavItem
              label="Notifications"
              icon={<Icons.Bell />}
              active={section === "notifications"}
              onClick={() => setSection("notifications")}
            />
            <NavItem
              label="Profile"
              icon={<Icons.User />}
              active={section === "profile"}
              onClick={() => setSection("profile")}
            />
            <NavItem
              label="Security"
              icon={<Icons.Shield />}
              active={section === "security"}
              onClick={() => setSection("security")}
            />
          </nav>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {section === "notifications" && (
              <NotificationsSection
                prefs={prefs}
                loading={loading}
                saving={saving}
                profile={profile}
                onToggle={togglePref}
                onSeverity={setSeverity}
                onReset={resetPrefs}
              />
            )}

            {section === "profile" && (
              <ProfileSection
                profile={profile}
                loading={loading}
                onToast={showToast}
              />
            )}

            {section === "security" && (
              <SecuritySection onToast={showToast} />
            )}

          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}