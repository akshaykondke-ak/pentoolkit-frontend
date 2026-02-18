import apiClient from './client';

export interface DashboardData {
  user: {
    id: string;
    full_name: string;
    email: string;
    is_verified: boolean;
    role: string;
    created_at: string;
    last_login: string;
  };
  scan_stats: {
    total_scans: number;
    this_week: number;
    this_month: number;
    active_scans: number;
    completed_scans: number;
    failed_scans: number;
    pending_scans: number;
  };
  vulnerability_stats: {
    total_vulnerabilities: number;
    by_severity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    fixed_vulnerabilities: number;
    new_this_week: number;
  };
  recent_scans: {
    id: string;
    target: string;
    status: string;
    vulnerabilities_found: number;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
    tools_used: string[];
  }[];
  quick_insights: {
    most_common_vulnerability: string | null;
    most_scanned_domain: string | null;
    avg_scan_duration_minutes: number;
    security_score: number;
    trend: 'improving' | 'worsening' | 'stable';
  };
  activity_trend: {
    date: string;
    scans: number;
    vulnerabilities: number;
  }[];
}

export const dashboardAPI = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/api/v1/dashboard');
    return response.data;
  },

  getScanStats: async () => {
    const response = await apiClient.get('/api/v1/dashboard/scan-stats');
    return response.data;
  },

  getVulnerabilityStats: async () => {
    const response = await apiClient.get('/api/v1/dashboard/vulnerability-stats');
    return response.data;
  },

  getInsights: async () => {
    const response = await apiClient.get('/api/v1/dashboard/insights');
    return response.data;
  },
};