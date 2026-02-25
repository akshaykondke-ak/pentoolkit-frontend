// src/components/scans/ScansList.tsx
// src/components/scans/ScansList.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import ScanStatusBadge from './ScanStatusBadge';
import ScanProgressCard from './ScanProgressCard';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

interface Scan {
  scan_id: string;
  target: string;
  status: string;
  tools: string[];
  findings_count: number;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  progress: { percent: number; current_tool: string | null; completed_tools: number; total_tools: number } | null;
  error: string | null;
  report_path: string | null;
}

const PAGE_SIZE = 15;

function calcDuration(started: string, completed: string | null): string {
  if (!completed) return '—';
  const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function findingsColor(n: number): string {
  if (n === 0)  return 'var(--text-faint)';
  if (n >= 15)  return 'var(--danger)';
  if (n >= 8)   return 'var(--warn)';
  return 'var(--text-primary)';
}

const TOOL_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  nmap:      { color: 'var(--severity-info)',     bg: 'rgba(68,136,255,0.08)',  border: 'rgba(68,136,255,0.2)'  },
  wpscan:    { color: 'var(--severity-high)',     bg: 'rgba(255,136,0,0.08)',   border: 'rgba(255,136,0,0.2)'   },
  tlsinfo:   { color: 'var(--accent)',            bg: 'var(--accent-dim)',      border: 'var(--accent-border)'  },
  httpx:     { color: 'var(--severity-medium)',   bg: 'rgba(255,170,0,0.08)',   border: 'rgba(255,170,0,0.2)'   },
  nuclei:    { color: 'var(--severity-critical)', bg: 'var(--danger-dim)',      border: 'var(--danger-border)'  },
  subfinder: { color: 'var(--severity-info)',     bg: 'rgba(68,136,255,0.08)',  border: 'rgba(68,136,255,0.2)'  },
};

function ToolPill({ tool }: { tool: string }) {
  const c = TOOL_COLORS[tool] ?? { color: 'var(--text-muted)', bg: 'var(--bg-hover)', border: 'var(--border-default)' };
  return (
    <span
      className="px-2 py-0.5 rounded-sm text-xs"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      {tool}
    </span>
  );
}

