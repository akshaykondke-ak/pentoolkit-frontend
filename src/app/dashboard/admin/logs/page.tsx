'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id:          number;
  user_id:     string | null;
  user_email:  string | null;
  category:    string;
  action:      string;
  level:       'info' | 'warning' | 'error' | 'critical';
  method:      string | null;
  path:        string | null;
  status_code: number | null;
  duration_ms: number | null;
  ip_address:  string | null;
  detail:      Record<string, any> | null;
  message:     string | null;
  created_at:  string;
}

interface LogStats {
  total:        number;
  since_hours:  number;
  by_category:  Record<string, number>;
  by_level:     Record<string, number>;
  recent_errors: LogEntry[];
}

interface LogsResponse {
  total:  number;
  offset: number;
  limit:  number;
  logs:   LogEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const CATEGORIES = ['all', 'auth', 'scan', 'api', 'error', 'admin', 'notification'] as const;
const LEVELS     = ['all', 'info', 'warning', 'error', 'critical'] as const;
const PAGE_SIZE  = 50;

const LEVEL_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  info:     { color: 'var(--text-secondary)', bg: 'var(--bg-hover)',    border: 'var(--border-default)' },
  warning:  { color: 'var(--warn)',           bg: 'var(--warn-dim)',    border: 'rgba(240,165,0,0.25)'  },
  error:    { color: 'var(--danger)',         bg: 'var(--danger-dim)', border: 'var(--danger-border)'  },
  critical: { color: '#ff3366',               bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)' },
};

const CATEGORY_COLORS: Record<string, string> = {
  auth:         'var(--accent)',
  scan:         'var(--info)',
  api:          'var(--text-muted)',
  error:        'var(--danger)',
  admin:        'var(--warn)',
  notification: '#a78bfa',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Skel({ w = '100%', h = '12px' }: { w?: string; h?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: '3px',
      background: 'var(--bg-hover)',
      animation: 'logPulse 1.4s ease-in-out infinite',
    }} />
  );
}

function LevelBadge({ level }: { level: string }) {
  const c = LEVEL_COLORS[level] || LEVEL_COLORS.info;
  return (
    <span style={{
      ...mono, fontSize: '10px', fontWeight: 600,
      padding: '2px 6px', borderRadius: '3px',
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      flexShrink: 0,
    }}>
      {level}
    </span>
  );
}

function CategoryDot({ category }: { category: string }) {
  return (
    <span style={{
      ...mono, fontSize: '10px',
      color: CATEGORY_COLORS[category] || 'var(--text-muted)',
      fontWeight: 600, flexShrink: 0, minWidth: '80px',
    }}>
      {category}
    </span>
  );
}

// ─── Log row ──────────────────────────────────────────────────────────────────

