// src/app/dashboard/scans/[id]/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { useScanPolling } from '@/lib/hooks/useScanPolling';
import ScanStatusBadge from '@/components/scans/ScanStatusBadge';
import FindingSeverityBadge from '@/components/findings/FindingSeverityBadge';
import FindingStatusBadge from '@/components/findings/FindingStatusBadge';
import FindingDetailModal from '@/components/findings/FindingDetailModal';
import { Finding, getHost, extractCVE, formatDate } from '@/lib/api/findings';
import { findingsAPI } from '@/lib/api/findings';
import { resolveProgress } from '@/lib/hooks/useScanPolling';

interface ScanDetail {
  id?: string;
  scan_id?: string;
  target: string;
  status: string;
  tools_used: string[];
  findings_count?: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  progress?: number;
}

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [scanLoading, setScanLoading] = useState(true);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch scan details
  const fetchScan = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/v1/scans/${scanId}`);
      setScan(res.data);
    } catch {
      // fallback: try status endpoint
      try {
        const res = await apiClient.get(`/api/v1/scans/${scanId}/status`);
        setScan(res.data);
      } catch {
        // scan not found
      }
    } finally {
      setScanLoading(false);
    }
  }, [scanId]);

  // Fetch findings for this scan
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

  // Live polling while scan is active
  const isActive = scan?.status === 'running' || scan?.status === 'queued';
  const { status: liveStatus, scanData } = useScanPolling({
    scanId: isActive ? scanId : null,
    intervalMs: 5000,
    onComplete: () => {
      fetchScan();
      fetchFindings();
    },
  });

  const currentStatus = liveStatus ?? scan?.status ?? 'queued';
//   const currentProgress = scanData?.progress ?? scan?.progress;
  const currentProgress = resolveProgress(scanData?.progress ?? scan?.progress);

  // Severity counts
  const severityCounts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiClient.post(`/api/v1/scans/${scanId}/cancel`);
      fetchScan();
    } catch { }
    setCancelling(false);
  };

  const handleStatusChange = async (id: number, status: Finding['status']) => {
    try {
      const updated = await findingsAPI.update(id, { status });
      setFindings(prev => prev.map(f => f.id === updated.id ? updated : f));
      if (selectedFinding?.id === id) {
        setSelectedFinding(prev => prev ? { ...prev, status } : null);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  if (scanLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading scan...</span>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <div className="text-5xl mb-3">🔍</div>
        <p className="font-medium text-gray-600">Scan not found</p>
        <Link href="/dashboard/scans" className="mt-3 text-sm text-blue-600 hover:underline">
          ← Back to scans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back nav */}
      <div>
        <Link href="/dashboard/scans" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← Back to Scans
        </Link>
      </div>

      {/* Scan Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{scan.target}</h1>
              <ScanStatusBadge status={currentStatus} />
            </div>
            <p className="text-xs text-gray-400 font-mono">{scanId}</p>
          </div>
          {(currentStatus === 'running' || currentStatus === 'queued') && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : '✕ Cancel Scan'}
            </button>
          )}
        </div>

        {/* Progress bar for active scans */}
        {(currentStatus === 'running' || currentStatus === 'queued') && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping inline-block" />
                Scan in progress — polling every 5s
              </span>
              {currentProgress !== undefined && <span>{currentProgress}%</span>}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              {currentProgress !== undefined ? (
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${currentProgress}%` }}
                />
              ) : (
                <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
              )}
            </div>
          </div>
        )}

        {/* Scan meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tools</p>
            <div className="flex flex-wrap gap-1">
              {(scan.tools_used ?? []).map(t => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Started</p>
            <p className="text-sm text-gray-700">{formatDate(scan.started_at, true)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Duration</p>
            <p className="text-sm text-gray-700">
              {scan.duration_seconds ? `${Math.round(scan.duration_seconds)}s` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Findings</p>
            <p className="text-sm font-semibold text-gray-900">
              {findingsLoading ? '...' : findings.length}
            </p>
          </div>
        </div>
      </div>

      {/* Severity Summary (only when complete and has findings) */}
      {findings.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {(['critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
            const count = severityCounts[sev] ?? 0;
            const colors: Record<string, string> = {
              critical: 'bg-red-50 border-red-200 text-red-700',
              high:     'bg-orange-50 border-orange-200 text-orange-700',
              medium:   'bg-yellow-50 border-yellow-200 text-yellow-700',
              low:      'bg-blue-50 border-blue-200 text-blue-700',
              info:     'bg-gray-50 border-gray-200 text-gray-600',
            };
            return (
              <div key={sev} className={`rounded-xl border p-4 text-center ${colors[sev]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium capitalize mt-0.5">{sev}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Findings Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">
            Findings {!findingsLoading && `(${findings.length})`}
          </h2>
          <button
            onClick={fetchFindings}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            ↻ Refresh
          </button>
        </div>

        {findingsLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading findings...
          </div>
        ) : findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-4xl mb-2">
              {currentStatus === 'completed' ? '✅' : '⏳'}
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {currentStatus === 'completed' ? 'No findings for this scan' : 'Findings will appear when scan completes'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Severity</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tool</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">CVE</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {findings.map(finding => (
                  <tr
                    key={finding.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedFinding(finding)}
                  >
                    <td className="px-4 py-3">
                      <FindingSeverityBadge severity={finding.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{finding.title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{finding.tool}</td>
                    <td className="px-4 py-3">
                      {extractCVE(finding.evidence) ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-mono">
                          {extractCVE(finding.evidence)}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <FindingStatusBadge status={finding.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedFinding(finding); }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
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