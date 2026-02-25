// src/components/scheduled-scans/ScheduledScansList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledScan {
  id:                  string;
  label:               string | null;
  target:              string;
  tools:               string[];
  cron_expression:     string;
  preset_key:          string | null;
  is_active:           boolean;
  notify_on_complete:  boolean;
  notify_on_failure:   boolean;
  next_run_at:         string | null;
  last_run_at:         string | null;
  last_scan_id:        string | null;
  run_count:           number;
  created_at:          string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNextRun(iso: string | null): { label: string; urgent: boolean } {
  if (!iso) return { label: '—', urgent: false };
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (diff < 0)       return { label: 'Overdue',          urgent: true  };
  if (mins < 60)      return { label: `in ${mins}m`,      urgent: mins < 5 };
  if (mins < 1440)    return { label: `in ${Math.round(mins / 60)}h`, urgent: false };
  return { label: `in ${Math.round(mins / 1440)}d`,        urgent: false };
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const TOOL_COLOR: Record<string, string> = {
  nmap:      'var(--severity-info)',
  httpx:     'var(--severity-medium)',
  nuclei:    'var(--severity-critical)',
  wpscan:    'var(--severity-high)',
  tlsinfo:   'var(--accent)',
  subfinder: 'var(--severity-info)',
};

function ToolPill({ tool }: { tool: string }) {
  const color = TOOL_COLOR[tool] ?? 'var(--text-muted)';
  return (
    <span
      className="px-1.5 py-0.5 rounded-sm text-xs"
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}33`,
        ...mono, fontSize: 10,
      }}
    >
      {tool}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-semibold"
      style={{
        color:           active ? 'var(--accent)'  : 'var(--text-muted)',
        backgroundColor: active ? 'var(--accent-dim)' : 'var(--bg-hover)',
        border:          `1px solid ${active ? 'var(--accent-border)' : 'var(--border-default)'}`,
        ...mono,
      }}
    >
      {active && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--accent)', display: 'inline-block' }}
        />
      )}
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScheduledScansList() {
  const [scans,     setScans]     = useState<ScheduledScan[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [toggling,  setToggling]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/scheduled-scans');
      setScans(data?.scheduled_scans ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load scheduled scans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const { data } = await apiClient.patch(`/api/v1/scheduled-scans/${id}/toggle`);
      setScans(prev => prev.map(s =>
        s.id === id
          ? { ...s, is_active: data.is_active, next_run_at: data.next_run_at }
          : s
      ));
    } catch {
      // silent — table will be stale until next refresh
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scheduled scan? Running scans will not be affected.')) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/api/v1/scheduled-scans/${id}`);
      setScans(prev => prev.filter(s => s.id !== id));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const active = scans.filter(s => s.is_active).length;
  const paused = scans.filter(s => !s.is_active).length;

  return (
    <div className="p-6 space-y-5" style={mono}>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>
              scheduled-scans --list
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${scans.length} schedule${scans.length !== 1 ? 's' : ''} · ${active} active · ${paused} paused`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchScans}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6a5 5 0 105-.98" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M6 1v2.5L4.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Refresh
          </button>
          <Link
            href="/dashboard/scheduled-scans/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm font-bold tracking-wider transition-opacity hover:opacity-80"
            style={{
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
            }}
          >
            + New Schedule
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      {!loading && scans.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',   value: scans.length, color: 'var(--text-primary)' },
            { label: 'Active',  value: active,       color: 'var(--accent)'       },
            { label: 'Paused',  value: paused,       color: 'var(--text-muted)'   },
          ].map(s => (
            <div
              key={s.label}
              className="p-4 rounded-sm"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          className="px-4 py-3 rounded-sm text-xs flex items-center gap-2"
          style={{
            backgroundColor: 'var(--danger-dim)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
          }}
        >
          <span>✗</span> {error}
        </div>
      )}

      {/* ── Table ── */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        {/* Loading skeleton */}
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-3 w-32 rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-5 w-16 rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-3 w-24 rounded-sm ml-auto" style={{ backgroundColor: 'var(--border-default)' }} />
              </div>
            ))}
          </div>

        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-12 h-12 rounded-sm flex items-center justify-center mb-4 text-xl"
              style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
            >
              ⏰
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>No scheduled scans</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
              Automate recurring scans on a cron schedule
            </p>
            <Link
              href="/dashboard/scheduled-scans/new"
              className="px-4 py-2 text-xs font-bold rounded-sm tracking-wider"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
              }}
            >
              + New Schedule
            </Link>
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Target / Label', 'Status', 'Tools', 'Schedule', 'Next Run', 'Runs', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-5 py-3 text-left font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-hover)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan, idx) => {
                  const { label: nextLabel, urgent } = formatNextRun(scan.next_run_at);
                  const isToggling = toggling === scan.id;
                  const isDeleting = deleting === scan.id;

                  return (
                    <tr
                      key={scan.id}
                      style={{ borderBottom: idx < scans.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      className="group transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Target / Label */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {scan.target}
                        </span>
                        {scan.label && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                            {scan.label}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <ActiveBadge active={scan.is_active} />
                      </td>

                      {/* Tools */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {scan.tools.map(t => <ToolPill key={t} tool={t} />)}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-3.5">
                        <span style={{ color: 'var(--text-muted)', ...mono, fontSize: 11 }}>
                          {scan.cron_expression}
                        </span>
                      </td>

                      {/* Next run */}
                      <td className="px-5 py-3.5">
                        <span style={{ color: urgent ? 'var(--warn)' : 'var(--text-muted)' }}>
                          {scan.is_active ? nextLabel : '—'}
                        </span>
                      </td>

                      {/* Run count */}
                      <td className="px-5 py-3.5">
                        <span style={{ color: 'var(--text-faint)' }}>{scan.run_count}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">

                          {/* Pause / Resume */}
                          <button
                            onClick={() => handleToggle(scan.id)}
                            disabled={isToggling}
                            title={scan.is_active ? 'Pause' : 'Resume'}
                            className="p-1.5 rounded-sm transition-colors disabled:opacity-40"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.color = scan.is_active ? 'var(--warn)' : 'var(--accent)';
                              (e.currentTarget as HTMLElement).style.backgroundColor = scan.is_active ? 'var(--warn-dim)' : 'var(--accent-dim)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            {isToggling ? (
                              <span className="w-3.5 h-3.5 rounded-full animate-spin inline-block"
                                style={{
                                  borderWidth: '1px', borderStyle: 'solid',
                                  borderTopColor: 'transparent',
                                  borderRightColor: 'currentColor',
                                  borderBottomColor: 'currentColor',
                                  borderLeftColor: 'currentColor',
                                }}
                              />
                            ) : scan.is_active ? (
                              /* Pause icon */
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <rect x="6" y="4" width="4" height="16" rx="1"/>
                                <rect x="14" y="4" width="4" height="16" rx="1"/>
                              </svg>
                            ) : (
                              /* Play icon */
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                            )}
                          </button>

                          {/* Edit */}
                          <Link
                            href={`/dashboard/scheduled-scans/${scan.id}/edit`}
                            className="p-1.5 rounded-sm transition-colors"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(scan.id)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-sm transition-colors disabled:opacity-40"
                            style={{ color: 'var(--text-faint)' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger-dim)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            {isDeleting ? (
                              <span className="w-3.5 h-3.5 rounded-full animate-spin inline-block"
                                style={{
                                  borderWidth: '1px', borderStyle: 'solid',
                                  borderTopColor: 'transparent',
                                  borderRightColor: 'var(--danger)',
                                  borderBottomColor: 'var(--danger)',
                                  borderLeftColor: 'var(--danger)',
                                }}
                              />
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            )}
                          </button>

                          {/* View last scan */}
                          {scan.last_scan_id && (
                            <Link
                              href={`/dashboard/scans/${scan.last_scan_id}`}
                              className="ml-1 px-2.5 py-1.5 rounded-sm text-xs font-bold tracking-wider"
                              style={{
                                color: 'var(--accent)',
                                backgroundColor: 'var(--accent-dim)',
                                border: '1px solid var(--accent-border)',
                              }}
                              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
                              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                            >
                              Last →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}