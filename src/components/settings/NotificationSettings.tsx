"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS = [
  { value: null,       label: "All findings",   hint: "Notify on every completed scan" },
  { value: "low",      label: "Low and above",  hint: "Skip scans with zero findings" },
  { value: "medium",   label: "Medium+",        hint: "Skip info / low-only scans" },
  { value: "high",     label: "High+",          hint: "Only when serious issues found" },
  { value: "critical", label: "Critical only",  hint: "Only the most severe findings" },
] as const;

const TOGGLE_ROWS = [
  {
    group:   "manual" as const,
    label:   "Manual Scans",
    subtitle: "Scans you trigger directly from the dashboard.",
    items: [
      { key: "manual_complete" as const, label: "Scan complete", sub: "Email when a manual scan finishes successfully." },
      { key: "manual_failed"   as const, label: "Scan failed",   sub: "Email when a manual scan encounters an error." },
    ],
  },
  {
    group:   "scheduled" as const,
    label:   "Scheduled Scans",
    subtitle: "Automated scans running on a cron schedule.",
    items: [
      { key: "scheduled_complete" as const, label: "Scan complete", sub: "Email when a scheduled scan finishes. Also requires the per-schedule notify flag." },
      { key: "scheduled_failed"   as const, label: "Scan failed",   sub: "Email when a scheduled scan fails. Also requires the per-schedule notify flag." },
    ],
  },
];

// ─── Small atoms ──────────────────────────────────────────────────────────────

function Skel({ w = "100%", h = "12px" }: { w?: string; h?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: "3px",
      background: "var(--bg-hover)",
      animation: "ntfPulse 1.5s ease-in-out infinite",
    }} />
  );
}

