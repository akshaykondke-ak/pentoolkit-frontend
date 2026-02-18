// src/lib/api/scans.tsx

import apiClient from './client';

export interface Scan {
  id: string;
  target: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  tools_used: string[];
  findings_count: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface CreateScanRequest {
  target: string;
  tools_used: string[];
}

export interface ScanResponse {
  message: string;
  scan_id: string;
  status: string;
  target: string;
  tools_used: string[];
  started_at: string;
  task_id: string;
}

export const scansAPI = {
  // Get all scans
  list: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/api/v1/scans', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Get single scan
  get: async (scanId: string) => {
    const response = await apiClient.get(`/api/v1/scans/${scanId}`);
    return response.data;
  },

  // Create new scan
  create: async (data: CreateScanRequest) => {
    const response = await apiClient.post('/api/v1/scans', data);
    return response.data;
  },

  // Get scan status
  getStatus: async (scanId: string) => {
    const response = await apiClient.get(`/api/v1/scans/${scanId}/status`);
    return response.data;
  },

  // Cancel scan
  cancel: async (scanId: string) => {
    const response = await apiClient.post(`/api/v1/scans/${scanId}/cancel`);
    return response.data;
  },

  // Delete scan
  delete: async (scanId: string) => {
    const response = await apiClient.delete(`/api/v1/scans/${scanId}`);
    return response.data;
  },

  // Get scan findings
  getFindings: async (scanId: string) => {
    const response = await apiClient.get(`/api/v1/scans/${scanId}/findings`);
    return response.data;
  },
};