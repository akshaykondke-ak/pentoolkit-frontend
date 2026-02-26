"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserSettings {
  full_name: string;
  email: string;
  is_verified: boolean;
  notify_on_manual_scan: boolean;
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
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
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        border: "1px solid",
        borderColor: checked ? "var(--accent)" : "var(--border)",
        background: checked ? "var(--accent)" : "var(--bg-hover)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: checked ? "22px" : "2px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: checked ? "#0a0f0a" : "var(--text-muted)",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid",
        borderColor: type === "success" ? "var(--accent)" : "var(--critical)",
        background: "var(--bg-card)",
        color: type === "success" ? "var(--accent)" : "var(--critical)",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "13px",
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideUp 0.2s ease",
      }}
    >
      {type === "success" ? <CheckIcon /> : <AlertIcon />}
      {message}
    </div>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({
  title,
  description,
  badge,
  control,
}: {
  title: string;
  description: string;
  badge?: React.ReactNode;
  control: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "24px",
        padding: "20px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "14px",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          >
            {title}
          </span>
          {badge}
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: "1.5",
          }}
        >
          {description}
        </p>
      </div>
      <div style={{ flexShrink: 0, paddingTop: "2px" }}>{control}</div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-hover)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--accent)",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Section body */}
      <div style={{ padding: "0 24px" }}>{children}</div>
    </div>
  );
}

// ─── Placeholder Row ──────────────────────────────────────────────────────────

