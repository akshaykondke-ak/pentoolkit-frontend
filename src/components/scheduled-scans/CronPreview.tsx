// src/components/scheduled-scans/CronPreview.tsx
'use client';

import React from 'react';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// Client-side fallback descriptions for common patterns
const DESCRIPTIONS: Record<string, string> = {
  '0 * * * *':   'Every hour',
  '0 0 * * *':   'Every day at midnight',
  '0 9 * * *':   'Every day at 9:00 AM',
  '0 9 * * 1':   'Every Monday at 9:00 AM',
  '0 9 * * 5':   'Every Friday at 9:00 AM',
  '0 9 1 * *':   '1st of every month at 9:00 AM',
  '0 0 * * 1':   'Every Monday at midnight',
  '0 12 * * *':  'Every day at noon',
  '0 18 * * *':  'Every day at 6:00 PM',
  '30 9 * * 1-5':'Weekdays at 9:30 AM',
  '0 9 * * 0':   'Every Sunday at 9:00 AM',
  '0 0 1 * *':   '1st of every month at midnight',
};

function isValidCron(expr: string): boolean {
  if (!expr.trim()) return false;
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  // Basic sanity: each field must not be empty
  return parts.every(p => p.length > 0);
}

function describeLocal(expr: string): string {
  const known = DESCRIPTIONS[expr.trim()];
  if (known) return known;

  // Try to build a minimal description for simple patterns
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, , dow] = parts;

  const days: Record<string, string> = {
    '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
    '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
  };

  let time = '';
  if (min !== '*' && hour !== '*') {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    const mStr = m.toString().padStart(2, '0');
    time = ` at ${h12}:${mStr} ${ampm}`;
  }

  if (dow !== '*') {
    const dayName = days[dow] ?? `day ${dow}`;
    return `Every ${dayName}${time}`;
  }
  if (dom !== '*') {
    return `Day ${dom} of every month${time}`;
  }
  if (hour !== '*' && min !== '*') {
    return `Every day${time}`;
  }
  return expr;
}

interface Props {
  value: string;    // cron expression being typed
  className?: string;
}

export default function CronPreview({ value, className }: Props) {
  const trimmed = value.trim();

  if (!trimmed) {
    return (
      <div
        className={className}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 6,
          backgroundColor: 'var(--bg-hover)',
          border: '1px solid var(--border-default)',
          ...mono, fontSize: 11,
          color: 'var(--text-faint)',
        }}
      >
        <span>◷</span>
        <span>Enter a cron expression to preview schedule</span>
      </div>
    );
  }

  const valid = isValidCron(trimmed);

  if (!valid) {
    return (
      <div
        className={className}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 6,
          backgroundColor: 'var(--danger-dim)',
          border: '1px solid var(--danger-border)',
          ...mono, fontSize: 11,
          color: 'var(--danger)',
        }}
      >
        <span>✗</span>
        <span>Invalid cron expression — expected 5 fields (min hour dom month dow)</span>
      </div>
    );
  }

  const description = describeLocal(trimmed);

  return (
    <div
      className={className}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 6,
        backgroundColor: 'var(--accent-dim)',
        border: '1px solid var(--accent-border)',
        ...mono, fontSize: 11,
      }}
    >
      <span style={{ color: 'var(--accent)' }}>◷</span>
      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{description}</span>
    </div>
  );
}