function Toggle({ checked, onChange, disabled }: {
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
        width: "36px", height: "20px",
        borderRadius: "10px",
        border: "1px solid",
        borderColor: checked ? "var(--accent)" : "var(--border-default)",
        background: checked ? "var(--accent)" : "var(--bg-hover)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.16s ease",
        flexShrink: 0, padding: 0, outline: "none",
      }}
    >
      <span style={{
        position: "absolute",
        top: "2px", left: checked ? "16px" : "2px",
        width: "14px", height: "14px",
        borderRadius: "50%",
        background: checked ? "#061208" : "var(--text-muted)",
        transition: "left 0.16s ease",
      }} />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ label, subtitle, children }: {
  label: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      border: "1px solid var(--border-default)",
      borderRadius: "8px",
      background: "var(--bg-card)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-hover)",
      }}>
        <div style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "12px", fontWeight: 600,
          color: "var(--text-primary)",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "10px", color: "var(--text-muted)",
          marginTop: "2px",
        }}>{subtitle}</div>
      </div>
      <div style={{ padding: "0 16px" }}>{children}</div>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({ label, sub, checked, onChange, disabled, last }: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "16px",
      padding: "13px 0",
      borderBottom: last ? "none" : "1px solid var(--border-subtle)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "12px", fontWeight: 500,
          color: "var(--text-primary)", marginBottom: "2px",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.5,
        }}>{sub}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkelSection({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <Section label={label} subtitle={subtitle}>
      {[0, 1].map((_, i, arr) => (
        <div key={i} style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "16px",
          padding: "13px 0",
          borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <Skel w="110px" />
            <Skel w="220px" h="9px" />
          </div>
          <Skel w="36px" h="20px" />
        </div>
      ))}
    </Section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NotificationSettings() {
  const [prefs,   setPrefs]   = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState<"idle" | "saved" | "error">("idle");
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    apiClient.get<PrefsResponse>("/api/v1/preferences")
      .then(res => setPrefs(res.data.notifications))
      .catch(() => { setStatus("error"); setErrMsg("Could not load preferences."); })
      .finally(() => setLoading(false));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const persist = useCallback(async (updated: NotificationPrefs) => {
    setSaving(true);
    setStatus("idle");
    setErrMsg(null);
    try {
      await apiClient.patch("/api/v1/preferences", { notifications: updated });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setErrMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleToggle = (key: keyof Omit<NotificationPrefs, "min_severity">, val: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    persist(updated);
  };

  const handleSeverity = (val: NotificationPrefs["min_severity"]) => {
    if (!prefs) return;
    const updated = { ...prefs, min_severity: val };
    setPrefs(updated);
    persist(updated);
  };

  const handleReset = async () => {
    setSaving(true);
    setStatus("idle");
    setErrMsg(null);
    try {
      await apiClient.delete("/api/v1/preferences");
      const res = await apiClient.get<PrefsResponse>("/api/v1/preferences");
      setPrefs(res.data.notifications);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setErrMsg("Reset failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
  };

  return (
    <>
      <style>{`
        @keyframes ntfPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.75; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: "4px" }}>
          <h2 style={{
            ...mono, margin: 0, fontSize: "15px", fontWeight: 700,
            color: "var(--text-primary)", letterSpacing: "-0.01em",
          }}>
            Notification Preferences
          </h2>
          <p style={{
            ...mono, margin: "4px 0 0", fontSize: "11px",
            color: "var(--text-muted)", lineHeight: 1.5,
          }}>
            Choose when you receive email notifications about your scans.
            Changes are saved automatically.
          </p>
        </div>

        {/* ── Error state (load failure) ── */}
        {!loading && status === "error" && !prefs && (
          <div style={{
            padding: "12px 14px", borderRadius: "7px",
            border: "1px solid var(--danger-border)",
            background: "var(--danger-dim)",
            ...mono, fontSize: "12px", color: "var(--danger)",
          }}>
            {errMsg ?? "Could not load preferences."}
          </div>
        )}

        {/* ── Toggle sections ── */}
        {TOGGLE_ROWS.map(group => (
          loading ? (
            <SkelSection key={group.group} label={group.label} subtitle={group.subtitle} />
          ) : prefs ? (
            <Section key={group.group} label={group.label} subtitle={group.subtitle}>
              {group.items.map((item, i, arr) => (
                <ToggleRow
                  key={item.key}
                  label={item.label}
                  sub={item.sub}
                  checked={prefs[item.key]}
                  onChange={v => handleToggle(item.key, v)}
                  disabled={saving}
                  last={i === arr.length - 1}
                />
              ))}
            </Section>
          ) : null
        ))}

        {/* ── Severity filter ── */}
        {loading ? (
          <Section label="Severity Filter" subtitle="Only notify when findings meet your threshold.">
            <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skel w="170px" h="10px" />
              <div style={{ display: "flex", gap: "6px" }}>
                {[72, 84, 64, 56, 82].map((w, i) => <Skel key={i} w={`${w}px`} h="26px" />)}
              </div>
            </div>
          </Section>
        ) : prefs ? (
          <Section label="Severity Filter" subtitle="Only notify when findings meet your threshold.">
            <div style={{ padding: "14px 0" }}>

              {/* Label */}
              <div style={{
                ...mono, fontSize: "10px", fontWeight: 600,
                color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.07em", marginBottom: "10px",
              }}>
                Minimum severity to notify
              </div>

              {/* Pills */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {SEVERITY_OPTIONS.map(opt => {
                  const active = prefs.min_severity === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => !saving && handleSeverity(opt.value)}
                      title={opt.hint}
                      style={{
                        ...mono, fontSize: "11px",
                        padding: "5px 11px", borderRadius: "5px",
                        border: "1px solid",
                        borderColor: active ? "var(--accent)" : "var(--border-default)",
                        background: active ? "var(--accent-dim)" : "var(--bg-hover)",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        fontWeight: active ? 600 : 400,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1,
                        transition: "all 0.14s ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              <div style={{
                ...mono, fontSize: "10px",
                color: "var(--text-faint)", marginTop: "8px",
              }}>
                {prefs.min_severity === null
                  ? "Notifying on all completed scans regardless of findings."
                  : `Only notifying when ${prefs.min_severity} or higher severity findings are present.`}
              </div>

            </div>
          </Section>
        ) : null}

        {/* ── Footer bar ── */}
        {!loading && prefs && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", paddingTop: "2px",
          }}>

            {/* Status text */}
            <div style={{ ...mono, fontSize: "11px", height: "16px" }}>
              {saving && (
                <span style={{ color: "var(--text-faint)" }}>Saving…</span>
              )}
              {!saving && status === "saved" && (
                <span style={{ color: "var(--accent)" }}>✓ Saved</span>
              )}
              {!saving && status === "error" && errMsg && (
                <span style={{ color: "var(--danger)" }}>{errMsg}</span>
              )}
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              disabled={saving}
              style={{
                ...mono, fontSize: "11px",
                padding: "5px 11px", borderRadius: "5px",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-faint)",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.45 : 1,
                transition: "color 0.14s, border-color 0.14s",
              }}
              onMouseEnter={e => {
                if (!saving) {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
              }}
            >
              Reset to defaults
            </button>
          </div>
        )}

      </div>
    </>
  );
}