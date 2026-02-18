// src/components/scans/ScanProgressCard.tsx
'use client';
import React from 'react';
import { useScanPolling, resolveProgress, getCurrentTool, ScanStatusResponse } from '@/lib/hooks/useScanPolling';
import ScanStatusBadge from './ScanStatusBadge';

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
  const progressPct = resolveProgress(scanData?.progress);
  const currentTool = getCurrentTool(scanData?.progress);

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {scanData?.target ?? 'Scan in progress'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{scanId}</p>
        </div>
        <ScanStatusBadge status={currentStatus} />
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="mb-3">
          <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            {progressPct !== undefined ? (
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            ) : (
              <div className="h-full bg-blue-400 rounded-full animate-pulse w-1/2" />
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            {currentTool && (
              <p className="text-xs text-blue-600">Running: <span className="font-mono">{currentTool}</span></p>
            )}
            {progressPct !== undefined && (
              <p className="text-xs text-blue-500 ml-auto">{progressPct}%</p>
            )}
          </div>
        </div>
      )}

      {/* Tools */}
      {scanData?.tools_used && scanData.tools_used.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {scanData.tools_used.map(tool => (
            <span key={tool} className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
              currentTool === tool
                ? 'bg-blue-200 text-blue-800 font-semibold'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {currentTool === tool && '▶ '}{tool}
            </span>
          ))}
        </div>
      )}

      {/* Completed */}
      {currentStatus === 'completed' && scanData && (
        <div className="flex gap-4 text-xs text-gray-500">
          {scanData.findings_count !== undefined && (
            <span>🔍 <strong className="text-gray-700">{scanData.findings_count}</strong> findings</span>
          )}
          {scanData.duration_seconds !== undefined && (
            <span>⏱ {Math.round(scanData.duration_seconds)}s</span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {isActive && (
        <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping inline-block" />
          Polling every 5s...
        </p>
      )}
    </div>
  );
}