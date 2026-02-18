// src/app/dashboard/reports/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { getReportStatus, downloadReport, exportScan, ReportStatus, ExportFormat } from '@/lib/api/reports';
import { formatDate } from '@/lib/api/findings';

interface Scan {
  id?: string;
  scan_id?: string;
  target: string;
  status: string;
  tools_used: string[];
  findings_count?: number;
  started_at: string;
  completed_at?: string;
}

interface ScanWithReport extends Scan {
  reportStatus?: ReportStatus;
  reportLoading?: boolean;
}

type DownloadingState = Record<string, boolean>;

export default function ReportsPage() {
  const [scans, setScans] = useState<ScanWithReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<DownloadingState>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getScanId = (scan: Scan) => scan.scan_id ?? scan.id ?? '';

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/v1/scans');
      const data = res.data;
      const list: Scan[] = Array.isArray(data) ? data : data?.scans ?? data?.items ?? [];
      // Only show completed scans on reports page
      const completed = list.filter(s => s.status === 'completed');
      setScans(completed.map(s => ({ ...s, reportLoading: true })));

      // Fetch report status for each scan in parallel
      const withStatus = await Promise.all(
        completed.map(async (scan) => {
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
    const key = `${scanId}-${format}`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${scans.length} completed scan${scans.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={fetchScans}
          className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Export format legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex flex-wrap gap-6 text-sm text-blue-800">
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <span><strong>HTML</strong> — Full interactive report (browser viewable)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">📕</span>
          <span><strong>PDF</strong> — Professional branded report</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span><strong>CSV</strong> — Excel-friendly findings export</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">🔧</span>
          <span><strong>JSON</strong> — Structured data export</span>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading reports...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium text-gray-600">No completed scans yet</p>
            <p className="text-sm mt-1">Reports are available for completed scans</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Target</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Tools</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Findings</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Scan Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Report Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scans.map(scan => {
                  const scanId = getScanId(scan);
                  const ready = scan.reportStatus?.report_ready ?? false;
                  const formats: { key: ExportFormat | 'html'; label: string; icon: string }[] = [
                    { key: 'html', label: 'HTML', icon: '📄' },
                    { key: 'pdf',  label: 'PDF',  icon: '📕' },
                    { key: 'csv',  label: 'CSV',  icon: '📊' },
                    { key: 'json', label: 'JSON', icon: '🔧' },
                  ];

                  return (
                    <tr key={scanId} className="hover:bg-gray-50 transition-colors">
                      {/* Target */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 font-mono">{scan.target}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{scanId}</p>
                      </td>

                      {/* Tools */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(scan.tools_used ?? []).map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{t}</span>
                          ))}
                        </div>
                      </td>

                      {/* Findings count */}
                      <td className="px-5 py-4 text-gray-700 font-semibold">
                        {scan.findings_count ?? '—'}
                      </td>

                      {/* Scan date */}
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {formatDate(scan.started_at, true)}
                      </td>

                      {/* Report status */}
                      <td className="px-5 py-4">
                        {scan.reportLoading ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        ) : ready ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              Ready
                            </span>
                            {scan.reportStatus?.generated_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(scan.reportStatus.generated_at, true)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            Not generated
                          </span>
                        )}
                      </td>

                      {/* Download buttons */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {formats.map(({ key, label, icon }) => {
                            const busy = isDownloading(scanId, key);
                            return (
                              <button
                                key={key}
                                onClick={() => handleDownload(scan, key)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {busy ? (
                                  <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span>{icon}</span>
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

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
}