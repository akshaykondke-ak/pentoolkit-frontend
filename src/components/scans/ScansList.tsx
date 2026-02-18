// src/components/scans/ScansList.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import ScanStatusBadge from './ScanStatusBadge';
import ScanProgressCard from './ScanProgressCard';

interface Scan {
  scan_id: string;
  target: string;
  status: string;
  tools: string[];
  findings_count: number;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  progress: {
    percent: number;
    current_tool: string | null;
    completed_tools: number;
    total_tools: number;
  } | null;
  error: string | null;
  report_path: string | null;
}

function calcDuration(started: string, completed: string | null): string {
  if (!completed) return '—';
  const secs = Math.round(
    (new Date(completed).getTime() - new Date(started).getTime()) / 1000
  );
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const TOOL_COLORS: Record<string, string> = {
  nmap:      'bg-violet-50 text-violet-600 border-violet-200',
  wpscan:    'bg-orange-50 text-orange-600 border-orange-200',
  tlsinfo:   'bg-teal-50 text-teal-600 border-teal-200',
  subfinder: 'bg-sky-50 text-sky-600 border-sky-200',
  httpx:     'bg-pink-50 text-pink-600 border-pink-200',
};
function toolClass(t: string) {
  return TOOL_COLORS[t] ?? 'bg-gray-50 text-gray-500 border-gray-200';
}

function findingsColor(n: number) {
  if (n === 0) return 'text-gray-300';
  if (n >= 15)  return 'text-red-500';
  if (n >= 8)   return 'text-orange-500';
  return 'text-gray-800';
}

export default function ScansList() {
  const [scans, setScans]       = useState<Scan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [deletingId, setDelId]  = useState<string | null>(null);
  const [visible, setVisible]   = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 30); }, []);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/scans');
      setScans(Array.isArray(data) ? data : data?.scans ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch scans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleDelete = async (scanId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this scan and all its findings?')) return;
    setDelId(scanId);
    try {
      await apiClient.delete(`/api/v1/scans/${scanId}`);
      setScans(p => p.filter(s => s.scan_id !== scanId));
    } catch { /* silent */ }
    setDelId(null);
  };

  const active   = scans.filter(s => s.status === 'running' || s.status === 'queued');
  const finished = scans.filter(s => s.status !== 'running' && s.status !== 'queued');

  const total         = scans.length;
  const completed     = scans.filter(s => s.status === 'completed').length;
  const cancelled     = scans.filter(s => s.status === 'cancelled').length;
  const totalFindings = scans.reduce((a, s) => a + (s.findings_count ?? 0), 0);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position:-600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes breathe {
          0%,100% { opacity:1;   transform:scale(1);   }
          50%      { opacity:0.4; transform:scale(1.8); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .fu { animation: fadeUp 0.38s cubic-bezier(.22,.68,0,1.1) both; }

        .skel {
          background: linear-gradient(90deg,#f1f5f9 0px,#e8edf4 300px,#f1f5f9 600px);
          background-size:700px 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius:5px;
        }

        .scan-row { transition: background 0.12s ease; }
        .scan-row:hover { background:#f8fafc; }
        .scan-row:hover .row-act { opacity:1; transform:translateX(0); }

        .row-act {
          opacity:0; transform:translateX(6px);
          transition: opacity .16s ease, transform .16s ease;
        }

        .stat-card {
          transition: transform .2s cubic-bezier(.22,.68,0,1.3), box-shadow .2s ease;
        }
        .stat-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.07); }

        .tool-pill { transition: transform .12s ease, box-shadow .12s ease; cursor:default; }
        .tool-pill:hover { transform:translateY(-1px); box-shadow:0 2px 8px rgba(0,0,0,.08); }

        .view-btn { transition: all .14s ease; }
        .view-btn:hover {
          background:#2563eb; color:#fff;
          border-color:#2563eb; transform:translateX(1px);
        }

        .icon-btn { transition: background .12s ease, color .12s ease, transform .12s ease; }
        .icon-btn:hover { transform:scale(1.12); }

        .breathe { animation: breathe 2s ease infinite; }
        .spin-it  { animation: spin .65s linear infinite; }
      `}</style>

      <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* ── Toolbar: only controls, NO page title (TopNav handles that) ── */}
        <div className="fu flex items-center justify-between mb-5" style={{ animationDelay: '0ms' }}>
          {/* Subtle scan count */}
          <p className="text-sm text-gray-400">
            {loading ? 'Loading…' : `${total} scan${total !== 1 ? 's' : ''} total`}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchScans}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link
              href="/dashboard/scans/new"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Scan
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        {!loading && total > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Completed',      value: completed,     col: 'text-green-600', bg: 'bg-green-50 border-green-200',   d: 40 },
              { label: 'Cancelled',      value: cancelled,     col: 'text-amber-600', bg: 'bg-amber-50 border-amber-200',   d: 70 },
              { label: 'Total Findings', value: totalFindings, col: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200',     d: 100 },
              { label: 'Total Scans',    value: total,         col: 'text-gray-700',  bg: 'bg-white border-gray-200',        d: 10 },
            ]
            // reorder so Total Scans is first
            .sort((a, b) => a.d - b.d)
            .map(s => (
              <div
                key={s.label}
                className={`stat-card fu rounded-xl border p-4 ${s.bg}`}
                style={{ animationDelay: `${s.d}ms` }}
              >
                <p className={`text-2xl font-bold tracking-tight ${s.col}`}>{s.value}</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm fu">
            {error}
          </div>
        )}

        {/* ── Active scans ── */}
        {active.length > 0 && (
          <div className="fu mb-5" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="breathe w-2 h-2 bg-blue-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Active ({active.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {active.map(scan => (
                <ScanProgressCard
                  key={scan.scan_id}
                  scanId={scan.scan_id}
                  initialStatus={scan.status}
                  onComplete={() => setTimeout(fetchScans, 1000)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div
          className="fu bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          style={{ animationDelay: '120ms' }}
        >
          {/* Skeleton */}
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skel h-4 w-28" />
                  <div className="skel h-5 w-20" />
                  <div className="skel h-4 w-32" />
                  <div className="skel h-4 w-6 ml-auto" />
                  <div className="skel h-4 w-10" />
                  <div className="skel h-4 w-16" />
                </div>
              ))}
            </div>

          /* Empty */
          ) : finished.length === 0 && active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl mb-3">🔍</div>
              <p className="font-semibold text-gray-600">No scans yet</p>
              <p className="text-sm mt-1">Run your first scan to see results here</p>
              <Link href="/dashboard/scans/new" className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                + New Scan
              </Link>
            </div>

          ) : finished.length === 0 ? null : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {['Target', 'Status', 'Tools', 'Findings', 'Duration', 'Date', ''].map((h, i) => (
                      <th key={i} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {finished.map((scan, idx) => {
                    const tools     = scan.tools ?? [];
                    const duration  = calcDuration(scan.started_at, scan.completed_at);
                    const isDel     = deletingId === scan.scan_id;

                    return (
                      <tr
                        key={scan.scan_id}
                        className="scan-row fu"
                        style={{ animationDelay: `${150 + idx * 25}ms` }}
                      >
                        {/* Target — clean, no ID */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-800 font-mono text-sm">{scan.target}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <ScanStatusBadge status={scan.status} showSpinner={false} />
                          {scan.error && (
                            <p className="text-[11px] text-red-400 mt-1 max-w-[110px] truncate" title={scan.error}>
                              {scan.error}
                            </p>
                          )}
                        </td>

                        {/* Tools */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {tools.length > 0 ? tools.map(t => (
                              <span key={t} className={`tool-pill px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium ${toolClass(t)}`}>
                                {t}
                              </span>
                            )) : <span className="text-gray-300">—</span>}
                          </div>
                        </td>

                        {/* Findings */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`text-sm font-bold tabular-nums ${findingsColor(scan.findings_count ?? 0)}`}>
                            {scan.findings_count ?? 0}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm text-gray-500 font-mono tabular-nums">{duration}</span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs text-gray-400">{formatDate(scan.started_at)}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="row-act flex items-center gap-1 justify-end">
                            {scan.report_path && (
                              <Link href="/dashboard/reports" title="View report"
                                className="icon-btn p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                              </Link>
                            )}
                            <button onClick={e => handleDelete(scan.scan_id, e)} disabled={isDel}
                              className="icon-btn p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40">
                              {isDel
                                ? <span className="spin-it w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full inline-block" />
                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                  </svg>
                              }
                            </button>
                            <Link href={`/dashboard/scans/${scan.scan_id}`}
                              className="view-btn ml-1 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg">
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
          )}
        </div>
      </div>
    </>
  );
}