export default function ScansList() {
  const [scans, setScans]         = useState<Scan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [deletingId, setDelId]    = useState<string | null>(null);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);   // 0-indexed

  const fetchScans = useCallback(async (pageIndex = page) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/scans', {
        params: { limit: PAGE_SIZE, offset: pageIndex * PAGE_SIZE },
      });
      setScans(Array.isArray(data) ? data : data?.scans ?? []);
      setTotal(data?.total ?? (Array.isArray(data) ? data.length : 0));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch scans');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchScans(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (scanId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this scan and all its findings?')) return;
    setDelId(scanId);
    try {
      await apiClient.delete(`/api/v1/scans/${scanId}`);
      setScans(p => p.filter(s => s.scan_id !== scanId));
      setTotal(p => p - 1);
    } catch { /* silent */ }
    setDelId(null);
  };

  const active   = scans.filter(s => s.status === 'running' || s.status === 'queued');
  const finished = scans.filter(s => s.status !== 'running' && s.status !== 'queued');

  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const hasPrev     = page > 0;
  const hasNext     = page < totalPages - 1;

  // Stats computed from all loaded scans (just the current page)
  const completed     = scans.filter(s => s.status === 'completed').length;
  const failed        = scans.filter(s => s.status === 'failed').length;
  const totalFindings = scans.reduce((a, s) => a + (s.findings_count ?? 0), 0);

  return (
    <div className="p-6 space-y-5" style={mono}>

      {/* ── Toolbar ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: 'var(--accent)' }} className="text-xs">$</span>
            <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>scans --list</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${total} scan${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchScans(page)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6a5 5 0 105-.98" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M6 1v2.5L4.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Refresh
          </button>
          <Link
            href="/dashboard/scans/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm font-bold tracking-wider transition-opacity hover:opacity-80"
            style={{
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
            }}
          >
            + New Scan
          </Link>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────── */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Scans',    value: total,         color: 'var(--text-primary)' },
            { label: 'Completed',      value: completed,     color: 'var(--accent)'       },
            { label: 'Failed',         value: failed,        color: 'var(--danger)'       },
            { label: 'Findings (page)',value: totalFindings, color: 'var(--warn)'         },
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

      {/* ── Error ──────────────────────────────────── */}
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

      {/* ── Active scans ───────────────────────────── */}
      {active.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2 h-2 rounded-full animate-ping inline-block"
              style={{ backgroundColor: 'var(--warn)' }}
            />
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Active ({active.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {active.map(scan => (
              <ScanProgressCard
                key={scan.scan_id}
                scanId={scan.scan_id}
                initialStatus={scan.status}
                onComplete={() => setTimeout(() => fetchScans(page), 1000)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Scans table ────────────────────────────── */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        {/* Loading skeleton */}
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-3 w-32 rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-5 w-20 rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-3 w-24 rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-3 w-8  rounded-sm ml-auto" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-3 w-12 rounded-sm" style={{ backgroundColor: 'var(--border-default)' }} />
              </div>
            ))}
          </div>

        ) : finished.length === 0 && active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-12 h-12 rounded-sm flex items-center justify-center mb-4 text-xl"
              style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
            >
              🔍
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>No scans yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>Run your first scan to see results here</p>
            <Link
              href="/dashboard/scans/new"
              className="px-4 py-2 text-xs font-bold rounded-sm tracking-wider transition-opacity hover:opacity-80"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
              }}
            >
              + New Scan
            </Link>
          </div>

        ) : finished.length === 0 ? null : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Target', 'Status', 'Tools', 'Findings', 'Duration', 'Date', ''].map((h, i) => (
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
                  {finished.map((scan, idx) => {
                    const isDel = deletingId === scan.scan_id;
                    return (
                      <tr
                        key={scan.scan_id}
                        style={{ borderBottom: idx < finished.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                        className="group transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Target */}
                        <td className="px-5 py-3.5">
                          <Link href={`/dashboard/scans/${scan.scan_id}`}>
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {scan.target}
                            </span>
                            <br />
                            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>
                              {scan.scan_id.slice(-12)}
                            </span>
                          </Link>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <ScanStatusBadge status={scan.status} showSpinner={false} />
                          {scan.error && (
                            <p
                              className="text-xs mt-1 truncate max-w-[110px]"
                              style={{ color: 'var(--danger)' }}
                              title={scan.error}
                            >
                              {scan.error}
                            </p>
                          )}
                        </td>

                        {/* Tools */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(scan.tools ?? []).length > 0
                              ? (scan.tools ?? []).map(t => <ToolPill key={t} tool={t} />)
                              : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                          </div>
                        </td>

                        {/* Findings */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold" style={{ color: findingsColor(scan.findings_count ?? 0) }}>
                            {scan.findings_count ?? 0}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-5 py-3.5">
                          <span style={{ color: 'var(--text-muted)' }}>
                            {calcDuration(scan.started_at, scan.completed_at)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5">
                          <span style={{ color: 'var(--text-faint)' }}>{formatDate(scan.started_at)}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {scan.report_path && (
                              <Link
                                href={`/dashboard/scans/${scan.scan_id}`}
                                title="View report"
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
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                              </Link>
                            )}

                            <button
                              onClick={e => handleDelete(scan.scan_id, e)}
                              disabled={isDel}
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
                              {isDel ? (
                                <span
                                  className="w-3.5 h-3.5 rounded-full animate-spin inline-block"
                                  style={{
                                    borderWidth: '1px', borderStyle: 'solid',
                                    borderTopColor: 'transparent',
                                    borderRightColor: 'var(--danger)',
                                    borderBottomColor: 'var(--danger)',
                                    borderLeftColor: 'var(--danger)',
                                  }}
                                />
                              ) : (
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              )}
                            </button>

                            <Link
                              href={`/dashboard/scans/${scan.scan_id}`}
                              className="ml-1 px-3 py-1.5 rounded-sm text-xs font-bold tracking-wider transition-all"
                              style={{
                                color: 'var(--accent)',
                                backgroundColor: 'var(--accent-dim)',
                                border: '1px solid var(--accent-border)',
                              }}
                              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
                              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                            >
                              View →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ─────────────────────────── */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: '1px solid var(--border-default)' }}
              >
                {/* Page info */}
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Page {page + 1} of {totalPages}
                  <span className="ml-2" style={{ color: 'var(--text-muted)' }}>
                    ({page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total})
                  </span>
                </span>

                {/* Prev / page numbers / Next */}
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={!hasPrev}
                    className="px-3 py-1.5 text-xs rounded-sm transition-colors disabled:opacity-30"
                    style={{
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-hover)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    ← Prev
                  </button>

                  {/* Page number pills — show max 5 */}
                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(i => Math.abs(i - page) <= 2)
                    .map(i => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className="w-8 h-7 text-xs rounded-sm transition-colors"
                        style={{
                          color:           i === page ? 'var(--accent)'         : 'var(--text-muted)',
                          backgroundColor: i === page ? 'var(--accent-dim)'     : 'transparent',
                          border:          i === page ? '1px solid var(--accent-border)' : '1px solid transparent',
                          fontWeight:      i === page ? 700 : 400,
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}

                  {/* Next */}
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNext}
                    className="px-3 py-1.5 text-xs rounded-sm transition-colors disabled:opacity-30"
                    style={{
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-hover)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

