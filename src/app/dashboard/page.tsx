// // src/app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { dashboardAPI, DashboardData } from '@/lib/api/dashboard';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(secs: number | null): string {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
    completed: { color: 'var(--accent)',     bg: 'var(--accent-dim)',  border: 'var(--accent-border)', dot: 'var(--accent)',     label: 'Complete' },
    running:   { color: 'var(--warn)',       bg: 'var(--warn-dim)',    border: 'rgba(255,170,0,0.25)', dot: 'var(--warn)',       label: 'Running'  },
    failed:    { color: 'var(--danger)',     bg: 'var(--danger-dim)',  border: 'var(--danger-border)', dot: 'var(--danger)',     label: 'Failed'   },
    pending:   { color: 'var(--text-muted)', bg: 'var(--bg-hover)',   border: 'var(--border-default)', dot: 'var(--text-muted)', label: 'Pending'  },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs rounded-sm px-2 py-0.5"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-5 text-right" style={{ color: 'var(--text-muted)' }}>{value}</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  // Use actual hex for SVG stroke (CSS vars don't work in SVG stroke)
  const color     = score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--warn)' : 'var(--danger)';
  const strokeHex = score >= 80 ? '#00ff88'        : score >= 60 ? '#ffaa00'     : '#ff4444';
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border-default)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none"
          stroke={strokeHex} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="block text-[9px] -mt-0.5" style={{ color: 'var(--text-faint)' }}>/ 100</span>
      </div>
    </div>
  );
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

