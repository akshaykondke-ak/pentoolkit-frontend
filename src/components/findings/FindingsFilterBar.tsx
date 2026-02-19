// src/components/findings/FindingsFilterBar.tsx
'use client';
import React, { useState } from 'react';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

interface Props {
  onFilter: (filters: { severity?: string; status?: string; search?: string }) => void;
  onClear: () => void;
}

const selectStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-input, var(--bg-hover))',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  borderRadius: '2px',
  outline: 'none',
  ...mono,
};

export default function FindingsFilterBar({ onFilter, onClear }: Props) {
  const [severity, setSeverity] = useState('');
  const [status,   setStatus  ] = useState('');
  const [search,   setSearch  ] = useState('');

  const hasFilters = severity || status || search;

  const handleApply = () => {
    onFilter({
      severity: severity || undefined,
      status:   status   || undefined,
      search:   search   || undefined,
    });
  };

  const handleClear = () => {
    setSeverity('');
    setStatus('');
    setSearch('');
    onClear();
  };

  return (
    <div
      className="flex flex-wrap gap-3 items-end p-4 rounded-sm"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        ...mono,
      }}
    >
      {/* Search */}
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
          Search
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs select-none"
            style={{ color: 'var(--text-faint)' }}
          >▸</span>
          <input
            type="text"
            placeholder="Host, title, CVE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            className="w-full pl-7 pr-3 py-2 text-xs"
            style={{
              ...selectStyle,
              // placeholder handled via CSS — we'll override via inline
            }}
            onFocus={e  => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
            onBlur={e   => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
        </div>
      </div>

      {/* Severity */}
      <div className="w-36">
        <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
          Severity
        </label>
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          className="w-full px-3 py-2 text-xs"
          style={selectStyle}
          onFocus={e  => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onBlur={e   => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Status */}
      <div className="w-36">
        <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>
          Status
        </label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full px-3 py-2 text-xs"
          style={selectStyle}
          onFocus={e  => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onBlur={e   => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="confirmed">Confirmed</option>
          <option value="false_positive">False Positive</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-opacity hover:opacity-80"
          style={{
            color: 'var(--accent)',
            backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
          }}
        >
          Apply
        </button>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-xs rounded-sm transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}