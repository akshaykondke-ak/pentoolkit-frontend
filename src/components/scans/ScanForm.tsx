// // src/components/scans/ScanForm.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import {
  TOOLS,
  getTool,
  getToolDefaults,
  ToolDefinition,
  ToolOptionField,
  SelectField,
  ToggleField,
  NumberField,
} from '@/lib/config/tools';

const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" };

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HELPER
// ─────────────────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  const e = err as any;
  if (e?.response?.data) {
    const d = e.response.data;
    if (Array.isArray(d?.detail))
      return d.detail
        .map((x: any) => {
          const field = Array.isArray(x.loc) ? x.loc.join(' → ') : '';
          return field ? `${field}: ${x.msg}` : x.msg;
        })
        .join('\n');
    if (typeof d?.detail === 'string') return d.detail;
    if (typeof d?.message === 'string') return d.message;
    if (typeof d === 'string') return d;
  }
  if (err instanceof Error) return err.message;
  return 'Failed to create scan';
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

function SelectFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: SelectField;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <p style={{ ...mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        {field.label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {field.choices.map(choice => {
          const selected = value === choice.value;
          return (
            <div
              key={choice.value}
              onClick={() => onChange(choice.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 3,
                border: `1px solid ${selected ? 'var(--border-strong)' : 'var(--border-default)'}`,
                background: selected ? 'var(--bg-hover)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {/* Radio dot */}
              <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {choice.label}
                  </span>
                  {choice.requiresNote && (
                    <span style={{
                      ...mono, fontSize: 9, padding: '1px 5px', borderRadius: 2,
                      color: 'var(--warn)', background: 'var(--warn-dim)',
                      border: '1px solid rgba(255,170,0,0.2)',
                    }}>
                      {choice.requiresNote}
                    </span>
                  )}
                  <span style={{ ...mono, fontSize: 10, color: 'var(--text-faint)' }}>{choice.desc}</span>
                </div>
              </div>

              {/* Time badge */}
              <span style={{
                ...mono, fontSize: 10, padding: '2px 8px', borderRadius: 2, flexShrink: 0, marginLeft: 'auto',
                color: 'var(--text-faint)', background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
              }}>
                {choice.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ToggleField;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{field.label}</p>
        <p style={{ ...mono, fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{field.desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          position: 'relative', width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
          background: value ? 'var(--accent-dim)' : 'var(--bg-base)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2,
          left: value ? 'calc(100% - 16px)' : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: value ? 'var(--accent)' : 'var(--border-strong)',
          transition: 'all 0.2s',
        }} />
      </button>
    </div>
  );
}

function NumberFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: NumberField;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{field.label}</p>
        <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{value}</span>
      </div>
      <p style={{ ...mono, fontSize: 10, color: 'var(--text-faint)', marginBottom: 10 }}>{field.desc}</p>
      <input
        type="range"
        min={field.min}
        max={field.max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', ...mono, fontSize: 10, color: 'var(--text-faint)', marginTop: 6 }}>
        <span>{field.min}</span>
        <span>{field.max}</span>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ToolOptionField;
  value: any;
  onChange: (key: string, val: any) => void;
}) {
  if (field.type === 'select')
    return <SelectFieldRenderer field={field} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'toggle')
    return <ToggleFieldRenderer field={field} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'number')
    return <NumberFieldRenderer field={field} value={value} onChange={v => onChange(field.key, v)} />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NON-DEFAULT OPTION BADGES
// ─────────────────────────────────────────────────────────────────────────────

function OptionBadges({ tool, options }: { tool: ToolDefinition; options: Record<string, any> }) {
  const nonDefaults = tool.fields.filter(f => options[f.key] !== undefined && options[f.key] !== f.default);
  if (!nonDefaults.length) return null;
  return (
    <>
      {nonDefaults.map(f => {
        const val = options[f.key];
        const display = f.type === 'toggle' ? (val ? f.label : `no ${f.label}`) : String(val);
        return (
          <span key={f.key} style={{
            ...mono, fontSize: 10, padding: '2px 7px', borderRadius: 2,
            color: 'var(--accent)', background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
          }}>
            {display}
          </span>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScanForm() {
  const router = useRouter();

  const [target, setTarget]           = useState('');
  const [selectedTools, setSelected]  = useState<string[]>([]);
  const [options, setOptions]         = useState<Record<string, Record<string, any>>>({});
  const [activePanel, setActivePanel] = useState<string | null>(null); // accordion
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ── Tool toggle ──────────────────────────────────────────────────────────
  const toggleTool = (id: string) => {
    if (selectedTools.includes(id)) {
      // Deselect — clear options + close panel
      setSelected(prev => prev.filter(t => t !== id));
      setOptions(prev => { const c = { ...prev }; delete c[id]; return c; });
      if (activePanel === id) setActivePanel(null);
    } else {
      // Select — open this panel, close others (accordion)
      setSelected(prev => [...prev, id]);
      setActivePanel(id);
    }
  };

  // ── Panel header click — accordion: open this, close others ─────────────
  const togglePanel = (id: string) => {
    setActivePanel(prev => (prev === id ? null : id));
  };

  // ── Field change ─────────────────────────────────────────────────────────
  const handleFieldChange = (toolId: string, key: string, val: any) => {
    setOptions(prev => ({
      ...prev,
      [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val },
    }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!target.trim())        { setError('Please enter a target domain or IP.'); return; }
    if (!selectedTools.length) { setError('Please select at least one tool.');    return; }

    setLoading(true);
    try {
      const filteredOptions: Record<string, any> = {};
      for (const toolId of selectedTools) {
        const toolOpts = options[toolId];
        if (toolOpts && Object.keys(toolOpts).length > 0) filteredOptions[toolId] = toolOpts;
      }
      const response = await apiClient.post('/api/v1/scans', {
        target: target.trim(),
        tools:  selectedTools,
        ...(Object.keys(filteredOptions).length > 0 ? { options: filteredOptions } : {}),
      });
      const scanId = response.data?.scan_id ?? response.data?.id;
      router.push(scanId ? `/dashboard/scans/${scanId}` : '/dashboard/scans');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && !!target.trim() && selectedTools.length > 0;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-card)',
      }}>
        <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
          pen<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>toolkit</span>
        </span>
        <Link href="/dashboard/scans" style={{ ...mono, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← scans
        </Link>
      </div>

      {/* ── Hero: centered target input ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px 0', textAlign: 'center' }}>
        <p style={{ ...mono, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
          New Scan
        </p>
        <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 8 }}>
          Where do we{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>probe?</span>
        </h1>
        <p style={{ ...mono, fontSize: 12, color: 'var(--text-muted)', marginBottom: 36 }}>
          Enter a target, pick your tools, launch.
        </p>

        {/* Target input box */}
        <div style={{ width: '100%', maxWidth: 620 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 6,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}>
            <span style={{ ...mono, fontSize: 16, color: 'var(--accent)', padding: '0 12px 0 18px', userSelect: 'none' }}>▸</span>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="example.com  or  192.168.1.1"
              disabled={loading}
              autoFocus
              style={{
                ...mono, flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, color: 'var(--text-primary)', padding: '17px 0',
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                ...mono, margin: 7, padding: '10px 20px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 4,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--accent)', cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: canSubmit ? 1 : 0.35,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Starting…' : 'Launch →'}
            </button>
          </div>

          {/* Quick fills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 10, color: 'var(--text-faint)' }}>try:</span>
            {['localhost', '127.0.0.1'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setTarget(s)}
                style={{
                  ...mono, fontSize: 11, color: 'var(--text-muted)',
                  background: 'transparent', border: '1px solid var(--border-default)',
                  borderRadius: 3, padding: '3px 10px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p style={{ ...mono, fontSize: 11, color: 'var(--danger)', marginTop: 10 }}>✗ {error}</p>
          )}
        </div>
      </div>

      {/* ── Tools section ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '52px auto 120px', padding: '0 24px' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ ...mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Select tools
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => setSelected(TOOLS.map(t => t.id))}
              style={{ ...mono, fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              select all
            </button>
            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>·</span>
            <button type="button" onClick={() => { setSelected([]); setOptions({}); setActivePanel(null); }}
              style={{ ...mono, fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              clear
            </button>
          </div>
        </div>

        {/* Tool chips grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 8, marginBottom: 8 }}>
          {TOOLS.map(tool => {
            const isSelected = selectedTools.includes(tool.id);
            return (
              <div
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '13px 15px',
                  background: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? tool.color + '33' : 'var(--border-default)'}`,
                  borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 15, height: 15, borderRadius: 2, flexShrink: 0, marginTop: 1,
                  border: `1px solid ${isSelected ? tool.color : 'var(--border-strong)'}`,
                  background: isSelected ? tool.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isSelected && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {/* Info */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: isSelected ? tool.color : 'var(--text-secondary)', marginBottom: 2 }}>
                    {tool.label}
                  </p>
                  <p style={{ ...mono, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.5 }}>{tool.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Accordion: one config panel at a time */}
        {selectedTools.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {TOOLS.filter(t => selectedTools.includes(t.id)).map(tool => {
              const isOpen = activePanel === tool.id;
              const opts   = options[tool.id] ?? {};

              return (
                <div
                  key={tool.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isOpen ? tool.color + '44' : 'var(--border-default)'}`,
                    borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.15s',
                  }}
                >
                  {/* Panel header — click to accordion-open */}
                  <div
                    onClick={() => togglePanel(tool.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: isOpen ? '1px solid var(--border-default)' : 'none',
                      cursor: 'pointer', transition: 'background 0.12s',
                      background: isOpen ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: tool.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: tool.color }}>{tool.label}</p>
                        <p style={{ ...mono, fontSize: 10, color: 'var(--text-faint)' }}>{tool.desc}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <OptionBadges tool={tool} options={opts} />
                      <span style={{
                        ...mono, fontSize: 10, color: 'var(--text-faint)',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      }}>▾</span>
                    </div>
                  </div>

                  {/* Panel body — only rendered when open */}
                  {isOpen && (
                    <div style={{ padding: '20px 20px 24px' }}>
                      {tool.fields.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                          {tool.fields.map((field, i) => (
                            <div key={field.key}>
                              {i > 0 && <div style={{ borderTop: '1px solid var(--border-default)', marginBottom: 20 }} />}
                              <FieldRenderer
                                field={field}
                                value={opts[field.key] ?? field.default}
                                onChange={(key, val) => handleFieldChange(tool.id, key, val)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ ...mono, fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                          No configurable options — runs with defaults.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sticky bottom bar ─────────────────────────────────────────────── */}
      {(target.trim() || selectedTools.length > 0) && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(8,8,8,0.92)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border-default)',
          padding: '14px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ ...mono, fontSize: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{target || '—'}</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {selectedTools.length > 0 ? selectedTools.join(', ') : 'no tools selected'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/scans')}
              style={{
                ...mono, padding: '10px 16px', background: 'transparent',
                border: '1px solid var(--border-default)', borderRadius: 3,
                fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                ...mono, padding: '10px 24px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 3,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--accent)', cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: canSubmit ? 1 : 0.35, transition: 'all 0.15s',
              }}
            >
              {loading ? 'Starting…' : '→ Start Scan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 'use client';
// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import apiClient from '@/lib/api/client';
// import {
//   TOOLS,
//   getTool,
//   getToolDefaults,
//   ToolDefinition,
//   ToolOptionField,
//   SelectField,
//   ToggleField,
//   NumberField,
// } from '@/lib/config/tools';

// const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// // ─────────────────────────────────────────────────────────────────────────────
// // ERROR HELPER
// // ─────────────────────────────────────────────────────────────────────────────

// function extractErrorMessage(err: unknown): string {
//   if (!err) return 'An unknown error occurred';
//   const e = err as any;
//   if (e?.response?.data) {
//     const d = e.response.data;
//     if (Array.isArray(d?.detail))
//       return d.detail.map((x: any) => {
//         const field = Array.isArray(x.loc) ? x.loc.join(' → ') : '';
//         return field ? `${field}: ${x.msg}` : x.msg;
//       }).join('\n');
//     if (typeof d?.detail  === 'string') return d.detail;
//     if (typeof d?.message === 'string') return d.message;
//     if (typeof d          === 'string') return d;
//   }
//   if (err instanceof Error) return err.message;
//   return 'Failed to create scan';
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // GENERIC FIELD RENDERER
// // Reads ToolOptionField definition → renders the right control.
// // Adding a new field type = add a case here + define it in tools.ts.
// // ─────────────────────────────────────────────────────────────────────────────

// function FieldRenderer({
//   field,
//   value,
//   onChange,
// }: {
//   field:    ToolOptionField;
//   value:    any;
//   onChange: (key: string, val: any) => void;
// }) {
//   if (field.type === 'select') {
//     const f = field as SelectField;
//     return (
//       <div>
//         <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
//           {f.label}
//         </p>
//         <div className="flex flex-col gap-1.5">
//           {f.choices.map(choice => {
//             const selected = value === choice.value;
//             return (
//               <label
//                 key={choice.value}
//                 className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-all"
//                 style={{
//                   backgroundColor: selected ? 'var(--bg-hover)' : 'transparent',
//                   border: `1px solid ${selected ? 'var(--border-strong)' : 'var(--border-default)'}`,
//                 }}
//                 onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
//                 onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
//               >
//                 {/* Radio dot */}
//                 <div
//                   className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}` }}
//                 >
//                   {selected && (
//                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
//                   )}
//                 </div>
//                 <input
//                   type="radio"
//                   name={f.key}
//                   value={choice.value}
//                   checked={selected}
//                   onChange={() => onChange(f.key, choice.value)}
//                   className="sr-only"
//                 />
//                 {/* Text */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <span className="text-xs font-bold" style={{ color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
//                       {choice.label}
//                     </span>
//                     {choice.requiresNote && (
//                       <span
//                         className="text-xs px-1.5 py-0.5 rounded-sm"
//                         style={{
//                           fontSize: 10,
//                           color: 'var(--warn)',
//                           backgroundColor: 'var(--warn-dim)',
//                           border: '1px solid rgba(255,170,0,0.25)',
//                         }}
//                       >
//                         {choice.requiresNote}
//                       </span>
//                     )}
//                     <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
//                       {choice.desc}
//                     </span>
//                   </div>
//                 </div>
//                 {/* Time badge */}
//                 <span
//                   className="text-xs px-2 py-0.5 rounded-sm flex-shrink-0"
//                   style={{
//                     color: 'var(--text-faint)',
//                     backgroundColor: 'var(--bg-hover)',
//                     border: '1px solid var(--border-default)',
//                     ...mono,
//                   }}
//                 >
//                   {choice.time}
//                 </span>
//               </label>
//             );
//           })}
//         </div>
//       </div>
//     );
//   }

//   if (field.type === 'toggle') {
//     const f = field as ToggleField;
//     return (
//       <div className="flex items-center justify-between gap-4">
//         <div>
//           <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{f.label}</p>
//           <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{f.desc}</p>
//         </div>
//         <button
//           type="button"
//           onClick={() => onChange(f.key, !value)}
//           className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
//           style={{
//             backgroundColor: value ? 'var(--accent-dim)' : 'var(--bg-hover)',
//             border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
//           }}
//         >
//           <span
//             className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all"
//             style={{
//               left:            value ? 'calc(100% - 1rem - 2px)' : '2px',
//               backgroundColor: value ? 'var(--accent)' : 'var(--border-strong)',
//             }}
//           />
//         </button>
//       </div>
//     );
//   }

//   if (field.type === 'number') {
//     const f = field as NumberField;
//     return (
//       <div>
//         <div className="flex items-center justify-between mb-1">
//           <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{f.label}</p>
//           <span className="text-xs font-bold" style={{ color: 'var(--accent)', ...mono }}>{value}</span>
//         </div>
//         <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>{f.desc}</p>
//         <input
//           type="range"
//           min={f.min}
//           max={f.max}
//           value={value}
//           onChange={e => onChange(f.key, parseInt(e.target.value, 10))}
//           className="w-full"
//           style={{ accentColor: 'var(--accent)' }}
//         />
//         <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-faint)', ...mono }}>
//           <span>{f.min}</span>
//           <span>{f.max}</span>
//         </div>
//       </div>
//     );
//   }

//   return null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // OPTIONS PANEL — renders all fields for a tool from its definition
// // ─────────────────────────────────────────────────────────────────────────────

// function ToolOptionsPanel({
//   tool,
//   options,
//   onFieldChange,
// }: {
//   tool:          ToolDefinition;
//   options:       Record<string, any>;
//   onFieldChange: (toolId: string, key: string, val: any) => void;
// }) {
//   if (tool.fields.length === 0) return null;

//   return (
//     <div className="space-y-4">
//       {tool.fields.map(field => (
//         <FieldRenderer
//           key={field.key}
//           field={field}
//           value={options[field.key] ?? field.default}
//           onChange={(key, val) => onFieldChange(tool.id, key, val)}
//         />
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // OPTION SUMMARY — tiny badges showing non-default values on the tool row
// // ─────────────────────────────────────────────────────────────────────────────

// function OptionSummaryBadges({
//   tool,
//   options,
// }: {
//   tool:    ToolDefinition;
//   options: Record<string, any>;
// }) {
//   const nonDefaults = tool.fields.filter(f => {
//     const val = options[f.key];
//     return val !== undefined && val !== f.default;
//   });

//   if (nonDefaults.length === 0) return null;

//   return (
//     <>
//       {nonDefaults.map(f => {
//         const val = options[f.key];
//         const display =
//           f.type === 'toggle'
//             ? (val ? f.label : `no ${f.label}`)
//             : String(val);

//         return (
//           <span
//             key={f.key}
//             className="text-xs px-1.5 py-0.5 rounded-sm"
//             style={{
//               fontSize: 10,
//               color: 'var(--accent)',
//               backgroundColor: 'var(--accent-dim)',
//               border: '1px solid var(--accent-border)',
//             }}
//           >
//             {display}
//           </span>
//         );
//       })}
//     </>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// export default function ScanForm() {
//   const router = useRouter();

//   const [target, setTarget]             = useState('');
//   const [selectedTools, setSelected]    = useState<string[]>(['nmap']);
//   // options: { [toolId]: { [fieldKey]: value } }
//   const [options, setOptions]           = useState<Record<string, Record<string, any>>>({});
//   const [expandedTool, setExpanded]     = useState<string | null>(null);
//   const [loading, setLoading]           = useState(false);
//   const [error, setError]               = useState<string | null>(null);

//   // ── Tool toggle ──────────────────────────────────────────────────────────
//   const toggleTool = (id: string) => {
//     setSelected(prev => {
//       if (prev.includes(id)) {
//         // Deselect — collapse panel + clear stored options
//         if (expandedTool === id) setExpanded(null);
//         setOptions(o => {
//           const copy = { ...o };
//           delete copy[id];
//           return copy;
//         });
//         return prev.filter(t => t !== id);
//       }
//       return [...prev, id];
//     });
//   };

//   // ── Field change ─────────────────────────────────────────────────────────
//   const handleFieldChange = (toolId: string, key: string, val: any) => {
//     setOptions(prev => ({
//       ...prev,
//       [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val },
//     }));
//   };

//   // ── Submit ───────────────────────────────────────────────────────────────
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     if (!target.trim())        { setError('Please enter a target domain or IP'); return; }
//     if (!selectedTools.length) { setError('Please select at least one tool');    return; }

//     setLoading(true);
//     try {
//       // Build options payload — only include tools that are selected and have options
//       const filteredOptions: Record<string, any> = {};
//       for (const toolId of selectedTools) {
//         const toolOpts = options[toolId];
//         if (toolOpts && Object.keys(toolOpts).length > 0) {
//           filteredOptions[toolId] = toolOpts;
//         }
//       }

//       const response = await apiClient.post('/api/v1/scans', {
//         target: target.trim(),
//         tools:  selectedTools,
//         ...(Object.keys(filteredOptions).length > 0 ? { options: filteredOptions } : {}),
//       });

//       const scanId = response.data?.scan_id ?? response.data?.id;
//       router.push(scanId ? `/dashboard/scans/${scanId}` : '/dashboard/scans');
//     } catch (err) {
//       setError(extractErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const canSubmit      = !loading && target.trim() && selectedTools.length > 0;
//   const customOptCount = selectedTools.filter(id => {
//     const opts = options[id];
//     if (!opts) return false;
//     const tool = getTool(id);
//     return tool?.fields.some(f => opts[f.key] !== undefined && opts[f.key] !== f.default) ?? false;
//   }).length;

//   return (
//     <div className="p-6 w-full" style={mono}>

//       {/* ── Header ───────────────────────────────────────────────────────── */}
//       <div
//         className="rounded-sm overflow-hidden mb-5"
//         style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
//       >
//         <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--accent)' }} />
//         <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
//           <div>
//             <Link
//               href="/dashboard/scans"
//               className="text-xs inline-flex items-center gap-1 mb-3 transition-colors"
//               style={{ color: 'var(--text-faint)' }}
//               onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
//               onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
//             >
//               ← Back to Scans
//             </Link>
//             <div className="flex items-center gap-2 mb-1">
//               <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
//               <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>scans --new</span>
//             </div>
//             <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
//               New Scan
//             </h1>
//             <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
//               Configure target, select tools, tune per-tool options
//             </p>
//           </div>

//           {(target || selectedTools.length > 0) && (
//             <div
//               className="px-4 py-3 rounded-sm text-xs max-w-xs"
//               style={{ backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}
//             >
//               <p className="uppercase tracking-widest mb-1" style={{ color: 'var(--accent)', fontSize: 10 }}>
//                 Ready to scan
//               </p>
//               {target && (
//                 <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{target}</p>
//               )}
//               {selectedTools.length > 0 && (
//                 <p style={{ color: 'var(--text-muted)' }}>{selectedTools.join(', ')}</p>
//               )}
//               {customOptCount > 0 && (
//                 <p className="mt-1" style={{ color: 'var(--accent)', fontSize: 10 }}>
//                   {customOptCount} tool{customOptCount > 1 ? 's' : ''} with custom options
//                 </p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

//           {/* ── LEFT: Target + Actions ─────────────────────────────────── */}
//           <div className="xl:col-span-2 space-y-4">
//             <div
//               className="rounded-sm overflow-hidden"
//               style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
//             >
//               <div
//                 className="px-5 py-3"
//                 style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
//               >
//                 <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
//                   Target <span style={{ color: 'var(--danger)' }}>*</span>
//                 </label>
//                 <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Domain name or IP address</p>
//               </div>
//               <div className="p-5">
//                 <div className="relative">
//                   <span
//                     className="absolute left-3 top-1/2 -translate-y-1/2 text-xs select-none pointer-events-none"
//                     style={{ color: 'var(--text-faint)' }}
//                   >▸</span>
//                   <input
//                     type="text"
//                     value={target}
//                     onChange={e => setTarget(e.target.value)}
//                     placeholder="example.com or 192.168.1.1"
//                     disabled={loading}
//                     autoFocus
//                     className="w-full rounded-sm focus:outline-none transition-colors text-xs"
//                     style={{
//                       padding: '9px 12px 9px 28px',
//                       backgroundColor: 'var(--bg-hover)',
//                       border: '1px solid var(--border-default)',
//                       color: 'var(--text-primary)',
//                       ...mono,
//                     }}
//                     onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
//                     onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}
//                   />
//                 </div>
//                 <div className="flex flex-wrap items-center gap-2 mt-3">
//                   <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Quick:</span>
//                   {['localhost', '127.0.0.1'].map(s => (
//                     <button
//                       key={s}
//                       type="button"
//                       onClick={() => setTarget(s)}
//                       className="px-2.5 py-1 text-xs rounded-sm transition-colors"
//                       style={{
//                         backgroundColor: 'var(--bg-hover)',
//                         border: '1px solid var(--border-default)',
//                         color: 'var(--text-muted)',
//                         ...mono,
//                       }}
//                       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; }}
//                       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
//                     >
//                       {s}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {error && (
//               <div
//                 className="px-4 py-3 rounded-sm"
//                 style={{ backgroundColor: 'var(--danger-dim)', border: '1px solid var(--danger-border)' }}
//               >
//                 <p className="text-xs font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--danger)' }}>
//                   <span>✗</span> Failed to create scan
//                 </p>
//                 <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--danger)' }}>{error}</pre>
//               </div>
//             )}

//             <div className="flex gap-3">
//               <button
//                 type="submit"
//                 disabled={!canSubmit}
//                 className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-sm tracking-widest uppercase transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
//                 style={{
//                   color: 'var(--accent)',
//                   backgroundColor: 'var(--accent-dim)',
//                   border: '1px solid var(--accent-border)',
//                   ...mono,
//                 }}
//               >
//                 {loading ? (
//                   <>
//                     <span
//                       className="w-3 h-3 rounded-full animate-spin"
//                       style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
//                     />
//                     Starting...
//                   </>
//                 ) : '→ Start Scan'}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => router.push('/dashboard/scans')}
//                 disabled={loading}
//                 className="px-5 py-2.5 text-xs rounded-sm transition-colors disabled:opacity-40"
//                 style={{
//                   color: 'var(--text-muted)',
//                   backgroundColor: 'var(--bg-hover)',
//                   border: '1px solid var(--border-default)',
//                   ...mono,
//                 }}
//                 onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
//                 onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>

//           {/* ── RIGHT: Tool Selection ─────────────────────────────────── */}
//           <div className="xl:col-span-3">
//             <div
//               className="rounded-sm overflow-hidden"
//               style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
//             >
//               <div
//                 className="px-5 py-3 flex items-center justify-between"
//                 style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
//               >
//                 <div>
//                   <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
//                     Tools <span style={{ color: 'var(--danger)' }}>*</span>
//                   </label>
//                   <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
//                     Select tools · click ⚙ to configure
//                   </p>
//                 </div>
//                 <span
//                   className="text-xs px-2.5 py-1 rounded-sm font-bold"
//                   style={{
//                     color: selectedTools.length > 0 ? 'var(--accent)' : 'var(--text-faint)',
//                     backgroundColor: selectedTools.length > 0 ? 'var(--accent-dim)' : 'var(--bg-hover)',
//                     border: `1px solid ${selectedTools.length > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
//                   }}
//                 >
//                   {selectedTools.length} selected
//                 </span>
//               </div>

//               <div className="p-4 space-y-2">
//                 {/* Tool rows — driven entirely by TOOLS registry */}
//                 {TOOLS.map(tool => {
//                   const checked    = selectedTools.includes(tool.id);
//                   const isExpanded = expandedTool === tool.id && checked;
//                   const toolOpts   = options[tool.id] ?? {};

//                   return (
//                     <div key={tool.id}>
//                       {/* Tool row */}
//                       <div
//                         className="flex items-center gap-3 px-4 py-3 rounded-sm transition-all"
//                         style={{
//                           backgroundColor: checked ? 'var(--bg-hover)' : 'transparent',
//                           border: `1px solid ${checked ? tool.color + '55' : 'var(--border-default)'}`,
//                         }}
//                         onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
//                         onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
//                       >
//                         {/* Checkbox */}
//                         <div
//                           className="w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
//                           style={{
//                             backgroundColor: checked ? tool.color : 'transparent',
//                             border: `1px solid ${checked ? tool.color : 'var(--border-strong)'}`,
//                           }}
//                           onClick={() => toggleTool(tool.id)}
//                         >
//                           {checked && (
//                             <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
//                               <path d="M1.5 4.5l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//                             </svg>
//                           )}
//                         </div>

//                         {/* Label + option summary badges */}
//                         <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTool(tool.id)}>
//                           <div className="flex items-center gap-2 flex-wrap">
//                             <p
//                               className="text-xs font-bold"
//                               style={{ color: checked ? tool.color : 'var(--text-secondary)' }}
//                             >
//                               {tool.label}
//                             </p>
//                             {checked && (
//                               <OptionSummaryBadges tool={tool} options={toolOpts} />
//                             )}
//                           </div>
//                           <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
//                             {tool.desc}
//                           </p>
//                         </div>

//                         {/* Options button — only shown for configurable tools when selected */}
//                         {tool.configurable && checked && (
//                           <button
//                             type="button"
//                             onClick={() => setExpanded(prev => prev === tool.id ? null : tool.id)}
//                             className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs transition-colors flex-shrink-0"
//                             style={{
//                               color: isExpanded ? 'var(--accent)' : 'var(--text-faint)',
//                               backgroundColor: isExpanded ? 'var(--accent-dim)' : 'transparent',
//                               border: `1px solid ${isExpanded ? 'var(--accent-border)' : 'var(--border-default)'}`,
//                             }}
//                           >
//                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
//                             </svg>
//                             Options
//                           </button>
//                         )}
//                       </div>

//                       {/* Options panel — slides open below the tool row */}
//                       {isExpanded && (
//                         <div
//                           className="mx-1 px-5 py-4 rounded-b-sm"
//                           style={{
//                             backgroundColor: 'var(--bg-base)',
//                             border: '1px solid var(--border-default)',
//                             borderTop: 'none',
//                           }}
//                         >
//                           <ToolOptionsPanel
//                             tool={tool}
//                             options={toolOpts}
//                             onFieldChange={handleFieldChange}
//                           />
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}

//                 {/* Select all / clear */}
//                 <div className="flex gap-3 mt-2 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
//                   <button
//                     type="button"
//                     onClick={() => setSelected(TOOLS.map(t => t.id))}
//                     className="text-xs transition-opacity hover:opacity-70"
//                     style={{ color: 'var(--accent)', ...mono }}
//                   >
//                     Select all
//                   </button>
//                   <span style={{ color: 'var(--border-strong)' }}>·</span>
//                   <button
//                     type="button"
//                     onClick={() => { setSelected([]); setOptions({}); setExpanded(null); }}
//                     className="text-xs transition-colors"
//                     style={{ color: 'var(--text-muted)', ...mono }}
//                     onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--danger)')}
//                     onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
//                   >
//                     Clear all
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }
