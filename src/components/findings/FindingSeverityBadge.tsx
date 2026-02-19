// src/components/findings/FindingSeverityBadge.tsx
import React from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface Props {
  severity: Severity;
  size?: 'sm' | 'md';
}

const CFG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'var(--severity-critical)', bg: 'var(--danger-dim)',          border: 'var(--danger-border)'        },
  high:     { label: 'High',     color: 'var(--severity-high)',     bg: 'rgba(255,136,0,0.08)',        border: 'rgba(255,136,0,0.2)'         },
  medium:   { label: 'Medium',   color: 'var(--severity-medium)',   bg: 'var(--warn-dim)',             border: 'rgba(255,170,0,0.2)'         },
  low:      { label: 'Low',      color: 'var(--severity-low)',      bg: 'rgba(136,204,0,0.08)',        border: 'rgba(136,204,0,0.2)'         },
  info:     { label: 'Info',     color: 'var(--severity-info)',     bg: 'rgba(68,136,255,0.08)',       border: 'rgba(68,136,255,0.2)'        },
};

export default function FindingSeverityBadge({ severity, size = 'md' }: Props) {
  const cfg = CFG[severity] ?? CFG.info;
  const px  = size === 'sm' ? '6px'  : '10px';
  const py  = size === 'sm' ? '2px'  : '4px';
  const fs  = size === 'sm' ? '10px' : '11px';
  const dot = size === 'sm' ? 5      : 6;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm font-bold uppercase tracking-wider whitespace-nowrap"
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        padding: `${py} ${px}`,
        fontSize: fs,
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{ width: dot, height: dot, backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}