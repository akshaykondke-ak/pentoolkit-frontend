// src/components/scans/ScanProgressCard.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { useScanPolling, resolveProgress, getCurrentTool, ScanStatusResponse } from '@/lib/hooks/useScanPolling';
import ScanStatusBadge from './ScanStatusBadge';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

interface Props {
  scanId: string;
  initialStatus?: string;
  onComplete?: (scan: ScanStatusResponse) => void;
}

export default function ScanProgressCard({ scanId, initialStatus, onComplete }: Props) {
  const { status, scanData, error, isActive } = useScanPolling({
    scanId,
    intervalMs: 5000,
    onComplete,
  });

  const currentStatus = status ?? initialStatus ?? 'queued';
  const progressPct   = resolveProgress(scanData?.progress);
  const currentTool   = getCurrentTool(scanData?.progress);
  const tools         = scanData?.tools_used ?? [];

  return (
    <div
      className="rounded-sm p-4 transition-all"
      style={{
        ...mono,
        border: isActive
          ? '1px solid rgba(255,170,0,0.25)'
          : '1px solid var(--border-default)',
        backgroundColor: isActive ? 'var(--warn-dim)' : 'var(--bg-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {scanData?.target ?? 'Scan in progress'}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>
            {scanId}
          </p>
        </div>
        <ScanStatusBadge status={currentStatus} />
      </div>

      {/* Progress bar (active scans) */}
      {isActive && (
        <div className="mb-3">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 3, backgroundColor: 'var(--border-default)' }}
          >
            {progressPct !== undefined ? (
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: 'var(--warn)' }}
              />
            ) : (
              <div
                className="h-full rounded-full animate-pulse"
                style={{ width: '60%', backgroundColor: 'var(--warn)' }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            {currentTool && (
              <p className="text-xs" style={{ color: 'var(--warn)' }}>
                Running: <span className="font-bold">{currentTool}</span>
              </p>
            )}
            {progressPct !== undefined && (
              <p className="text-xs ml-auto" style={{ color: 'var(--warn)' }}>{progressPct}%</p>
            )}
          </div>
        </div>
      )}

      {/* Tools row */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tools.map(tool => {
            const active = currentTool === tool;
            return (
              <span
                key={tool}
                className="px-2 py-0.5 rounded-sm text-xs transition-colors"
                style={{
                  backgroundColor: active ? 'var(--warn-dim)' : 'var(--bg-hover)',
                  border: active ? '1px solid rgba(255,170,0,0.4)' : '1px solid var(--border-default)',
                  color: active ? 'var(--warn)' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {active && '▶ '}{tool}
              </span>
            );
          })}
        </div>
      )}

      {/* Completed stats */}
      {currentStatus === 'completed' && scanData && (
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          {scanData.findings_count !== undefined && (
            <span>
              <span style={{ color: 'var(--accent)' }}>{scanData.findings_count}</span> findings
            </span>
          )}
          {scanData.duration_seconds !== undefined && (
            <span>
              <span style={{ color: 'var(--text-secondary)' }}>{Math.round(scanData.duration_seconds)}s</span> duration
            </span>
          )}
          <Link
            href={`/dashboard/scans/${scanId}`}
            className="ml-auto text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            View →
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {/* Polling indicator */}
      {isActive && (
        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
          <span
            className="w-1.5 h-1.5 rounded-full animate-ping inline-block flex-shrink-0"
            style={{ backgroundColor: 'var(--warn)' }}
          />
          Polling every 5s...
        </p>
      )}
    </div>
  );
}