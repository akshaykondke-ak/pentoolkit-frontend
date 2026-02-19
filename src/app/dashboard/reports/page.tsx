// src/app/dashboard/reports/page.tsx
// src/app/dashboard/reports/page.tsx
// CHANGE: replaced plain header with hero banner matching the rest of the dashboard style
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { getReportStatus, downloadReport, exportScan, ReportStatus, ExportFormat } from '@/lib/api/reports';
import { formatDate } from '@/lib/api/findings';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: '2px',
};

interface Scan {
  id?: string;
  scan_id?: string;
  target: string;
  status: string;
  tools?: string[];
  tools_used?: string[];
  findings_count?: number;
  started_at: string;
  completed_at?: string;
}

interface ScanWithReport extends Scan {
  reportStatus?: ReportStatus;
  reportLoading?: boolean;
}

type DownloadingState = Record<string, boolean>;

const FORMAT_CFG: {
  key: ExportFormat | 'html';
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    key:    'html',
    label:  'HTML',
    desc:   'Interactive browser report',
    color:  'var(--severity-info)',
    bg:     'rgba(68,136,255,0.08)',
    border: 'rgba(68,136,255,0.2)',
  },
  {
    key:    'pdf',
    label:  'PDF',
    desc:   'Professional branded report',
    color:  'var(--severity-critical)',
    bg:     'var(--danger-dim)',
    border: 'var(--danger-border)',
  },
  {
    key:    'csv',
    label:  'CSV',
    desc:   'Excel-friendly findings',
    color:  'var(--severity-low)',
    bg:     'rgba(136,204,0,0.08)',
    border: 'rgba(136,204,0,0.2)',
  },
  {
    key:    'json',
    label:  'JSON',
    desc:   'Structured data export',
    color:  'var(--severity-medium)',
    bg:     'var(--warn-dim)',
    border: 'rgba(255,170,0,0.2)',
  },
];

export default function ReportsPage() {
  const [scans, setScans]             = useState<ScanWithReport[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [downloading, setDownloading] = useState<DownloadingState>({});
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getScanId = (scan: Scan) => scan.scan_id ?? scan.id ?? '';

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await apiClient.get('/api/v1/scans');
      const data = res.data;
      const list: Scan[] = Array.isArray(data) ? data : data?.scans ?? data?.items ?? [];
      const completed    = list.filter(s => s.status === 'completed');

      setScans(completed.map(s => ({ ...s, reportLoading: true })));

      const withStatus = await Promise.all(
        completed.map(async scan => {
          try {
            const reportStatus = await getReportStatus(getScanId(scan));
            return { ...scan, reportStatus, reportLoading: false };
          } catch {
            return { ...scan, reportStatus: undefined, reportLoading: false };
          }
        })
      );
      setScans(withStatus);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleDownload = async (scan: ScanWithReport, format: ExportFormat | 'html') => {
    const scanId = getScanId(scan);
    const key    = `${scanId}-${format}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      if (format === 'html') {
        await downloadReport(scanId, 'html');
      } else {
        await exportScan(scanId, format as ExportFormat);
      }
      showToast(`Downloaded ${format.toUpperCase()} for ${scan.target}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Download failed', 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  const isDownloading = (scanId: string, format: string) => downloading[`${scanId}-${format}`];

  const readyCount = scans.filter(s => s.reportStatus?.report_ready).length;

  return (
    <div className="p-6 space-y-5" style={mono}>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        {/* Accent top bar */}
        <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--accent)' }} />

        <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
              <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>reports --list</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Reports
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Export scan results as HTML, PDF, CSV, or JSON
            </p>
          </div>

          {/* Stat pills + refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              {
                label: 'Completed',
                value: loading ? '…' : scans.length,
                color: 'var(--text-secondary)',
              },
              {
                label: 'Ready',
                value: loading ? '…' : readyCount,
                color: 'var(--accent)',
              },
              {
                label: 'Pending',
                value: loading ? '…' : scans.length - readyCount,
                color: 'var(--text-muted)',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="text-center px-3 py-2 rounded-sm"
                style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="text-sm font-bold" style={{ color }}>{value}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{label}</div>
              </div>
            ))}

            <button
              onClick={fetchScans}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-sm transition-colors ml-1"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-hover)',
                border: '1px solid var(--border-default)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 6a5 5 0 105-.98" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M6 1v2.5L4.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Format legend ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FORMAT_CFG.map(f => (
          <div key={f.key} className="p-3 rounded-sm"
            style={{ backgroundColor: f.bg, border: `1px solid ${f.border}` }}>
            <p className="text-xs font-bold mb-0.5" style={{ color: f.color }}>{f.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-sm text-xs flex items-center gap-2"
          style={{ backgroundColor: 'var(--danger-dim)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          <span>✗</span> {error}
        </div>
      )}

      {/* ── Reports table ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-sm" style={card}>

        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Scan Reports
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2" style={{ color: 'var(--text-muted)' }}>
            <div className="w-5 h-5 border border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
            <span className="text-xs">Loading reports...</span>
          </div>

        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-sm flex items-center justify-center text-xl mb-4"
              style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}>
              📋
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
              No completed scans yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Reports are available for completed scans
            </p>
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Target', 'Tools', 'Findings', 'Scan Date', 'Report Status', 'Download'].map((h, i) => (
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
                  const scanId = getScanId(scan);
                  const ready  = scan.reportStatus?.report_ready ?? false;
                  const tools  = scan.tools ?? scan.tools_used ?? [];

                  return (
                    <tr
                      key={scanId}
                      className="transition-colors"
                      style={{ borderBottom: idx < scans.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Target */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{scan.target}</p>
                        {/* <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>...{scanId.slice(-14)}</p> */}
                      </td>

                      {/* Tools */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tools.length > 0 ? tools.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-sm"
                              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
                              {t}
                            </span>
                          )) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                        </div>
                      </td>

                      {/* Findings */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold"
                          style={{ color: (scan.findings_count ?? 0) > 0 ? 'var(--warn)' : 'var(--text-faint)' }}>
                          {scan.findings_count ?? '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(scan.started_at, true)}
                      </td>

                      {/* Report status */}
                      <td className="px-5 py-4">
                        {scan.reportLoading ? (
                          <div className="w-4 h-4 border border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
                        ) : ready ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium"
                              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                              Ready
                            </span>
                            {scan.reportStatus?.generated_at && (
                              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                                {formatDate(scan.reportStatus.generated_at, true)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs"
                            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                            Not generated
                          </span>
                        )}
                      </td>

                      {/* Download buttons */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {FORMAT_CFG.map(({ key, label, color, bg, border }) => {
                            const busy = isDownloading(scanId, key);
                            return (
                              <button
                                key={key}
                                onClick={() => handleDownload(scan, key)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-75"
                                style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
                              >
                                {busy ? (
                                  <span className="w-2.5 h-2.5 border border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: color, borderTopColor: 'transparent' }} />
                                ) : (
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M5 1v6M2 7l3 2 3-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                                {label}
                              </button>
                            );
                          })}
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

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-5 py-3 rounded-sm text-xs font-medium z-50 flex items-center gap-2"
          style={{
            ...mono,
            backgroundColor: toast.type === 'success' ? 'var(--accent-dim)' : 'var(--danger-dim)',
            border: `1px solid ${toast.type === 'success' ? 'var(--accent-border)' : 'var(--danger-border)'}`,
            color: toast.type === 'success' ? 'var(--accent)' : 'var(--danger)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <span>{toast.type === 'success' ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}