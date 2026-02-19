// src/components/findings/FindingDetailModal.tsx
'use client';
import React, { useState } from 'react';
import { Finding, extractCVE, formatDate } from '@/lib/api/findings';
import FindingSeverityBadge from './FindingSeverityBadge';
import FindingStatusBadge from './FindingStatusBadge';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

interface Props {
  finding: Finding;
  onClose: () => void;
  onStatusChange: (id: number, status: Finding['status']) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_OPTIONS: { value: Finding['status']; label: string }[] = [
  { value: 'open',           label: 'Open'           },
  { value: 'confirmed',      label: 'Confirmed'      },
  { value: 'false_positive', label: 'False Positive' },
  { value: 'resolved',       label: 'Resolved'       },
];

const STATUS_HOVER: Record<string, { color: string; bg: string; border: string }> = {
  open:           { color: 'var(--warn)',       bg: 'var(--warn-dim)',    border: 'rgba(255,170,0,0.3)'   },
  confirmed:      { color: 'var(--danger)',      bg: 'var(--danger-dim)', border: 'var(--danger-border)'  },
  false_positive: { color: 'var(--text-muted)',  bg: 'var(--bg-hover)',   border: 'var(--border-default)' },
  resolved:       { color: 'var(--accent)',      bg: 'var(--accent-dim)', border: 'var(--accent-border)'  },
};

export default function FindingDetailModal({ finding, onClose, onStatusChange }: Props) {
  const [updating, setUpdating]         = useState(false);
  const [currentStatus, setCurrentStatus] = useState(finding.status);
  const [statusError, setStatusError]   = useState<string | null>(null);
  const [saveOk, setSaveOk]             = useState(false);

  const cve  = extractCVE(finding.evidence);
  const host = finding.scan_info?.target || null;

  const handleStatusChange = async (newStatus: Finding['status']) => {
    if (updating || currentStatus === newStatus) return;
    setUpdating(true);
    setStatusError(null);
    setSaveOk(false);
    const result = await onStatusChange(finding.id, newStatus);
    if (result.success) {
      setCurrentStatus(newStatus);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } else {
      setStatusError(result.error || 'Failed to update status');
    }
    setUpdating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm"
        style={{
          ...mono,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ──────────────────────────────── */}
        <div
          className="px-6 py-5 flex items-start justify-between gap-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div className="flex-1 min-w-0">
            {/* Terminal breadcrumb */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
              <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>
                findings --detail
              </span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <FindingSeverityBadge severity={finding.severity} />
              <FindingStatusBadge   status={currentStatus} />
              {cve && (
                <span
                  className="px-2.5 py-1 rounded-sm text-xs"
                  style={{
                    color: 'var(--severity-info)',
                    backgroundColor: 'rgba(68,136,255,0.08)',
                    border: '1px solid rgba(68,136,255,0.2)',
                  }}
                >
                  {cve}
                </span>
              )}
              {finding.is_false_positive && (
                <span
                  className="px-2.5 py-1 rounded-sm text-xs"
                  style={{
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  False Positive
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {finding.title}
            </h2>

            {/* Sub-line: host · tool */}
            {(host || finding.tool) && (
              <p className="text-xs mt-1.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                {host && <span>{host}</span>}
                {host && finding.tool && <span style={{ color: 'var(--border-strong)' }}>·</span>}
                {finding.tool && <span>{finding.tool}</span>}
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Scan meta bar ────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-4 px-6 py-3 text-xs"
          style={{
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-hover)',
          }}
        >
          <span style={{ color: 'var(--text-faint)' }}>
            Scan:{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              ...{finding.scan_id?.slice(-14)}
            </span>
          </span>
          {finding.scan_info?.scan_date && (
            <span style={{ color: 'var(--text-faint)' }}>
              Scanned:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {formatDate(finding.scan_info.scan_date, true)}
              </span>
            </span>
          )}
          {finding.scan_info?.target && (
            <span style={{ color: 'var(--text-faint)' }}>
              Target:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{finding.scan_info.target}</span>
            </span>
          )}
        </div>

        {/* ── Body ────────────────────────────────── */}
        <div className="px-6 py-5 space-y-5">

          {/* Description */}
          {finding.description && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Description
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {finding.description}
              </p>
            </div>
          )}

          {/* Evidence */}
          {finding.evidence && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Evidence
              </p>
              <pre
                className="text-xs p-4 rounded-sm overflow-x-auto"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--accent)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.7,
                }}
              >
                {finding.evidence}
              </pre>
            </div>
          )}

          {/* Notes */}
          {finding.notes && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Notes
              </p>
              <p
                className="text-sm leading-relaxed p-3 rounded-sm"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {finding.notes}
              </p>
            </div>
          )}

          {/* ── Update Status ───────────────────────── */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Update Status
            </p>

            {statusError && (
              <div
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-sm mb-3"
                style={{
                  color: 'var(--danger)',
                  backgroundColor: 'var(--danger-dim)',
                  border: '1px solid var(--danger-border)',
                }}
              >
                <span>✗</span> {statusError}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => {
                const isActive = currentStatus === opt.value;
                const hcfg     = STATUS_HOVER[opt.value];
                return (
                  <button
                    key={opt.value}
                    disabled={updating}
                    onClick={() => handleStatusChange(opt.value)}
                    className="px-3 py-1.5 rounded-sm text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      isActive
                        ? { color: hcfg.color, backgroundColor: hcfg.bg, border: `1px solid ${hcfg.border}`, fontWeight: 700 }
                        : { color: 'var(--text-muted)', backgroundColor: 'transparent', border: '1px solid var(--border-default)' }
                    }
                    onMouseEnter={e => {
                      if (!isActive && !updating) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = hcfg.color;
                        el.style.backgroundColor = hcfg.bg;
                        el.style.borderColor = hcfg.border;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = 'var(--text-muted)';
                        el.style.backgroundColor = 'transparent';
                        el.style.borderColor = 'var(--border-default)';
                      }
                    }}
                  >
                    {updating && isActive ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 border border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: hcfg.color, borderTopColor: 'transparent' }}
                        />
                        Saving...
                      </span>
                    ) : opt.label}
                  </button>
                );
              })}
            </div>

            {saveOk && (
              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                <span>✓</span> Status updated
              </p>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────── */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border-default)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Created: {formatDate(finding.created_at)}
            {finding.updated_at && (
              <span> · Updated: {formatDate(finding.updated_at)}</span>
            )}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm text-xs transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}