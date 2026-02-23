// src/lib/api/scans.tsx

// import apiClient from './client';

// export interface Scan {
//   id: string;
//   target: string;
//   status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
//   tools_used: string[];
//   findings_count: number;
//   started_at: string;
//   completed_at?: string;
//   duration_seconds?: number;
// }

// export interface CreateScanRequest {
//   target: string;
//   tools_used: string[];
// }

// export interface ScanResponse {
//   message: string;
//   scan_id: string;
//   status: string;
//   target: string;
//   tools_used: string[];
//   started_at: string;
//   task_id: string;
// }

// export const scansAPI = {
//   // Get all scans
//   list: async (limit = 20, offset = 0) => {
//     const response = await apiClient.get('/api/v1/scans', {
//       params: { limit, offset },
//     });
//     return response.data;
//   },

//   // Get single scan
//   get: async (scanId: string) => {
//     const response = await apiClient.get(`/api/v1/scans/${scanId}`);
//     return response.data;
//   },

//   // Create new scan
//   create: async (data: CreateScanRequest) => {
//     const response = await apiClient.post('/api/v1/scans', data);
//     return response.data;
//   },

//   // Get scan status
//   getStatus: async (scanId: string) => {
//     const response = await apiClient.get(`/api/v1/scans/${scanId}/status`);
//     return response.data;
//   },

//   // Cancel scan
//   cancel: async (scanId: string) => {
//     const response = await apiClient.post(`/api/v1/scans/${scanId}/cancel`);
//     return response.data;
//   },

//   // Delete scan
//   delete: async (scanId: string) => {
//     const response = await apiClient.delete(`/api/v1/scans/${scanId}`);
//     return response.data;
//   },

//   // Get scan findings
//   getFindings: async (scanId: string) => {
//     const response = await apiClient.get(`/api/v1/scans/${scanId}/findings`);
//     return response.data;
//   },
// };

/**
 * src/lib/api/scans.ts
 *
 * API client functions for scan operations.
 *
 * Changes from original:
 *   - ScanOptions type is now derived from tools.ts (ToolOptionsMap).
 *     When a new tool is added to TOOLS, the type updates automatically.
 *     No more manual per-tool option types duplicated here.
 *   - Added: getScanToolsSchema() — fetches live option schema from backend
 *   - Everything else (createScan, getScan, listScans, etc.) unchanged
 */

import apiClient from '@/lib/api/client';
import {
  TOOLS,
  ToolOptionsMap,
  getTool,
  getToolDefaults,
  TOOL_IDS,
} from '@/lib/config/tools';

// ─────────────────────────────────────────────────────────────────────────────
// SCAN OPTIONS TYPE
// Derived from tools.ts — adding a tool to TOOLS auto-updates this type.
//
// Shape: { nmap?: { scan_type?: string }, wpscan?: { scan_mode?: string }, ... }
//
// Each tool's options object is optional (tool might not be selected).
// Each field within options is also optional (defaults apply if omitted).
// ─────────────────────────────────────────────────────────────────────────────

export type ScanOptions = ToolOptionsMap;

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST / RESPONSE SHAPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateScanRequest {
  target:   string;
  tools:    string[];
  options?: ScanOptions;
}

export interface ScanFinding {
  title:       string;
  description: string;
  severity:    'critical' | 'high' | 'medium' | 'low' | 'info';
  evidence?:   string;
  // tool-specific extra fields preserved
  [key: string]: unknown;
}

export interface ScanResultEntry {
  metadata: {
    tool:      string;
    target:    string;
    started?:  string;
    finished?: string;
    duration?: number;
    success:   boolean;
    error?:    string | null;
  };
  findings: ScanFinding[];
  raw?:     string;
}

export interface ScanResults {
  [toolId: string]: ScanResultEntry[];
}

export interface Scan {
  id:             string;
  scan_id?:       string;   // some backends return either field
  target:         string;
  tools:          string[];
  options?:       ScanOptions;
  status:         'pending' | 'running' | 'completed' | 'failed';
  created_at:     string;
  updated_at?:    string;
  finished_at?:   string;
  findings_count: number;
  results?:       ScanResults;
  errors?:        string[];
}

