// src/lib/hooks/useScanPolling.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../api/client';

export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScanProgress {
  current_tool?: string;
  completed_tools?: number;
  total_tools?: number;
  percent?: number;
}

export interface ScanStatusResponse {
  scan_id: string;
  status: ScanStatus;
  target: string;
  tools_used: string[];
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  findings_count?: number;
  // progress can be a number (0-100) OR an object from the backend
  progress?: number | ScanProgress | null;
}

// Helper: always return a 0-100 number or undefined
export function resolveProgress(progress: ScanStatusResponse['progress']): number | undefined {
  if (progress === null || progress === undefined) return undefined;
  if (typeof progress === 'number') return progress;
  if (typeof progress === 'object') {
    // { percent: 45 }
    if (typeof progress.percent === 'number') return progress.percent;
    // { completed_tools: 2, total_tools: 4 }
    if (typeof progress.completed_tools === 'number' && typeof progress.total_tools === 'number' && progress.total_tools > 0) {
      return Math.round((progress.completed_tools / progress.total_tools) * 100);
    }
  }
  return undefined;
}

// Helper: get current tool name if available
export function getCurrentTool(progress: ScanStatusResponse['progress']): string | undefined {
  if (progress && typeof progress === 'object') {
    return (progress as ScanProgress).current_tool ?? undefined;
  }
  return undefined;
}

interface UseScanPollingOptions {
  scanId: string | null;
  intervalMs?: number;
  onComplete?: (scan: ScanStatusResponse) => void;
  onFailed?: (scan: ScanStatusResponse) => void;
}

export function useScanPolling({ scanId, intervalMs = 5000, onComplete, onFailed }: UseScanPollingOptions) {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [scanData, setScanData] = useState<ScanStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    activeRef.current = false;
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!scanId) return;
    try {
      const response = await apiClient.get(`/api/v1/scans/${scanId}/status`);
      const data: ScanStatusResponse = response.data;
      setStatus(data.status);
      setScanData(data);
      setError(null);
      if (data.status === 'completed') { stopPolling(); onComplete?.(data); }
      else if (data.status === 'failed' || data.status === 'cancelled') { stopPolling(); onFailed?.(data); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scan status');
    }
  }, [scanId, onComplete, onFailed, stopPolling]);

  const startPolling = useCallback(() => {
    if (activeRef.current || !scanId) return;
    activeRef.current = true;
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, intervalMs);
  }, [scanId, intervalMs, fetchStatus]);

  useEffect(() => {
    if (scanId) startPolling();
    return () => stopPolling();
  }, [scanId]);

  return {
    status,
    scanData,
    error,
    isPolling: activeRef.current,
    isActive: status === 'queued' || status === 'running',
    startPolling,
    stopPolling,
    fetchStatus,
  };
}