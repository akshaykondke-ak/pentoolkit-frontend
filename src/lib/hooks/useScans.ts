// src/lib/hooks/useScans.ts

'use client';

import { useState, useCallback } from 'react';
import { scansAPI, Scan, CreateScanRequest } from '@/lib/api/scans';

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all scans
  const fetchScans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await scansAPI.list();
      // Handle both array and object response formats
      const scansData = Array.isArray(response) ? response : response.scans || response || [];
      setScans(Array.isArray(scansData) ? scansData : []);
      return scansData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || 'Failed to fetch scans';
      setError(errorMessage);
      console.error('Fetch scans error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single scan
  const fetchScan = useCallback(async (scanId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await scansAPI.get(scanId);
      setSelectedScan(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch scan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new scan
  const createScan = useCallback(async (data: CreateScanRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await scansAPI.create(data);
      // Add new scan to list if response has scan data
      if (response && response.scan_id) {
        const newScan: Scan = {
          id: response.scan_id,
          target: response.target,
          status: response.status as any,
          tools_used: response.tools_used || [],
          findings_count: 0,
          started_at: response.started_at,
        };
        setScans((prev) => [newScan, ...prev]);
      }
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create scan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get scan status
  const getScanStatus = useCallback(async (scanId: string) => {
    try {
      const response = await scansAPI.getStatus(scanId);
      return response;
    } catch (err: any) {
      console.error('Failed to get scan status:', err);
      throw err;
    }
  }, []);

  // Delete scan
  const deleteScan = useCallback(async (scanId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await scansAPI.delete(scanId);
      // Remove from list
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete scan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    scans,
    selectedScan,
    isLoading,
    error,
    setError,
    fetchScans,
    fetchScan,
    createScan,
    getScanStatus,
    deleteScan,
  };
}