export interface ScanListItem {
  id:             string;
  target:         string;
  tools:          string[];
  status:         Scan['status'];
  created_at:     string;
  findings_count: number;
}

export interface PaginatedScans {
  items:   ScanListItem[];
  total:   number;
  page:    number;
  size:    number;
  pages:   number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL SCHEMA (from backend)
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolOptionChoice {
  value:         string;
  label:         string;
  desc:          string;
  time:          string;
  requires_root?: boolean;
}

export interface ToolOptionDefinition {
  type:     'select' | 'toggle' | 'number';
  default:  string | boolean | number;
  label?:   string;
  desc?:    string;
  choices?: ToolOptionChoice[];
  min?:     number;
  max?:     number;
}

export interface ToolSchema {
  tool_id:  string;
  label:    string;
  options:  Record<string, ToolOptionDefinition>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a complete options payload for a scan request.
 * Merges user-supplied values with defaults from tools.ts.
 * Only includes tools that are in the selected list.
 *
 * @param selectedTools  IDs of tools the user selected
 * @param userOptions    Options the user explicitly set
 * @param includeDefaults  If true, include all defaults (not just overrides).
 *                         Default: false (backend applies its own defaults)
 */
export function buildScanOptions(
  selectedTools:  string[],
  userOptions:    ScanOptions,
  includeDefaults = false,
): ScanOptions {
  const result: ScanOptions = {};

  for (const toolId of selectedTools) {
    const toolUserOpts = (userOptions as Record<string, Record<string, unknown>>)[toolId];

    if (includeDefaults) {
      const defaults = getToolDefaults(toolId);
      const merged   = { ...defaults, ...(toolUserOpts ?? {}) };
      if (Object.keys(merged).length > 0) {
        (result as Record<string, unknown>)[toolId] = merged;
      }
    } else {
      // Only send what the user explicitly changed
      if (toolUserOpts && Object.keys(toolUserOpts).length > 0) {
        (result as Record<string, unknown>)[toolId] = toolUserOpts;
      }
    }
  }

  return result;
}

/**
 * Validate scan options against the tools.ts schema.
 * Returns an array of validation error strings (empty = valid).
 */
export function validateScanOptions(
  tools:   string[],
  options: ScanOptions,
): string[] {
  const errors: string[] = [];

  for (const toolId of tools) {
    const tool    = getTool(toolId);
    const toolOpts = (options as Record<string, Record<string, unknown>>)[toolId];
    if (!tool || !toolOpts) continue;

    for (const [key, value] of Object.entries(toolOpts)) {
      const field = tool.fields.find(f => f.key === key);
      if (!field) {
        errors.push(`[${toolId}] Unknown option: ${key}`);
        continue;
      }

      if (field.type === 'select') {
        const valid = field.choices.some(c => c.value === value);
        if (!valid) {
          errors.push(
            `[${toolId}] Invalid value for ${key}: "${value}". ` +
            `Valid: ${field.choices.map(c => c.value).join(', ')}`
          );
        }
      }

      if (field.type === 'number') {
        const num = Number(value);
        if (isNaN(num))                  errors.push(`[${toolId}] ${key} must be a number`);
        else if (num < field.min)        errors.push(`[${toolId}] ${key} must be >= ${field.min}`);
        else if (num > field.max)        errors.push(`[${toolId}] ${key} must be <= ${field.max}`);
      }
    }
  }

  return errors;
}

/**
 * Check if any selected options require root privileges.
 * Returns tool+option pairs that need root.
 */
export function getRequiresRootWarnings(
  tools:   string[],
  options: ScanOptions,
): Array<{ toolId: string; fieldKey: string; value: string; note: string }> {
  const warnings: Array<{ toolId: string; fieldKey: string; value: string; note: string }> = [];

  for (const toolId of tools) {
    const tool     = getTool(toolId);
    const toolOpts = (options as Record<string, Record<string, unknown>>)[toolId];
    if (!tool || !toolOpts) continue;

    for (const field of tool.fields) {
      if (field.type !== 'select') continue;
      const value  = toolOpts[field.key] as string | undefined;
      if (!value) continue;
      const choice = field.choices.find(c => c.value === value);
      if (choice?.requiresNote) {
        warnings.push({
          toolId,
          fieldKey: field.key,
          value,
          note: choice.requiresNote,
        });
      }
    }
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new scan.
 */
export async function createScan(payload: CreateScanRequest): Promise<Scan> {
  const response = await apiClient.post<Scan>('/api/v1/scans', payload);
  return response.data;
}

/**
 * Get a scan by ID (includes results if completed).
 */
export async function getScan(scanId: string): Promise<Scan> {
  const response = await apiClient.get<Scan>(`/api/v1/scans/${scanId}`);
  return response.data;
}

/**
 * List scans with optional pagination.
 */
export async function listScans(params?: {
  page?:   number;
  size?:   number;
  status?: Scan['status'];
  target?: string;
}): Promise<PaginatedScans> {
  const response = await apiClient.get<PaginatedScans>('/api/v1/scans', { params });
  return response.data;
}

/**
 * Delete a scan by ID.
 */
export async function deleteScan(scanId: string): Promise<void> {
  await apiClient.delete(`/api/v1/scans/${scanId}`);
}

/**
 * Get the HTML report for a completed scan.
 */
export async function getScanReport(scanId: string): Promise<string> {
  const response = await apiClient.get<string>(
    `/api/v1/scans/${scanId}/report`,
    { responseType: 'text' }
  );
  return response.data;
}

/**
 * Get available tools and their option schemas from the backend.
 * The frontend tools.ts is the primary source; this is for runtime
 * validation or if the backend has tools not yet in tools.ts.
 */
export async function getScanToolsSchema(): Promise<ToolSchema[]> {
  const response = await apiClient.get<ToolSchema[]>('/api/v1/tools');
  return response.data;
}

/**
 * Get the option schema for a single tool from the backend.
 */
export async function getToolSchema(toolId: string): Promise<ToolSchema | null> {
  try {
    const response = await apiClient.get<ToolSchema>(`/api/v1/tools/${toolId}`);
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Poll a scan until it reaches a terminal status.
 *
 * @param scanId        ID of the scan to poll
 * @param onUpdate      Called each poll with the latest scan object
 * @param intervalMs    Polling interval in milliseconds (default 3000)
 * @param timeoutMs     Max time to poll before giving up (default 10 min)
 */
export async function pollScanUntilComplete(
  scanId:     string,
  onUpdate?:  (scan: Scan) => void,
  intervalMs  = 3000,
  timeoutMs   = 10 * 60 * 1000,
): Promise<Scan> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const scan = await getScan(scanId);
    onUpdate?.(scan);

    if (scan.status === 'completed' || scan.status === 'failed') {
      return scan;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Scan ${scanId} did not complete within ${timeoutMs / 1000}s`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export type Severity = ScanFinding['severity'];

export const SEVERITY_ORDER: Severity[] = [
  'critical', 'high', 'medium', 'low', 'info',
];

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'var(--severity-critical)',
  high:     'var(--severity-high)',
  medium:   'var(--severity-medium)',
  low:      'var(--severity-low)',
  info:     'var(--severity-info)',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
  info:     'Info',
};

/**
 * Count findings by severity across all tool results.
 */
export function countBySeverity(
  results: ScanResults,
): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  };

  for (const toolResults of Object.values(results)) {
    for (const entry of toolResults) {
      for (const finding of entry.findings) {
        const sev = finding.severity as Severity;
        if (sev in counts) counts[sev]++;
      }
    }
  }

  return counts;
}

/**
 * Get the highest severity finding across all results.
 * Returns null if there are no findings.
 */
export function getHighestSeverity(results: ScanResults): Severity | null {
  const counts = countBySeverity(results);
  for (const sev of SEVERITY_ORDER) {
    if (counts[sev] > 0) return sev;
  }
  return null;
}

/**
 * Flatten all findings from all tools into a single array,
 * sorted by severity (critical first).
 */
export function flattenFindings(results: ScanResults): Array<ScanFinding & { tool: string }> {
  const flat: Array<ScanFinding & { tool: string }> = [];

  for (const [toolId, toolResults] of Object.entries(results)) {
    for (const entry of toolResults) {
      for (const finding of entry.findings) {
        flat.push({ ...finding, tool: toolId });
      }
    }
  }

  flat.sort((a, b) => {
    return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
  });

  return flat;
}