const card: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-card)',
  borderRadius: '2px',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    dashboardAPI.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setIsLoading(false));
  }, []);

  const vuln    = data?.vulnerability_stats;
  const scans   = data?.scan_stats;
  const insights = data?.quick_insights;
  const totalVuln = vuln?.total_vulnerabilities ?? 0;

  const severityConfig = [
    { key: 'critical' as const, label: 'Critical', color: 'var(--severity-critical)' },
    { key: 'high'     as const, label: 'High',     color: 'var(--severity-high)'     },
    { key: 'medium'   as const, label: 'Medium',   color: 'var(--severity-medium)'   },
    { key: 'low'      as const, label: 'Low',      color: 'var(--severity-low)'      },
    { key: 'info'     as const, label: 'Info',     color: 'var(--severity-info)'     },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]" style={mono}>
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-t-2 rounded-full animate-spin mb-3"
            style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent)' }} />
          <p className="text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5" style={mono}>

      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>dashboard --overview</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome back,{' '}
            <span style={{ color: 'var(--accent)' }}>{user?.full_name ?? data?.user.full_name}</span>
          </h1>
          <p className="text-xs mt-1 flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
            {scans?.active_scans
              ? <span style={{ color: 'var(--warn)' }}>⬤ {scans.active_scans} scan{scans.active_scans > 1 ? 's' : ''} running</span>
              : <span>No active scans</span>}
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </p>
        </div>
        {error && (
          <div className="text-xs px-3 py-2 rounded-sm"
            style={{ border: '1px solid var(--danger-border)', backgroundColor: 'var(--danger-dim)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Scans */}
        <div className="p-5" style={card}>
          <div className="text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Total Scans</div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{scans?.total_scans ?? '—'}</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>{scans?.this_month ?? 0} this month</div>
          <div className="h-px mb-2" style={{ backgroundColor: 'var(--border-default)' }} />
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Week</span>
            <span style={{ color: 'var(--text-secondary)' }}>{scans?.this_week ?? 0}</span>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="p-5" style={{ ...card, borderColor: 'var(--danger-border)' }}>
          <div className="text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Critical Issues</div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--danger)' }}>{vuln?.by_severity?.critical ?? '—'}</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>{vuln?.by_severity?.high ?? 0} high severity</div>
          <div className="h-px mb-2" style={{ backgroundColor: 'var(--border-default)' }} />
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>New / week</span>
            <span style={{ color: 'var(--danger)' }}>{vuln?.new_this_week ?? 0}</span>
          </div>
        </div>

        {/* Fixed */}
        <div className="p-5" style={{ ...card, borderColor: 'var(--accent-border)' }}>
          <div className="text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Fixed</div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent)' }}>{vuln?.fixed_vulnerabilities ?? '—'}</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>of {totalVuln} total</div>
          <div className="h-px mb-2" style={{ backgroundColor: 'var(--border-default)' }} />
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Fix rate</span>
            <span style={{ color: 'var(--accent)' }}>
              {totalVuln > 0 ? `${Math.round(((vuln?.fixed_vulnerabilities ?? 0) / totalVuln) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Security Score */}
        <div className="p-5" style={card}>
          <div className="text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Security Score</div>
          <div className="flex items-center gap-4">
            <ScoreRing score={Math.round(insights?.security_score ?? 0)} />
            <div>
              <div className="text-sm font-bold capitalize" style={{ color: 'var(--text-secondary)' }}>
                {insights?.trend ?? '—'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>trend</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Vuln Breakdown */}
        <div className="p-5" style={card}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Vuln Breakdown</span>
          </div>
          <div className="space-y-3">
            {severityConfig.map(({ key, label, color }) => (
              <div key={key}>
                <span className="text-xs font-medium block mb-1.5" style={{ color }}>{label}</span>
                <MiniBar value={vuln?.by_severity?.[key] ?? 0} max={totalVuln} color={color} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex justify-between text-xs"
            style={{ borderTop: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total</span>
            <span style={{ color: 'var(--text-secondary)' }}>{totalVuln}</span>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="p-5" style={card}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Quick Insights</span>
          </div>
          <div className="space-y-0">
            {[
              { label: 'Most common vuln',  value: insights?.most_common_vulnerability, accent: false },
              { label: 'Top target domain', value: insights?.most_scanned_domain,       accent: false },
              { label: 'Avg scan duration', value: insights?.avg_scan_duration_minutes
                  ? `${insights.avg_scan_duration_minutes.toFixed(1)}m` : null,           accent: false },
              { label: 'Scan success rate', value: scans && scans.total_scans > 0
                  ? `${Math.round((scans.completed_scans / scans.total_scans) * 100)}%`
                  : null,                                                                  accent: true  },
            ].map(({ label, value, accent }, i, arr) => (
              <div key={label}>
                <div className="py-3">
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div className="text-sm font-bold truncate"
                    style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {value ?? '—'}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scan Status */}
        <div className="p-5 flex flex-col" style={card}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Scan Status</span>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Completed', value: scans?.completed_scans, color: 'var(--accent)'  },
              { label: 'Active',    value: scans?.active_scans,    color: 'var(--warn)'    },
              { label: 'Pending',   value: scans?.pending_scans,   color: 'var(--info)'    },
              { label: 'Failed',    value: scans?.failed_scans,    color: 'var(--danger)'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                </div>
                <span className="text-xs font-bold" style={{ color }}>{value ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
            <Link href="/dashboard/scans/new"
              className="flex items-center justify-center gap-2 w-full text-xs py-2.5 rounded-sm font-bold tracking-wider transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
              }}>
              + New Scan
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Scans ────────────────────────── */}
      <div className="overflow-hidden" style={card}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Recent Scans</span>
          </div>
          <Link href="/dashboard/scans" className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}>
            View all →
          </Link>
        </div>

        {data?.recent_scans && data.recent_scans.length > 0 ? (
          <div>
            {data.recent_scans.map((scan, i) => (
              <Link key={scan.id} href={`/dashboard/scans/${scan.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{ borderBottom: i < data.recent_scans.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-1 h-7 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--border-strong)' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {scan.target}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {timeAgo(scan.started_at)}
                      {scan.tools_used?.length > 0 && (
                        <span style={{ color: 'var(--text-ghost)' }}> · {scan.tools_used.join(', ')}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  {scan.duration_seconds && (
                    <span className="text-xs hidden sm:block" style={{ color: 'var(--text-faint)' }}>
                      {formatDuration(scan.duration_seconds)}
                    </span>
                  )}
                  <StatusBadge status={scan.status} />
                  <span className="text-xs w-16 text-right" style={{ color: 'var(--text-muted)' }}>
                    {scan.vulnerabilities_found} found
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No scans yet</p>
            <Link href="/dashboard/scans/new" className="text-xs mt-2 inline-block hover:opacity-70"
              style={{ color: 'var(--accent)' }}>
              Run your first scan →
            </Link>
          </div>
        )}
      </div>

      {/* ── 7-Day Activity ──────────────────────── */}
      {data?.activity_trend && data.activity_trend.length > 0 && (
        <div className="p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
              <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>7-Day Activity</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {Math.round(data.activity_trend.reduce((a, d) => a + d.scans, 0) / data.activity_trend.length)} avg/day
            </span>
          </div>
          <div className="flex items-end gap-2" style={{ height: 60 }}>
            {data.activity_trend.map((day, i) => {
              const maxScans = Math.max(...data.activity_trend.map((d) => d.scans), 1);
              const pct = Math.round((day.scans / maxScans) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: 48 }}>
                    <div className="w-full rounded-sm"
                      style={{
                        height: `${Math.max(pct, 6)}%`,
                        backgroundColor: 'var(--accent-dim)',
                        border: '1px solid var(--accent-border)',
                      }} />
                  </div>
                  <span className="text-[9px]" style={{ color: 'var(--text-ghost)' }}>
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}




// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { useAuthStore } from '@/lib/store/authStore';
// import { dashboardAPI, DashboardData } from '@/lib/api/dashboard';

// function timeAgo(dateStr: string | null): string {
//   if (!dateStr) return '—';
//   const diff = Date.now() - new Date(dateStr).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1) return 'just now';
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }

// function formatDuration(secs: number | null): string {
//   if (!secs) return '—';
//   if (secs < 60) return `${secs}s`;
//   return `${Math.floor(secs / 60)}m ${secs % 60}s`;
// }

// function StatusBadge({ status }: { status: string }) {
//   const cfg: Record<string, { color: string; label: string; dot: string }> = {
//     completed: { color: 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/5', label: 'Complete', dot: '#00ff88' },
//     running:   { color: 'text-[#ffaa00] border-[#ffaa00]/30 bg-[#ffaa00]/5', label: 'Running',  dot: '#ffaa00' },
//     failed:    { color: 'text-red-400 border-red-900/40 bg-red-950/20',       label: 'Failed',   dot: '#f87171' },
//     pending:   { color: 'text-[#666] border-[#333] bg-[#111]',                label: 'Pending',  dot: '#666'    },
//   };
//   const c = cfg[status] ?? cfg.pending;
//   return (
//     <span className={`inline-flex items-center gap-1.5 text-xs border rounded-sm px-2 py-0.5 ${c.color}`}>
//       <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
//       {c.label}
//     </span>
//   );
// }

// function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
//   const pct = max > 0 ? Math.round((value / max) * 100) : 0;
//   return (
//     <div className="flex items-center gap-2">
//       <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
//         <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
//       </div>
//       <span className="text-[#555] text-xs w-6 text-right">{value}</span>
//     </div>
//   );
// }

// function ScoreRing({ score }: { score: number }) {
//   const r = 30;
//   const circ = 2 * Math.PI * r;
//   const dash = circ * (score / 100);
//   const color = score >= 80 ? '#00ff88' : score >= 60 ? '#ffaa00' : '#ff4444';
//   return (
//     <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
//       <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
//         <circle cx="40" cy="40" r={r} fill="none" stroke="#1a1a1a" strokeWidth="6" />
//         <circle
//           cx="40" cy="40" r={r} fill="none"
//           stroke={color} strokeWidth="6"
//           strokeDasharray={`${dash} ${circ}`}
//           strokeLinecap="round"
//           style={{ transition: 'stroke-dasharray 1s ease' }}
//         />
//       </svg>
//       <div className="absolute text-center">
//         <span className="text-lg font-bold" style={{ color }}>{score}</span>
//         <span className="block text-[9px] text-[#555] -mt-0.5">/ 100</span>
//       </div>
//     </div>
//   );
// }

// export default function DashboardPage() {
//   const { user } = useAuthStore();
//   const [data, setData] = useState<DashboardData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     dashboardAPI.getDashboard()
//       .then(setData)
//       .catch(() => setError('Failed to load dashboard data'))
//       .finally(() => setIsLoading(false));
//   }, []);

//   const vuln = data?.vulnerability_stats;
//   const scans = data?.scan_stats;
//   const insights = data?.quick_insights;
//   const totalVuln = vuln?.total_vulnerabilities ?? 0;

//   const severityConfig = [
//     { key: 'critical', label: 'Critical', color: '#ff4444' },
//     { key: 'high',     label: 'High',     color: '#ff8800' },
//     { key: 'medium',   label: 'Medium',   color: '#ffaa00' },
//     { key: 'low',      label: 'Low',      color: '#88cc00' },
//     { key: 'info',     label: 'Info',     color: '#4488ff' },
//   ] as const;

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-full min-h-[400px]">
//         <div className="text-center">
//           <div className="inline-block w-6 h-6 border border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin mb-3" />
//           <p className="text-[#444] text-xs tracking-wider">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>

//       {/* Header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <div className="flex items-center gap-2 mb-1">
//             <span className="text-[#00ff88] text-xs">$</span>
//             <span className="text-[#444] text-xs tracking-wider">dashboard --overview</span>
//           </div>
//           <h1 className="text-white text-2xl font-bold">
//             Welcome back, <span className="text-[#00ff88]">{user?.full_name ?? data?.user.full_name}</span>
//           </h1>
//           <p className="text-[#444] text-xs mt-1">
//             {scans?.active_scans
//               ? <span className="text-[#ffaa00]">⬤ {scans.active_scans} scan{scans.active_scans > 1 ? 's' : ''} running</span>
//               : <span>No active scans</span>}
//             <span className="text-[#2a2a2a] mx-2">|</span>
//             <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
//           </p>
//         </div>

//         {error && (
//           <div className="border border-red-900/50 bg-red-950/30 rounded-sm px-3 py-2 text-red-400 text-xs">{error}</div>
//         )}
//       </div>

//       {/* Top stat cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* Total Scans */}
//         <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-5">
//           <div className="text-[#555] text-xs tracking-wider uppercase mb-3">Total Scans</div>
//           <div className="text-3xl font-bold text-white mb-1">{scans?.total_scans ?? '—'}</div>
//           <div className="text-[#444] text-xs">{scans?.this_month ?? 0} this month</div>
//           <div className="mt-3 h-px bg-[#1a1a1a]" />
//           <div className="mt-2 flex justify-between text-xs">
//             <span className="text-[#555]">Week</span>
//             <span className="text-[#888]">{scans?.this_week ?? 0}</span>
//           </div>
//         </div>

//         {/* Critical Issues */}
//         <div className="border border-red-900/30 bg-[#0d0d0d] rounded-sm p-5">
//           <div className="text-[#555] text-xs tracking-wider uppercase mb-3">Critical Issues</div>
//           <div className="text-3xl font-bold text-red-400 mb-1">{vuln?.by_severity?.critical ?? '—'}</div>
//           <div className="text-[#444] text-xs">{vuln?.by_severity?.high ?? 0} high severity</div>
//           <div className="mt-3 h-px bg-[#1a1a1a]" />
//           <div className="mt-2 flex justify-between text-xs">
//             <span className="text-[#555]">New / week</span>
//             <span className="text-red-400/70">{vuln?.new_this_week ?? 0}</span>
//           </div>
//         </div>

//         {/* Fixed */}
//         <div className="border border-[#00ff88]/10 bg-[#0d0d0d] rounded-sm p-5">
//           <div className="text-[#555] text-xs tracking-wider uppercase mb-3">Fixed</div>
//           <div className="text-3xl font-bold text-[#00ff88] mb-1">{vuln?.fixed_vulnerabilities ?? '—'}</div>
//           <div className="text-[#444] text-xs">of {totalVuln} total</div>
//           <div className="mt-3 h-px bg-[#1a1a1a]" />
//           <div className="mt-2 flex justify-between text-xs">
//             <span className="text-[#555]">Fix rate</span>
//             <span className="text-[#00ff88]/70">
//               {totalVuln > 0 ? `${Math.round(((vuln?.fixed_vulnerabilities ?? 0) / totalVuln) * 100)}%` : '0%'}
//             </span>
//           </div>
//         </div>

//         {/* Security Score */}
//         <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-5">
//           <div className="text-[#555] text-xs tracking-wider uppercase mb-2">Security Score</div>
//           <div className="flex items-center gap-3">
//             <ScoreRing score={Math.round(insights?.security_score ?? 0)} />
//             <div>
//               <div className="text-[#444] text-xs capitalize">{insights?.trend ?? '—'}</div>
//               <div className="text-[#333] text-xs mt-1">trend</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Middle row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

//         {/* Vulnerability Breakdown */}
//         <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-5">
//           <div className="flex items-center gap-2 mb-4">
//             <span className="text-[#00ff88] text-xs">$</span>
//             <span className="text-[#555] text-xs tracking-wider uppercase">Vuln Breakdown</span>
//           </div>
//           <div className="space-y-3">
//             {severityConfig.map(({ key, label, color }) => (
//               <div key={key}>
//                 <div className="flex justify-between mb-1">
//                   <span className="text-xs" style={{ color }}>{label}</span>
//                 </div>
//                 <MiniBar
//                   value={vuln?.by_severity?.[key] ?? 0}
//                   max={totalVuln}
//                   color={color}
//                 />
//               </div>
//             ))}
//           </div>
//           <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex justify-between text-xs">
//             <span className="text-[#444]">Total</span>
//             <span className="text-[#888]">{totalVuln}</span>
//           </div>
//         </div>

//         {/* Quick Insights */}
//         <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-5">
//           <div className="flex items-center gap-2 mb-4">
//             <span className="text-[#00ff88] text-xs">$</span>
//             <span className="text-[#555] text-xs tracking-wider uppercase">Quick Insights</span>
//           </div>
//           <div className="space-y-4">
//             <div>
//               <div className="text-[#444] text-xs mb-1">Most common vuln</div>
//               <div className="text-[#e0e0e0] text-sm font-bold">{insights?.most_common_vulnerability ?? '—'}</div>
//             </div>
//             <div className="h-px bg-[#1a1a1a]" />
//             <div>
//               <div className="text-[#444] text-xs mb-1">Top target domain</div>
//               <div className="text-[#e0e0e0] text-sm font-bold truncate">{insights?.most_scanned_domain ?? '—'}</div>
//             </div>
//             <div className="h-px bg-[#1a1a1a]" />
//             <div>
//               <div className="text-[#444] text-xs mb-1">Avg scan duration</div>
//               <div className="text-[#e0e0e0] text-sm font-bold">{insights?.avg_scan_duration_minutes ? `${insights.avg_scan_duration_minutes.toFixed(1)}m` : '—'}</div>
//             </div>
//             <div className="h-px bg-[#1a1a1a]" />
//             <div>
//               <div className="text-[#444] text-xs mb-1">Scan success rate</div>
//               <div className="text-[#00ff88] text-sm font-bold">
//                 {scans && scans.total_scans > 0
//                   ? `${Math.round((scans.completed_scans / scans.total_scans) * 100)}%`
//                   : '—'}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Scan Stats breakdown */}
//         <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-5">
//           <div className="flex items-center gap-2 mb-4">
//             <span className="text-[#00ff88] text-xs">$</span>
//             <span className="text-[#555] text-xs tracking-wider uppercase">Scan Status</span>
//           </div>
//           <div className="space-y-3">
//             {[
//               { label: 'Completed', value: scans?.completed_scans, color: '#00ff88' },
//               { label: 'Active',    value: scans?.active_scans,    color: '#ffaa00' },
//               { label: 'Pending',   value: scans?.pending_scans,   color: '#4488ff' },
//               { label: 'Failed',    value: scans?.failed_scans,    color: '#ff4444' },
//             ].map(({ label, value, color }) => (
//               <div key={label} className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
//                   <span className="text-[#666] text-xs">{label}</span>
//                 </div>
//                 <span className="text-xs font-bold" style={{ color }}>{value ?? 0}</span>
//               </div>
//             ))}
//           </div>
//           <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
//             <Link
//               href="/dashboard/scans/new"
//               className="flex items-center justify-center gap-2 w-full bg-[#00ff88]/10 border border-[#00ff88]/20 hover:border-[#00ff88]/40 text-[#00ff88] text-xs py-2 rounded-sm transition-all"
//             >
//               + New Scan
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* Recent Scans */}
//       <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
//           <div className="flex items-center gap-2">
//             <span className="text-[#00ff88] text-xs">$</span>
//             <span className="text-[#555] text-xs tracking-wider uppercase">Recent Scans</span>
//           </div>
//           <Link href="/dashboard/scans" className="text-[#00ff88]/60 hover:text-[#00ff88] text-xs transition-colors">
//             View all →
//           </Link>
//         </div>

//         {data?.recent_scans && data.recent_scans.length > 0 ? (
//           <div className="divide-y divide-[#111]">
//             {data.recent_scans.map((scan) => (
//               <Link
//                 key={scan.id}
//                 href={`/dashboard/scans/${scan.id}`}
//                 className="flex items-center justify-between px-5 py-3.5 hover:bg-[#111] transition-colors group"
//               >
//                 <div className="flex items-center gap-4 min-w-0">
//                   <div className="w-1.5 h-8 rounded-full bg-[#1a1a1a] group-hover:bg-[#00ff88]/30 transition-colors flex-shrink-0" />
//                   <div className="min-w-0">
//                     <p className="text-[#e0e0e0] text-sm font-medium truncate">{scan.target}</p>
//                     <p className="text-[#444] text-xs mt-0.5">
//                       {timeAgo(scan.started_at)}
//                       {scan.tools_used?.length > 0 && (
//                         <span className="ml-2 text-[#333]">{scan.tools_used.join(', ')}</span>
//                       )}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-4 flex-shrink-0 ml-4">
//                   {scan.duration_seconds && (
//                     <span className="text-[#444] text-xs hidden sm:block">{formatDuration(scan.duration_seconds)}</span>
//                   )}
//                   <StatusBadge status={scan.status} />
//                   <span className="text-[#555] text-xs w-16 text-right">
//                     {scan.vulnerabilities_found} found
//                   </span>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         ) : (
//           <div className="px-5 py-10 text-center">
//             <p className="text-[#333] text-xs">No scans yet</p>
//             <Link href="/dashboard/scans/new" className="text-[#00ff88]/60 hover:text-[#00ff88] text-xs mt-2 inline-block transition-colors">
//               Run your first scan →
//             </Link>
//           </div>
//         )}
//       </div>

//       {/* Activity Trend (7 days) */}
//       {data?.activity_trend && data.activity_trend.length > 0 && (
//         <div className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-5">
//           <div className="flex items-center gap-2 mb-4">
//             <span className="text-[#00ff88] text-xs">$</span>
//             <span className="text-[#555] text-xs tracking-wider uppercase">7-Day Activity</span>
//           </div>
//           <div className="flex items-end gap-2 h-16">
//             {data.activity_trend.map((day, i) => {
//               const maxScans = Math.max(...data.activity_trend.map((d) => d.scans), 1);
//               const h = Math.round((day.scans / maxScans) * 100);
//               return (
//                 <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
//                   <div className="w-full relative flex items-end" style={{ height: 48 }}>
//                     <div
//                       className="w-full bg-[#00ff88]/20 group-hover:bg-[#00ff88]/40 rounded-sm transition-colors"
//                       style={{ height: `${Math.max(h, 4)}%` }}
//                     />
//                   </div>
//                   <span className="text-[#2a2a2a] text-[9px] group-hover:text-[#555] transition-colors">
//                     {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="flex justify-between text-xs mt-2 border-t border-[#111] pt-2">
//             <span className="text-[#333]">Scans / day</span>
//             <span className="text-[#444]">
//               {Math.round(data.activity_trend.reduce((a, d) => a + d.scans, 0) / data.activity_trend.length)} avg
//             </span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// 'use client';

// import StatCard from '@/components/dashboard/StatCard';
// import { useAuthStore } from '@/lib/store/authStore';

// export default function DashboardPage() {
//   const { user } = useAuthStore();

//   return (
//     <div className="space-y-8 p-6">
//       {/* Welcome Header */}
//       <div>
//         <h2 className="text-3xl font-bold text-gray-900">
//           Welcome back, {user?.full_name}! 👋
//         </h2>
//         <p className="mt-2 text-gray-600">
//           Here's what's happening with your security scans today.
//         </p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
//         <StatCard
//           icon="🔍"
//           label="Total Scans"
//           value="47"
//           subtext="Last 30 days"
//           bgColor="bg-blue-50"
//         />
//         <StatCard
//           icon="⚠️"
//           label="Critical Issues"
//           value="5"
//           subtext="Needs attention"
//           bgColor="bg-red-50"
//         />
//         <StatCard
//           icon="✅"
//           label="Fixed"
//           value="12"
//           subtext="This month"
//           bgColor="bg-green-50"
//         />
//         <StatCard
//           icon="📊"
//           label="Security Score"
//           value="78%"
//           subtext="Good"
//           bgColor="bg-yellow-50"
//         />
//       </div>

//       {/* Recent Activity */}
//       <div className="rounded-lg border border-gray-200 bg-white p-6">
//         <h3 className="mb-4 text-lg font-bold text-gray-900">Recent Scans</h3>
//         <div className="space-y-4">
//           {[1, 2, 3].map((i) => (
//             <div
//               key={i}
//               className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0"
//             >
//               <div>
//                 <p className="font-medium text-gray-900">example.com</p>
//                 <p className="text-sm text-gray-500">2 hours ago</p>
//               </div>
//               <div className="flex items-center gap-4">
//                 <span className="text-sm font-medium text-green-600">✓ Complete</span>
//                 <span className="text-sm text-gray-600">12 findings</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }