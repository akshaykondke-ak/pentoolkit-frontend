// src/components/scans/ScanForm.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

const AVAILABLE_TOOLS = [
  { id: 'nmap',    label: 'Nmap',     desc: 'Port scanning & service detection',    color: 'var(--severity-info)'     },
  { id: 'wpscan',  label: 'WPScan',   desc: 'WordPress vulnerability scanner',       color: 'var(--severity-high)'     },
  { id: 'tlsinfo', label: 'TLS Info', desc: 'SSL/TLS certificate analysis',          color: 'var(--accent)'            },
  { id: 'httpx',   label: 'HTTPX',    desc: 'HTTP probe & fingerprinting',           color: 'var(--severity-medium)'   },
  { id: 'nuclei',  label: 'Nuclei',   desc: 'Template-based vulnerability scanner', color: 'var(--severity-critical)' },
];

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  const axiosErr = err as any;
  if (axiosErr?.response?.data) {
    const data = axiosErr.response.data;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((e: any) => {
        const field = Array.isArray(e.loc) ? e.loc.join(' → ') : '';
        return field ? `${field}: ${e.msg}` : e.msg;
      }).join('\n');
    }
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data === 'string') return data;
  }
  if (err instanceof Error) return err.message;
  return 'Failed to create scan';
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: '2px',
};

export default function ScanForm() {
  const router = useRouter();
  const [target, setTarget]               = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['nmap']);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const toggleTool = (id: string) => {
    setSelectedTools(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!target.trim())           { setError('Please enter a target domain or IP'); return; }
    if (!selectedTools.length)    { setError('Please select at least one tool');    return; }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/scans', {
        target: target.trim(),
        tools: selectedTools,
      });
      const scanId = response.data?.scan_id ?? response.data?.id;
      router.push(scanId ? `/dashboard/scans/${scanId}` : '/dashboard/scans');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && target.trim() && selectedTools.length > 0;

  return (
    <div className="p-6 max-w-2xl" style={mono}>

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/scans"
          className="text-xs mb-4 inline-flex items-center gap-1 transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
        >
          ← Back to Scans
        </Link>
        <div className="flex items-center gap-2 mt-3 mb-1">
          <span style={{ color: 'var(--accent)' }} className="text-xs">$</span>
          <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>scans --new</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Scan</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Configure and launch a security scan</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Target Input ─────────────────────── */}
        <div className="p-5" style={card}>
          <label className="block text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Target <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>Domain name or IP address to scan</p>

          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs select-none"
              style={{ color: 'var(--text-faint)' }}
            >▸</span>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="example.com or 192.168.1.1"
              disabled={loading}
              autoFocus
              className="w-full pl-8 pr-4 py-2.5 text-sm rounded-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs mr-1" style={{ color: 'var(--text-faint)' }}>Quick:</span>
            {['localhost', '127.0.0.1'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setTarget(s)}
                className="px-2.5 py-1 text-xs rounded-sm transition-colors"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tool Selection ───────────────────── */}
        <div className="p-5" style={card}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tools <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <span
              className="text-xs px-2 py-0.5 rounded-sm"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
              }}
            >
              {selectedTools.length} selected
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>Select one or more scanning tools</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_TOOLS.map(tool => {
              const checked = selectedTools.includes(tool.id);
              return (
                <label
                  key={tool.id}
                  className="flex items-center gap-3 p-3.5 rounded-sm cursor-pointer transition-all select-none"
                  // style={{
                  //   backgroundColor: checked ? 'transparent' : 'var(--bg-hover)',
                  //   border: checked
                  //     ? `1px solid ${tool.color.replace('var(--', '').replace(')', '')}`
                  //       .replace(/var\(([^)]+)\)/, (_, v) => `var(${v})`) // keep as var
                  //     : '1px solid var(--border-default)',
                  //   // For checked border we'll use inline trick below
                  // }}
                  style={{
                    backgroundColor: checked ? 'var(--bg-hover)' : 'transparent',
                    border: `1px solid ${checked ? tool.color : 'var(--border-default)'}`,
                    borderRadius: '2px',
                  } as React.CSSProperties}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTool(tool.id)}
                    disabled={loading}
                    className="sr-only"
                  />
                  {/* Custom checkbox */}
                  <div
                    className="w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: checked ? tool.color : 'transparent',
                      border: `1px solid ${checked ? tool.color : 'var(--border-strong)'}`,
                    }}
                  >
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-bold"
                      style={{ color: checked ? tool.color : 'var(--text-secondary)' }}
                    >
                      {tool.label}
                    </p>
                    <p className="text-xs leading-tight" style={{ color: 'var(--text-faint)' }}>
                      {tool.desc}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Select all / clear */}
          <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
            <button
              type="button"
              onClick={() => setSelectedTools(AVAILABLE_TOOLS.map(t => t.id))}
              className="text-xs transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Select all
            </button>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <button
              type="button"
              onClick={() => setSelectedTools([])}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear all
            </button>
          </div>
        </div>

        {/* ── Scan Summary ─────────────────────── */}
        {target && selectedTools.length > 0 && (
          <div
            className="p-4 rounded-sm"
            style={{
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent)' }}>
              $ scan summary
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Running{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{selectedTools.join(', ')}</span>
              {' '}against{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{target}</span>
            </p>
          </div>
        )}

        {/* ── Error ────────────────────────────── */}
        {error && (
          <div
            className="px-4 py-3 rounded-sm"
            style={{
              backgroundColor: 'var(--danger-dim)',
              border: '1px solid var(--danger-border)',
            }}
          >
            <p className="text-xs font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--danger)' }}>
              <span>✗</span> Failed to create scan
            </p>
            <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--danger)' }}>{error}</pre>
          </div>
        )}

        {/* ── Actions ──────────────────────────── */}
        <div className="flex gap-3 pb-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-sm tracking-widest uppercase transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
            }}
            onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            {loading ? (
              <>
                <span
                  className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
                Starting...
              </>
            ) : (
              '→ Start Scan'
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard/scans')}
            disabled={loading}
            className="px-5 py-2.5 text-xs rounded-sm transition-colors disabled:opacity-40"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}