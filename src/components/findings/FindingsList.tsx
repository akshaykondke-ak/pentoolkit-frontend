// src/components/findings/FindingsList.tsx
'use client';
import React, { useState, useMemo } from 'react';
import { useFindings } from '@/lib/hooks/useFindings';
import { Finding, getHost, extractCVE, formatDate } from '@/lib/api/findings';
import FindingSeverityBadge from './FindingSeverityBadge';
import FindingStatusBadge from './FindingStatusBadge';
import FindingsFilterBar from './FindingsFilterBar';
import FindingDetailModal from './FindingDetailModal';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: '2px',
};

type SeverityTab = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info';

const TABS: { key: SeverityTab; label: string; color: string; bg: string; border: string }[] = [
  { key: 'all',      label: 'All',      color: 'var(--text-primary)',      bg: 'var(--bg-hover)',          border: 'var(--border-default)' },
  { key: 'critical', label: 'Critical', color: 'var(--severity-critical)', bg: 'var(--danger-dim)',         border: 'var(--danger-border)'  },
  { key: 'high',     label: 'High',     color: 'var(--severity-high)',     bg: 'rgba(255,136,0,0.08)',      border: 'rgba(255,136,0,0.2)'   },
  { key: 'medium',   label: 'Medium',   color: 'var(--severity-medium)',   bg: 'var(--warn-dim)',           border: 'rgba(255,170,0,0.2)'   },
  { key: 'low',      label: 'Low',      color: 'var(--severity-low)',      bg: 'rgba(136,204,0,0.08)',      border: 'rgba(136,204,0,0.2)'   },
  { key: 'info',     label: 'Info',     color: 'var(--severity-info)',     bg: 'rgba(68,136,255,0.08)',     border: 'rgba(68,136,255,0.2)'  },
];

export default function FindingsList() {
  const { findings, loading, error, total, fetchFindings, updateFinding, applyFilters, clearFilters } = useFindings();
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeTab, setActiveTab] = useState<SeverityTab>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: findings.length, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach(f => { if (c[f.severity] !== undefined) c[f.severity]++; });
    return c;
  }, [findings]);

  const visibleFindings = useMemo(() =>
    activeTab === 'all' ? findings : findings.filter(f => f.severity === activeTab),
    [findings, activeTab]
  );

  const handleStatusChange = async (id: number, status: Finding['status']) => {
    const result = await updateFinding(id, { status });
    if (result.success && selectedFinding?.id === id) {
      setSelectedFinding(prev => prev ? { ...prev, status } : null);
    }
    return result;
  };

  return (
    <div className="p-6 space-y-5" style={mono}>

      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>findings --list</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${total} finding${total !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button
          onClick={() => fetchFindings()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors"
          style={{
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6a5 5 0 105-.98" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M6 1v2.5L4.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Severity summary cards ──────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count    = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="p-4 text-left rounded-sm transition-all"
              style={{
                backgroundColor: isActive ? tab.bg : 'var(--bg-card)',
                border: `1px solid ${isActive ? tab.color : 'var(--border-default)'}`,
                outline: 'none',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = tab.color; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: isActive ? tab.color : 'var(--text-primary)' }}>
                {loading ? '—' : count}
              </div>
              <div className="text-xs uppercase tracking-wider" style={{ color: isActive ? tab.color : 'var(--text-faint)' }}>
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ──────────────────────────── */}
      <FindingsFilterBar
        onFilter={f => { applyFilters(f); setActiveTab('all'); }}
        onClear={()  => { clearFilters();  setActiveTab('all'); }}
      />

      {/* ── Error ───────────────────────────────── */}
      {error && (
        <div
          className="px-4 py-3 rounded-sm text-xs flex items-center gap-2"
          style={{
            backgroundColor: 'var(--danger-dim)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
          }}
        >
          <span>✗</span> {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────── */}
      <div className="overflow-hidden rounded-sm" style={card}>

        {/* Table sub-header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              {loading
                ? 'Loading...'
                : `${visibleFindings.length} finding${visibleFindings.length !== 1 ? 's' : ''}${activeTab !== 'all' ? ` · ${activeTab}` : ''}`}
            </span>
          </div>
          {activeTab !== 'all' && (
            <button
              onClick={() => setActiveTab('all')}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
            >
              ✕ Clear filter
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-5 h-5 border border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}
            />
            <span className="text-xs">Loading findings...</span>
          </div>

        /* Empty */
        ) : visibleFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-12 h-12 rounded-sm flex items-center justify-center text-xl mb-4"
              style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
            >
              {activeTab === 'all' ? '🛡' : '✓'}
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
              {activeTab === 'all' ? 'No findings found' : `No ${activeTab} findings`}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {activeTab === 'all'
                ? 'Run a scan to discover vulnerabilities'
                : 'Nothing at this severity level'}
            </p>
          </div>

        /* Table rows */
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Severity', 'Title', 'Target', 'Tool', 'CVE', 'Status', 'Date', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-hover)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFindings.map((finding, idx) => {
                  const cve = extractCVE(finding.evidence);
                  return (
                    <tr
                      key={finding.id}
                      className="cursor-pointer transition-colors group"
                      style={{
                        borderBottom: idx < visibleFindings.length - 1
                          ? '1px solid var(--border-subtle)'
                          : 'none',
                      }}
                      onClick={() => setSelectedFinding(finding)}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Severity */}
                      <td className="px-4 py-3">
                        <FindingSeverityBadge severity={finding.severity} size="sm" />
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <span
                          className="font-medium block truncate"
                          style={{ color: 'var(--text-primary)' }}
                          title={finding.title}
                        >
                          {finding.title}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {getHost(finding)}
                      </td>

                      {/* Tool */}
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {finding.tool || '—'}
                      </td>

                      {/* CVE */}
                      <td className="px-4 py-3">
                        {cve ? (
                          <span
                            className="px-2 py-0.5 rounded-sm"
                            style={{
                              color: 'var(--severity-info)',
                              backgroundColor: 'rgba(68,136,255,0.08)',
                              border: '1px solid rgba(68,136,255,0.2)',
                            }}
                          >
                            {cve}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <FindingStatusBadge status={finding.status} size="sm" />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                        {formatDate(finding.created_at, true)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedFinding(finding); }}
                          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                          style={{ color: 'var(--accent)' }}
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}