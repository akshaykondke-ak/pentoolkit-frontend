// src/lib/api/findings.ts
// src/lib/api/findings.ts
import apiClient from './client';

export interface ScanInfo {
  scan_id: string;
  target: string;
  scan_date: string;
  status: string;
}

export interface Finding {
  id: number;
  scan_id: string;
  tool: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  evidence: string | null;
  meta_info: unknown | null;
  // ✅ FIXED: updated to match exact backend values
  status: 'open' | 'fixed' | 'accepted_risk' | 'false_positive';
  notes: string | null;
  is_false_positive: boolean;
  created_at: string;
  updated_at: string | null;
  scan_info: ScanInfo;
}

export interface FindingsResponse {
  total: number;
  skip: number;
  limit: number;
  count: number;
  findings: Finding[];
}

export interface FindingsFilters {
  severity?: string;
  status?: string;
  scan_id?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface UpdateFindingPayload {
  status?: Finding['status'];
  notes?: string;
  is_false_positive?: boolean;
}

export const findingsAPI = {
  list: async (filters?: FindingsFilters): Promise<FindingsResponse> => {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status)   params.append('status',   filters.status);
    if (filters?.scan_id)  params.append('scan_id',  filters.scan_id);
    if (filters?.search)   params.append('search',   filters.search);
    if (filters?.skip  !== undefined) params.append('skip',  String(filters.skip));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/api/v1/findings${query}`);
    return response.data;
  },

  getByScan: async (scanId: string): Promise<Finding[]> => {
    const response = await apiClient.get(`/api/v1/scans/${scanId}/findings`);
    return response.data;
  },

  getById: async (id: number): Promise<Finding> => {
    const response = await apiClient.get(`/api/v1/findings/${id}`);
    return response.data;
  },

  update: async (id: number, payload: UpdateFindingPayload): Promise<Finding> => {
    const response = await apiClient.patch(`/api/v1/findings/${id}`, payload);
    return response.data;
  },
};

export function getHost(finding: Finding): string {
  return finding.scan_info?.target || '—';
}

export function extractCVE(evidence: string | null): string | null {
  if (!evidence) return null;
  const match = evidence.match(/CVE[:\s]+([A-Z0-9-]+)/i);
  return match ? `CVE-${match[1].replace(/^CVE-/i, '')}` : null;
}

export function formatDate(dateStr: string | null | undefined, short = false): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return short ? d.toLocaleDateString() : d.toLocaleString();
}


// import apiClient from './client';

// export interface ScanInfo {
//   scan_id: string;
//   target: string;
//   scan_date: string;
//   status: string;
// }

// export interface Finding {
//   id: number;
//   scan_id: string;
//   tool: string;
//   severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
//   title: string;
//   description: string;
//   evidence: string | null;
//   meta_info: unknown | null;
//   status: 'open' | 'confirmed' | 'false_positive' | 'resolved';
//   notes: string | null;
//   is_false_positive: boolean;
//   created_at: string;
//   updated_at: string | null;
//   scan_info: ScanInfo;
// }

// export interface FindingsResponse {
//   total: number;
//   skip: number;
//   limit: number;
//   count: number;
//   findings: Finding[];
// }

// export interface FindingsFilters {
//   severity?: string;
//   status?: string;
//   scan_id?: string;
//   search?: string;
//   skip?: number;
//   limit?: number;
// }

// export interface UpdateFindingPayload {
//   status?: Finding['status'];
//   notes?: string;
//   is_false_positive?: boolean;
// }

// export const findingsAPI = {
//   list: async (filters?: FindingsFilters): Promise<FindingsResponse> => {
//     const params = new URLSearchParams();
//     if (filters?.severity) params.append('severity', filters.severity);
//     if (filters?.status) params.append('status', filters.status);
//     if (filters?.scan_id) params.append('scan_id', filters.scan_id);
//     if (filters?.search) params.append('search', filters.search);
//     if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
//     if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

//     const query = params.toString() ? `?${params.toString()}` : '';
//     const response = await apiClient.get(`/api/v1/findings${query}`);
//     return response.data;
//   },

//   getByScan: async (scanId: string): Promise<Finding[]> => {
//     const response = await apiClient.get(`/api/v1/scans/${scanId}/findings`);
//     return response.data;
//   },

//   getById: async (id: number): Promise<Finding> => {
//     const response = await apiClient.get(`/api/v1/findings/${id}`);
//     return response.data;
//   },

//   update: async (id: number, payload: UpdateFindingPayload): Promise<Finding> => {
//     const response = await apiClient.patch(`/api/v1/findings/${id}`, payload);
//     return response.data;
//   },
// };

// // Helper: extract host from scan_info
// export function getHost(finding: Finding): string {
//   return finding.scan_info?.target || '—';
// }

// // Helper: extract CVE from evidence text (e.g. "CVE: 2021-25103")
// export function extractCVE(evidence: string | null): string | null {
//   if (!evidence) return null;
//   const match = evidence.match(/CVE[:\s]+([A-Z0-9-]+)/i);
//   return match ? `CVE-${match[1].replace(/^CVE-/i, '')}` : null;
// }

// // Helper: format date safely
// export function formatDate(dateStr: string | null | undefined, short = false): string {
//   if (!dateStr) return '—';
//   const d = new Date(dateStr);
//   if (isNaN(d.getTime())) return '—';
//   return short ? d.toLocaleDateString() : d.toLocaleString();
// }