// src/app/dashboard/scans/[id]/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { useScanPolling, resolveProgress } from '@/lib/hooks/useScanPolling';
import ScanStatusBadge from '@/components/scans/ScanStatusBadge';
import FindingSeverityBadge from '@/components/findings/FindingSeverityBadge';
import FindingStatusBadge from '@/components/findings/FindingStatusBadge';
import FindingDetailModal from '@/components/findings/FindingDetailModal';
import { Finding, extractCVE, formatDate } from '@/lib/api/findings';
import { findingsAPI } from '@/lib/api/findings';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };
const card: React.CSSProperties = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '2px' };

interface ScanDetail {
  id?: string;
  scan_id?: string;
  target: string;
  status: string;
  tools?: string[];
  tools_used?: string[];
  findings_count?: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  progress?: any;
  error?: string | null;
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;
const SEVERITY_CFG: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: 'var(--severity-critical)', bg: 'var(--danger-dim)',              border: 'var(--danger-border)'              },
  high:     { color: 'var(--severity-high)',     bg: 'rgba(255,136,0,0.08)',            border: 'rgba(255,136,0,0.2)'               },
  medium:   { color: 'var(--severity-medium)',   bg: 'var(--warn-dim)',                 border: 'rgba(255,170,0,0.2)'               },
  low:      { color: 'var(--severity-low)',      bg: 'rgba(136,204,0,0.08)',            border: 'rgba(136,204,0,0.2)'               },
  info:     { color: 'var(--severity-info)',     bg: 'rgba(68,136,255,0.08)',           border: 'rgba(68,136,255,0.2)'              },
};

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.id as string;

  const [scan, setScan]                     = useState<ScanDetail | null>(null);
  const [scanLoading, setScanLoading]       = useState(true);
  const [findings, setFindings]             = useState<Finding[]>([]);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [cancelling, setCancelling]         = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchScan = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/v1/scans/${scanId}`);
      setScan(res.data);
    } catch {
      try {
        const res = await apiClient.get(`/api/v1/scans/${scanId}/status`);
        setScan(res.data);
      } catch { /* not found */ }
    } finally {
      setScanLoading(false);
    }
  }, [scanId]);

  const fetchFindings = useCallback(async () => {
    setFindingsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/scans/${scanId}/findings`);
      const data = res.data;
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.findings) ? data.findings : [];
      setFindings(list);
    } catch {
      setFindings([]);
    } finally {
      setFindingsLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    fetchScan();
    fetchFindings();
  }, [fetchScan, fetchFindings]);

  const isActive = scan?.status === 'running' || scan?.status === 'queued';
  const { status: liveStatus, scanData } = useScanPolling({
    scanId: isActive ? scanId : null,
    intervalMs: 5000,
    onComplete: () => { fetchScan(); fetchFindings(); },
  });

  const currentStatus   = liveStatus ?? scan?.status ?? 'queued';
  const currentProgress = resolveProgress(scanData?.progress ?? scan?.progress);
  const tools           = scan?.tools ?? scan?.tools_used ?? [];

  const severityCounts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredFindings = severityFilter === 'all'
    ? findings
    : findings.filter(f => f.severity === severityFilter);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiClient.post(`/api/v1/scans/${scanId}/cancel`);
      fetchScan();
    } catch { /* silent */ }
    setCancelling(false);
  };

  const handleStatusChange = async (id: number, status: Finding['status']) => {
    try {
      const updated = await findingsAPI.update(id, { status });
      setFindings(prev => prev.map(f => f.id === updated.id ? updated : f));
      if (selectedFinding?.id === id) setSelectedFinding(prev => prev ? { ...prev, status } : null);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (scanLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3" style={mono}>
        <div
          className="w-6 h-6 border border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent)' }}
        />
        <span className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>Loading scan...</span>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center py-32" style={mono}>
        <p className="font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Scan not found</p>
        <Link href="/dashboard/scans" className="text-xs" style={{ color: 'var(--accent)' }}>
          ← Back to scans
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 " style={mono}>

      {/* ── Back nav ─────────────────────────────── */}
      <Link
        href="/dashboard/scans"
        className="text-xs inline-flex items-center gap-1 transition-colors"
        style={{ color: 'var(--text-faint)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
      >
        ← Back to Scans
      </Link>

      {/* ── Scan header card ─────────────────────── */}
      <div className="p-6" style={card}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: 'var(--accent)' }} className="text-xs">$</span>
              <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>scans --detail</span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{scan.target}</h1>
              <ScanStatusBadge status={currentStatus} />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{scanId}</p>
          </div>

          {(currentStatus === 'running' || currentStatus === 'queued') && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 text-xs font-bold rounded-sm transition-opacity disabled:opacity-40"
              style={{
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-dim)',
                border: '1px solid var(--danger-border)',
              }}
            >
              {cancelling ? 'Cancelling...' : '✕ Cancel Scan'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {(currentStatus === 'running' || currentStatus === 'queued') && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-faint)' }}>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-ping inline-block"
                  style={{ backgroundColor: 'var(--warn)' }}
                />
                Scan in progress — polling every 5s
              </span>
              {currentProgress !== undefined && (
                <span style={{ color: 'var(--warn)' }}>{currentProgress}%</span>
              )}
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 3, backgroundColor: 'var(--border-default)' }}
            >
              {currentProgress !== undefined ? (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${currentProgress}%`, backgroundColor: 'var(--warn)' }}
                />
              ) : (
                <div
                  className="h-full rounded-full animate-pulse"
                  style={{ width: '66%', backgroundColor: 'var(--warn)' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Meta grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5"
          style={{ borderTop: '1px solid var(--border-default)' }}
        >
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Tools</p>
            <div className="flex flex-wrap gap-1">
              {tools.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-sm text-xs"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Started</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(scan.started_at, true)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Duration</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {scan.duration_seconds ? `${Math.round(scan.duration_seconds)}s` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>Findings</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {findingsLoading ? '...' : findings.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Severity summary ─────────────────────── */}
      {findings.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {SEVERITY_ORDER.map(sev => {
            const count = severityCounts[sev] ?? 0;
            const cfg   = SEVERITY_CFG[sev];
            const active = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(active ? 'all' : sev)}
                className="p-4 text-center rounded-sm transition-all"
                style={{
                  backgroundColor: active ? cfg.bg : 'var(--bg-card)',
                  border: `1px solid ${active ? cfg.color : 'var(--border-default)'}`,
                  outline: 'none',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = cfg.color)}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                }}
              >
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs capitalize mt-0.5 uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  {sev}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Findings table ───────────────────────── */}
      <div className="overflow-hidden rounded-sm" style={card}>
        {/* Table header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="text-xs">$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Findings {!findingsLoading && `(${filteredFindings.length}${severityFilter !== 'all' ? ` ${severityFilter}` : ''})`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {severityFilter !== 'all' && (
              <button
                onClick={() => setSeverityFilter('all')}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-faint)' }}
              >
                ✕ Clear filter
              </button>
            )}
            <button
              onClick={fetchFindings}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {findingsLoading ? (
          <div className="flex items-center justify-center py-16 gap-2" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-4 h-4 border border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}
            />
            <span className="text-xs">Loading findings...</span>
          </div>

        /* Empty */
        ) : filteredFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>
              {currentStatus === 'completed'
                ? (severityFilter !== 'all' ? `No ${severityFilter} findings` : 'No findings for this scan')
                : 'Findings will appear when scan completes'}
            </p>
          </div>

        /* Table */
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Severity', 'Title', 'Tool', 'CVE', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-hover)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((finding, idx) => {
                  const cve = extractCVE(finding.evidence);
                  return (
                    <tr
                      key={finding.id}
                      className="cursor-pointer transition-colors group"
                      style={{ borderBottom: idx < filteredFindings.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      onClick={() => setSelectedFinding(finding)}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <FindingSeverityBadge severity={finding.severity} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {finding.title}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {finding.tool}
                      </td>
                      <td className="px-4 py-3">
                        {cve ? (
                          <span
                            className="px-2 py-0.5 rounded-sm text-xs"
                            style={{
                              color: 'var(--severity-info)',
                              backgroundColor: 'rgba(68,136,255,0.08)',
                              border: '1px solid rgba(68,136,255,0.2)',
                            }}
                          >
                            {cve}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <FindingStatusBadge status={finding.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedFinding(finding); }}
                          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--accent)' }}
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}