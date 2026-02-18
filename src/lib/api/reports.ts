// src/lib/api/reports.ts
import apiClient from './client';

export type ExportFormat = 'pdf' | 'csv' | 'json' | 'html';

export interface ReportStatus {
  scan_id: string;
  report_ready: boolean;
  report_path: string | null;
  generated_at: string | null;
}

// Check if report is ready for a scan
export async function getReportStatus(scanId: string): Promise<ReportStatus> {
  const res = await apiClient.get(`/api/v1/scans/${scanId}/report/status`);
  return res.data;
}

// Download report (html/json) - opens as blob download
export async function downloadReport(scanId: string, format: 'html' | 'json' = 'html'): Promise<void> {
  const res = await apiClient.get(`/api/v1/scans/${scanId}/report`, {
    params: { format },
    responseType: 'blob',
  });
  const ext = format === 'html' ? 'html' : 'json';
  triggerDownload(res.data, `report_${scanId}.${ext}`, res.headers['content-type']);
}

// Export findings (pdf/csv/json)
export async function exportScan(scanId: string, format: ExportFormat): Promise<void> {
  const res = await apiClient.get(`/api/v1/scans/${scanId}/export`, {
    params: { format },
    responseType: 'blob',
  });
  // Use filename from content-disposition header if available
  const disposition = res.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename=([^\s;]+)/);
  const filename = match ? match[1] : `export_${scanId}.${format}`;
  triggerDownload(res.data, filename, res.headers['content-type']);
}

function triggerDownload(blob: Blob, filename: string, contentType?: string) {
  const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}