function PlaceholderRow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 0",
        borderBottom: "1px solid var(--border)",
        opacity: 0.35,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "14px",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: "180px",
            height: "10px",
            borderRadius: "4px",
            background: "var(--border)",
          }}
        />
      </div>
      <div
        style={{
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          background: "var(--border)",
        }}
      />
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const mono = { fontFamily: "var(--font-mono, monospace)" };

  const [activeSection, setActiveSection] = useState("notifications");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const sections: SettingsSection[] = [
    { id: "notifications", label: "Notifications", icon: <BellIcon /> },
    { id: "profile", label: "Profile", icon: <UserIcon /> },
    { id: "security", label: "Security", icon: <ShieldIcon /> },
  ];

  // ── Load user settings ───────────────────────────────────────────────────
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setToast({ message: "Failed to load settings", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // ── Save a single preference field ───────────────────────────────────────
  const saveSetting = useCallback(
    async (field: keyof UserSettings, value: boolean | string) => {
      if (!settings) return;
      setSaving(true);

      // Optimistic update
      setSettings((prev) => prev ? { ...prev, [field]: value } : prev);

      try {
        const res = await fetch("/api/v1/auth/me", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });

        if (!res.ok) throw new Error("Save failed");

        const updated = await res.json();
        setSettings(updated);
        setToast({ message: "Setting saved", type: "success" });
      } catch (err) {
        // Revert on failure
        setSettings((prev) => prev ? { ...prev, [field]: !value } : prev);
        setToast({ message: "Failed to save setting", type: "error" });
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .settings-nav-item:hover {
          background: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
        .settings-nav-item.active {
          background: var(--bg-hover) !important;
          color: var(--accent) !important;
          border-color: var(--accent) !important;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          padding: "32px 24px",
        }}
      >
        {/* ── Page header ── */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              ...mono,
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Settings
          </h1>
          <p
            style={{
              ...mono,
              margin: "6px 0 0",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Manage your account preferences and notification settings.
          </p>
        </div>

        {/* ── Layout ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: "24px",
            maxWidth: "900px",
          }}
        >
          {/* ── Sidebar nav ── */}
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignSelf: "start",
              position: "sticky",
              top: "24px",
            }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                className={`settings-nav-item${activeSection === s.id ? " active" : ""}`}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "7px",
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "13px",
                  fontWeight: activeSection === s.id ? 600 : 400,
                }}
              >
                <span
                  style={{
                    color: activeSection === s.id ? "var(--accent)" : "var(--text-muted)",
                    transition: "color 0.15s",
                  }}
                >
                  {s.icon}
                </span>
                {s.label}
              </button>
            ))}
          </nav>

          {/* ── Content ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* ════ NOTIFICATIONS ════ */}
            {activeSection === "notifications" && (
              <Section
                icon={<BellIcon />}
                title="Notifications"
                subtitle="Control when and how you receive scan emails."
              >
                {loading ? (
                  <>
                    <PlaceholderRow label="Manual scan emails" />
                    <PlaceholderRow label="Scheduled scan emails" />
                  </>
                ) : (
                  <>
                    {/* Manual scan toggle */}
                    <SettingRow
                      title="Manual scan completion emails"
                      description="Receive an email when a scan you trigger manually finishes. Includes a summary of findings by severity."
                      badge={
                        !settings?.is_verified ? (
                          <span
                            style={{
                              ...mono,
                              fontSize: "10px",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              border: "1px solid var(--warn)",
                              color: "var(--warn)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            VERIFY EMAIL FIRST
                          </span>
                        ) : null
                      }
                      control={
                        <Toggle
                          checked={settings?.notify_on_manual_scan ?? false}
                          onChange={(v) => saveSetting("notify_on_manual_scan", v)}
                          disabled={saving || !settings?.is_verified}
                        />
                      }
                    />

                    {/* Scheduled scan info row */}
                    <SettingRow
                      title="Scheduled scan completion emails"
                      description="Configured per-schedule in the Scheduled Scans page. Each schedule has its own notify toggle."
                      control={
                        <span
                          style={{
                            ...mono,
                            fontSize: "11px",
                            color: "var(--text-faint)",
                            padding: "4px 8px",
                            borderRadius: "5px",
                            border: "1px solid var(--border)",
                            background: "var(--bg-hover)",
                          }}
                        >
                          per-schedule
                        </span>
                      }
                    />

                    {/* Failure emails info row */}
                    <SettingRow
                      title="Scan failure emails"
                      description="Email notifications on scan failure are only sent for scheduled scans, based on the per-schedule setting."
                      control={
                        <span
                          style={{
                            ...mono,
                            fontSize: "11px",
                            color: "var(--text-faint)",
                            padding: "4px 8px",
                            borderRadius: "5px",
                            border: "1px solid var(--border)",
                            background: "var(--bg-hover)",
                          }}
                        >
                          per-schedule
                        </span>
                      }
                    />

                    {/* Unverified email warning */}
                    {!settings?.is_verified && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          margin: "16px 0",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid var(--warn)",
                          background: "rgba(var(--warn-rgb, 234,179,8), 0.06)",
                        }}
                      >
                        <span style={{ color: "var(--warn)", marginTop: "1px" }}>
                          <AlertIcon />
                        </span>
                        <p
                          style={{
                            ...mono,
                            margin: 0,
                            fontSize: "12px",
                            color: "var(--warn)",
                            lineHeight: "1.5",
                          }}
                        >
                          Your email address is not verified. Verify it to enable notifications.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Section>
            )}

            {/* ════ PROFILE ════ */}
            {activeSection === "profile" && (
              <Section
                icon={<UserIcon />}
                title="Profile"
                subtitle="Your account information."
              >
                <div style={{ padding: "20px 0" }}>
                  <p
                    style={{
                      ...mono,
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Profile editing coming soon. You can update your name and email address here.
                  </p>
                  {settings && (
                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {[
                        { label: "Name", value: settings.full_name },
                        { label: "Email", value: settings.email },
                        {
                          label: "Status",
                          value: settings.is_verified ? "Verified" : "Unverified",
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          style={{
                            display: "flex",
                            gap: "16px",
                            alignItems: "baseline",
                          }}
                        >
                          <span
                            style={{
                              ...mono,
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              width: "60px",
                              flexShrink: 0,
                            }}
                          >
                            {row.label}
                          </span>
                          <span
                            style={{
                              ...mono,
                              fontSize: "13px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ════ SECURITY ════ */}
            {activeSection === "security" && (
              <Section
                icon={<ShieldIcon />}
                title="Security"
                subtitle="Password and session management."
              >
                <div style={{ padding: "20px 0" }}>
                  <p
                    style={{
                      ...mono,
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Security settings coming soon. Change password, manage active sessions, and
                    configure two-factor authentication here.
                  </p>
                </div>
              </Section>
            )}

          </div>
        </div>
      </div>

      {/* ── Toast ── */}
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