function LogRow({ log, onClick }: { log: LogEntry; onClick: () => void }) {
  const c = LEVEL_COLORS[log.level] || LEVEL_COLORS.info;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '130px 70px 80px 1fr 120px 60px',
        gap: 12, alignItems: 'center',
        padding: '9px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background 0.1s',
        borderLeft: `2px solid ${log.level === 'info' ? 'transparent' : c.color}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Timestamp */}
      <div>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--text-secondary)' }}>
          {fmtTime(log.created_at)}
        </div>
        <div style={{ ...mono, fontSize: '10px', color: 'var(--text-faint)' }}>
          {fmtDate(log.created_at)}
        </div>
      </div>

      {/* Level */}
      <LevelBadge level={log.level} />

      {/* Category */}
      <CategoryDot category={log.category} />

      {/* Message */}
      <div style={{
        ...mono, fontSize: '11px', color: 'var(--text-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {log.message || log.action}
        {log.path && log.category === 'api' && (
          <span style={{ color: 'var(--text-faint)', marginLeft: 6 }}>
            {log.status_code}
          </span>
        )}
      </div>

      {/* User */}
      <div style={{
        ...mono, fontSize: '10px', color: 'var(--text-muted)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {log.user_email?.split('@')[0] || '—'}
      </div>

      {/* Duration */}
      <div style={{ ...mono, fontSize: '10px', color: 'var(--text-faint)', textAlign: 'right' }}>
        {log.duration_ms != null ? `${log.duration_ms}ms` : ''}
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '640px', maxHeight: '80vh',
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: '8px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LevelBadge level={log.level} />
            <span style={{ ...mono, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {log.action}
            </span>
          </div>
          <button onClick={onClose} style={{
            ...mono, fontSize: '16px', color: 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Key fields */}
          {[
            { label: 'Time',       value: new Date(log.created_at).toLocaleString() },
            { label: 'Category',   value: log.category },
            { label: 'User',       value: log.user_email || '—' },
            { label: 'IP',         value: log.ip_address || '—' },
            { label: 'Method',     value: log.method || '—' },
            { label: 'Path',       value: log.path || '—' },
            { label: 'Status',     value: log.status_code?.toString() || '—' },
            { label: 'Duration',   value: log.duration_ms != null ? `${log.duration_ms}ms` : '—' },
            { label: 'Message',    value: log.message || '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                ...mono, fontSize: '10px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                width: '70px', flexShrink: 0, paddingTop: '1px',
              }}>
                {row.label}
              </span>
              <span style={{ ...mono, fontSize: '11px', color: 'var(--text-primary)', flex: 1, wordBreak: 'break-all' }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Detail JSON */}
          {log.detail && (
            <div>
              <div style={{
                ...mono, fontSize: '10px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
              }}>
                Detail
              </div>
              <pre style={{
                ...mono, fontSize: '11px', color: 'var(--text-secondary)',
                background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                borderRadius: '5px', padding: '10px 12px',
                overflowX: 'auto', margin: 0,
                maxHeight: '240px', overflowY: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {JSON.stringify(log.detail, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: LogStats | null }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total',   value: stats.total,                          color: 'var(--text-secondary)' },
    { label: 'Errors',  value: (stats.by_level?.error ?? 0) + (stats.by_level?.critical ?? 0), color: 'var(--danger)' },
    { label: 'Warnings',value: stats.by_level?.warning ?? 0,         color: 'var(--warn)'   },
    { label: 'Auth',    value: stats.by_category?.auth ?? 0,         color: 'var(--accent)' },
    { label: 'Scans',   value: stats.by_category?.scan ?? 0,         color: 'var(--info)'   },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {cards.map(c => (
        <div key={c.label} style={{
          padding: '8px 14px', borderRadius: '6px',
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          textAlign: 'center', minWidth: '60px',
        }}>
          <div style={{ ...mono, fontSize: '16px', fontWeight: 700, color: c.color }}>{c.value}</div>
          <div style={{ ...mono, fontSize: '10px', color: 'var(--text-faint)' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLogsPage() {
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const [stats,        setStats]        = useState<LogStats | null>(null);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selected,     setSelected]     = useState<LogEntry | null>(null);
  const [autoRefresh,  setAutoRefresh]  = useState(false);

  // Filters
  const [category,    setCategory]    = useState('all');
  const [level,       setLevel]       = useState('all');
  const [search,      setSearch]      = useState('');
  const [sinceHours,  setSinceHours]  = useState(24);
  const [offset,      setOffset]      = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (resetOffset = false) => {
    setLoading(true);
    setError(null);
    const off = resetOffset ? 0 : offset;
    if (resetOffset) setOffset(0);

    try {
      const params: Record<string, any> = {
        limit:  PAGE_SIZE,
        offset: off,
        since_hours: sinceHours,
      };
      if (category    !== 'all') params.category    = category;
      if (level       !== 'all') params.level       = level;
      if (search.trim())         params.search      = search.trim();

      const [logsRes, statsRes] = await Promise.all([
        apiClient.get<LogsResponse>('/api/v1/admin/logs', { params }),
        apiClient.get<LogStats>('/api/v1/admin/logs/stats', { params: { since_hours: sinceHours } }),
      ]);

      setLogs(logsRes.data.logs);
      setTotal(logsRes.data.total);
      setStats(statsRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [category, level, search, sinceHours, offset]);

  useEffect(() => { fetchLogs(true); }, [category, level, sinceHours]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchLogs(), 10_000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <>
      <style>{`
        @keyframes logPulse { 0%,100%{opacity:.4} 50%{opacity:.75} }
      `}</style>

      <div style={{ padding: '24px', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ ...mono, margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Audit Logs
            </h1>
            <p style={{ ...mono, margin: '3px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              Every request, auth event, scan, and error — admin only.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(v => !v)}
              style={{
                ...mono, fontSize: '11px', padding: '6px 12px', borderRadius: '5px',
                border: '1px solid',
                borderColor:  autoRefresh ? 'var(--accent-border)' : 'var(--border-default)',
                background:   autoRefresh ? 'var(--accent-dim)'    : 'transparent',
                color:        autoRefresh ? 'var(--accent)'         : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {autoRefresh ? '⏸ Live' : '▶ Live'}
            </button>
            <button
              onClick={() => fetchLogs()}
              style={{
                ...mono, fontSize: '11px', padding: '6px 12px', borderRadius: '5px',
                border: '1px solid var(--border-default)', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <StatsBar stats={stats} />

        {/* ── Filters ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: '7px', padding: '12px 16px',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                ...mono, fontSize: '11px', padding: '4px 9px', borderRadius: '4px',
                border: '1px solid',
                borderColor: category === c ? (CATEGORY_COLORS[c] || 'var(--accent-border)') : 'var(--border-default)',
                background:  category === c ? `color-mix(in srgb, ${CATEGORY_COLORS[c] || 'var(--accent)'} 12%, transparent)` : 'transparent',
                color:       category === c ? (CATEGORY_COLORS[c] || 'var(--accent)') : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>
                {c}
              </button>
            ))}
          </div>

          {/* Level pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {LEVELS.map(l => {
              const lc = LEVEL_COLORS[l];
              return (
                <button key={l} onClick={() => setLevel(l)} style={{
                  ...mono, fontSize: '11px', padding: '4px 9px', borderRadius: '4px',
                  border: `1px solid ${level === l && lc ? lc.border : 'var(--border-default)'}`,
                  background:  level === l && lc ? lc.bg : 'transparent',
                  color:       level === l && lc ? lc.color : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>
                  {l}
                </button>
              );
            })}
          </div>

          {/* Time window */}
          <select
            value={sinceHours}
            onChange={e => setSinceHours(Number(e.target.value))}
            style={{
              ...mono, fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
              background: 'var(--bg-hover)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <option value={1}>Last 1h</option>
            <option value={6}>Last 6h</option>
            <option value={24}>Last 24h</option>
            <option value={72}>Last 3d</option>
            <option value={168}>Last 7d</option>
            <option value={720}>Last 30d</option>
          </select>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, flex: 1, minWidth: '200px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search messages..."
              style={{
                ...mono, fontSize: '11px', flex: 1, padding: '5px 10px',
                background: 'var(--bg-hover)', border: '1px solid var(--border-default)',
                borderRadius: '4px', color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <button type="submit" style={{
              ...mono, fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', cursor: 'pointer',
            }}>
              Search
            </button>
          </form>

          <span style={{ ...mono, fontSize: '10px', color: 'var(--text-faint)', marginLeft: 'auto' }}>
            {total.toLocaleString()} entries
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: '7px', overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px 70px 80px 1fr 120px 60px',
            gap: 12, padding: '8px 16px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-hover)',
          }}>
            {['Time', 'Level', 'Category', 'Message', 'User', 'ms'].map(h => (
              <span key={h} style={{
                ...mono, fontSize: '10px', fontWeight: 600,
                color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '130px 70px 80px 1fr 120px 60px',
                  gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <Skel w="80px" /><Skel w="50px" /><Skel w="60px" /><Skel /><Skel w="90px" /><Skel w="40px" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ ...mono, fontSize: '12px', color: 'var(--danger)' }}>✗ {error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ ...mono, fontSize: '12px', color: 'var(--text-faint)' }}>
                No log entries match your filters.
              </p>
            </div>
          ) : (
            logs.map(log => (
              <LogRow key={log.id} log={log} onClick={() => setSelected(log)} />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => { setOffset(Math.max(0, offset - PAGE_SIZE)); fetchLogs(); }}
              disabled={offset === 0}
              style={{
                ...mono, fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
                border: '1px solid var(--border-default)', background: 'transparent',
                color: 'var(--text-muted)', cursor: offset === 0 ? 'not-allowed' : 'pointer',
                opacity: offset === 0 ? 0.4 : 1,
              }}
            >
              ← Prev
            </button>
            <span style={{ ...mono, fontSize: '11px', color: 'var(--text-faint)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => { setOffset(offset + PAGE_SIZE); fetchLogs(); }}
              disabled={offset + PAGE_SIZE >= total}
              style={{
                ...mono, fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
                border: '1px solid var(--border-default)', background: 'transparent',
                color: 'var(--text-muted)', cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer',
                opacity: offset + PAGE_SIZE >= total ? 0.4 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && <DetailPanel log={selected} onClose={() => setSelected(null)} />}
    </>
  );
}