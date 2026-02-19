// src/components/findings/FindingStatusBadge.tsx
import React from 'react';

type Status = 'open' | 'confirmed' | 'false_positive' | 'resolved';

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

const CFG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  open:           { label: 'Open',           color: 'var(--warn)',        bg: 'var(--warn-dim)',    border: 'rgba(255,170,0,0.3)'   },
  confirmed:      { label: 'Confirmed',      color: 'var(--danger)',      bg: 'var(--danger-dim)', border: 'var(--danger-border)'  },
  false_positive: { label: 'False Positive', color: 'var(--text-muted)',  bg: 'var(--bg-hover)',   border: 'var(--border-default)' },
  resolved:       { label: 'Resolved',       color: 'var(--accent)',      bg: 'var(--accent-dim)', border: 'var(--accent-border)'  },
};

export default function FindingStatusBadge({ status, size = 'md' }: Props) {
  const cfg = CFG[status] ?? CFG.open;
  const px  = size === 'sm' ? '6px'  : '10px';
  const py  = size === 'sm' ? '2px'  : '4px';
  const fs  = size === 'sm' ? '10px' : '11px';
  const dot = size === 'sm' ? 5      : 6;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm font-medium whitespace-nowrap"
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