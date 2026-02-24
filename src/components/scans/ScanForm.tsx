// // src/components/scans/ScanForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/ThemeProvider';
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

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once)
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  /* NEW variables to add alongside your existing themes.css */
  :root {
    --bg-deep:         #070707;
    --bg-raised:       #0f0f0f;
    --bg-choice:       #0c0c0c;
    --bg-choice-on:    #111111;
    --border-choice:   #1e1e1e;
    --border-choice-on:#2a2a2a;
    --accent-soft:     rgba(0,255,136,0.06);
    --accent-pulse:    rgba(0,255,136,0.14);
  }
  .theme-light {
    --bg-deep:         #e8e8e3;
    --bg-raised:       #fcfcf9;
    --bg-choice:       #f2f2ee;
    --bg-choice-on:    #ffffff;
    --border-choice:   #ddddd5;
    --border-choice-on:#c0c0b5;
    --accent-soft:     rgba(0,136,68,0.05);
    --accent-pulse:    rgba(0,136,68,0.12);
  }

  /* scrollbar */
  .sf-scroll::-webkit-scrollbar { width: 2px; }
  .sf-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 1px; }

  /* target focus ring */
  .sf-target-box:focus-within {
    border-color: var(--accent-border) !important;
    box-shadow: 0 0 0 3px var(--accent-dim), 0 0 12px var(--accent-soft) !important;
  }

  /* launch hover */
  .sf-launch:hover:not(:disabled) {
    background: var(--accent-pulse) !important;
    border-color: var(--accent) !important;
    box-shadow: 0 0 24px var(--accent-glow) !important;
  }

  /* hint chip hover */
  .sf-hint:hover {
    color: var(--accent) !important;
    border-color: var(--accent-border) !important;
    background: var(--accent-dim) !important;
  }

  /* tool row accent bar */
  .sf-tr { position: relative; overflow: hidden; }
  .sf-tr::before {
    content: '';
    position: absolute; left: 0; top: 6px; bottom: 6px;
    width: 2px; border-radius: 1px;
    background: var(--sf-tc, transparent);
    opacity: 0; transition: opacity .15s;
  }
  .sf-tr.sf-active::before { opacity: 1; }

  /* choice hover */
  .sf-choice:hover {
    border-color: var(--border-choice-on) !important;
    background: var(--bg-choice-on) !important;
  }

  /* range thumb */
  input[type=range] { -webkit-appearance: none; cursor: pointer; }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--accent); border: 2px solid var(--bg-deep);
    box-shadow: 0 0 12px var(--accent-glow);
    transition: transform .1s;
  }
  input[type=range]:active::-webkit-slider-thumb { transform: scale(1.2); }

  /* cfg panel slide-in */
  @keyframes sf-slide {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .sf-slide { animation: sf-slide .17s cubic-bezier(.22,.68,0,1.2) both; }

  /* field label line */
  .sf-field-label {
    display: flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 12px;
  }
  .sf-field-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border-default);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" };

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  const e = err as any;
  if (e?.response?.data) {
    const d = e.response.data;
    if (Array.isArray(d?.detail))
      return d.detail.map((x: any) => {
        const f = Array.isArray(x.loc) ? x.loc.join(' → ') : '';
        return f ? `${f}: ${x.msg}` : x.msg;
      }).join('\n');
    if (typeof d?.detail  === 'string') return d.detail;
    if (typeof d?.message === 'string') return d.message;
    if (typeof d          === 'string') return d;
  }
  if (err instanceof Error) return err.message;
  return 'Failed to create scan';
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const BackIcon = () => (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
    <path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SunIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const MoonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <path d="M1 4l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EmptyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
  </svg>
);
const ErrIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M6 4v2.2M6 7.8h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// SMALL PIECES
// ─────────────────────────────────────────────────────────────────────────────

function PillBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        height: 26, padding: '0 11px',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        border: `1px solid ${hov ? 'var(--border-strong)' : 'var(--border-default)'}`,
        borderRadius: 5,
        background: hov ? 'var(--bg-hover)' : 'transparent',
        ...MONO, fontSize: 10,
        color: hov ? 'var(--text-secondary)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all .13s', whiteSpace: 'nowrap' as const,
      }}>
      {children}
    </button>
  );
}

function SelectBadge({ count }: { count: number }) {
  const on = count > 0;
  return (
    <span style={{
      ...MONO, fontSize: 10, fontWeight: 700,
      minWidth: 22, height: 20,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 6px', borderRadius: 4, transition: 'all .2s',
      color:      on ? 'var(--accent)'        : 'var(--text-ghost)',
      background: on ? 'var(--accent-dim)'    : 'transparent',
      border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
    }}>
      {count}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL ROW
// ─────────────────────────────────────────────────────────────────────────────

function ToolRow({ tool, selected, active, modified, onCheck, onOpen }: {
  tool: ToolDefinition; selected: boolean; active: boolean; modified: boolean;
  onCheck: () => void; onOpen: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={`sf-tr${active ? ' sf-active' : ''}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 10px 9px 12px', borderRadius: 6,
        border: `1px solid ${active ? 'var(--border-default)' : 'transparent'}`,
        background: active || hov ? 'var(--bg-hover)' : 'transparent',
        transition: 'all .12s', cursor: 'pointer', userSelect: 'none',
        ['--sf-tc' as any]: tool.color,
      }}
    >
      {/* Checkbox */}
      <div onClick={e => { e.stopPropagation(); onCheck(); }}
        style={{
          width: 15, height: 15, borderRadius: 3, flexShrink: 0,
          border: `1.5px solid ${selected ? tool.color : 'var(--border-strong)'}`,
          background: selected ? tool.color : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .13s',
        }}>
        {selected && <CheckIcon />}
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={onOpen}>
        <p style={{
          fontSize: 12, fontWeight: 600,
          color: selected ? tool.color : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color .13s',
        }}>
          {tool.label}
        </p>
        <p style={{
          ...MONO, fontSize: 9, color: 'var(--text-faint)', marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {tool.desc}
        </p>
      </div>

      {/* Right indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {modified && (
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
        )}
        {selected && (
          <span style={{
            ...MONO, fontSize: 12,
            color: active ? 'var(--accent)' : 'var(--text-faint)',
            opacity: 1, transition: 'color .13s',
          }}>›</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SelectField_({ field, value, onChange }: {
  field: SelectField; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="sf-field-label">{field.label}</div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
        {field.choices.map(choice => {
          const on = value === choice.value;
          return (
            <div key={choice.value} onClick={() => onChange(choice.value)}
              className="sf-choice"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 14px', borderRadius: 6,
                border: `1px solid ${on ? 'var(--border-choice-on)' : 'var(--border-choice)'}`,
                background: on ? 'var(--bg-choice-on)' : 'var(--bg-choice)',
                boxShadow: on ? 'inset 0 0 0 1px var(--border-default)' : 'none',
                cursor: 'pointer', transition: 'all .11s',
              }}>
              {/* Radio */}
              <div style={{
                width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color .13s',
              }}>
                {on && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
              </div>
              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color .11s' }}>
                    {choice.label}
                  </span>
                  {choice.requiresNote && (
                    <span style={{
                      ...MONO, fontSize: 9, padding: '1px 6px', borderRadius: 3,
                      color: 'var(--warn)', background: 'var(--warn-dim)',
                      border: '1px solid rgba(255,170,0,.15)',
                    }}>
                      {choice.requiresNote}
                    </span>
                  )}
                </div>
                <p style={{ ...MONO, fontSize: 9, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                  {choice.desc}
                </p>
              </div>
              {/* Time */}
              <span style={{
                ...MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4,
                color: 'var(--text-faint)', background: 'var(--bg-deep)',
                border: '1px solid var(--border-default)',
                flexShrink: 0, marginTop: 1, whiteSpace: 'nowrap' as const,
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

function ToggleField_({ field, value, onChange }: {
  field: ToggleField; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</p>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.6 }}>{field.desc}</p>
      </div>
      <button type="button" onClick={() => onChange(!value)} style={{
        position: 'relative', width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: value ? 'var(--accent-dim)' : 'var(--bg-deep)',
        border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
        cursor: 'pointer', transition: 'all .22s',
      }}>
        <span style={{
          position: 'absolute', top: 2,
          left: value ? 'calc(100% - 18px)' : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: value ? 'var(--accent)' : 'var(--border-strong)',
          boxShadow: '0 1px 2px rgba(0,0,0,.4)',
          transition: 'all .22s',
        }} />
      </button>
    </div>
  );
}

function NumberField_({ field, value, onChange }: {
  field: NumberField; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{field.label}</p>
        <span style={{ ...MONO, fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-.02em' }}>{value}</span>
      </div>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', marginBottom: 14, lineHeight: 1.6 }}>{field.desc}</p>
      <input type="range" min={field.min} max={field.max} value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', height: 3, background: 'var(--border-strong)', borderRadius: 2, outline: 'none', accentColor: 'var(--accent)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, ...MONO, fontSize: 9, color: 'var(--text-faint)' }}>
        <span>{field.min}</span><span>{field.max}</span>
      </div>
    </div>
  );
}

function FieldView({ field, value, onChange }: {
  field: ToolOptionField; value: any; onChange: (k: string, v: any) => void;
}) {
  if (field.type === 'select') return <SelectField_ field={field} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'toggle') return <ToggleField_ field={field} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'number') return <NumberField_ field={field} value={value} onChange={v => onChange(field.key, v)} />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG PANEL
// ─────────────────────────────────────────────────────────────────────────────

function ConfigEmpty() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: 48, textAlign: 'center',
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: 14,
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-faint)', marginBottom: 6,
      }}>
        <EmptyIcon />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>No tool selected</p>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.7 }}>
        Click a tool on the left<br />to view and configure its options
      </p>
    </div>
  );
}

function ConfigContent({ tool, options, onFieldChange, nonDefaultCount }: {
  tool: ToolDefinition;
  options: Record<string, any>;
  onFieldChange: (k: string, v: any) => void;
  nonDefaultCount: number;
}) {
  return (
    <div key={tool.id} className="sf-slide" style={{ flex: 1, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const }}>

      {/* ── Hero header ── */}
      <div style={{
        flexShrink: 0, padding: '22px 28px 20px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-default)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* ambient glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: tool.color,
          opacity: .04, filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        {/* title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: tool.color,
            boxShadow: `0 0 10px ${tool.color}66`,
            flexShrink: 0,
          }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.03em', color: tool.color }}>
            {tool.label}
          </h2>
        </div>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          {tool.desc}
        </p>

        {/* meta tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
          <span style={{
            ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
            color: 'var(--text-muted)', background: 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            {tool.fields.length} option{tool.fields.length !== 1 ? 's' : ''}
          </span>
          {nonDefaultCount > 0 && (
            <span style={{
              ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
              color: 'var(--accent)', background: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              ✦ {nonDefaultCount} customised
            </span>
          )}
          {tool.fields.length === 0 && (
            <span style={{
              ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
              color: 'var(--text-muted)', background: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}>
              defaults only
            </span>
          )}
        </div>
      </div>

      {/* ── Fields ── */}
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
        {tool.fields.length > 0 ? (
          tool.fields.map((field, i) => (
            <div key={field.key} style={{
              padding: `${i === 0 ? 0 : 20}px 0 20px`,
              borderBottom: i < tool.fields.length - 1 ? '1px solid var(--border-default)' : 'none',
            }}>
              <FieldView
                field={field}
                value={options[field.key] !== undefined ? options[field.key] : field.default}
                onChange={onFieldChange}
              />
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '18px 20px', borderRadius: 8,
            background: 'var(--bg-choice)', border: '1px solid var(--border-choice)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontSize: 14,
            }}>✓</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Runs with default settings
              </p>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.7 }}>
                {tool.label} requires no configuration.<br />
                Select it and launch — it uses optimal defaults automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScanForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [target,    setTarget]    = useState('');
  const [selected,  setSelected]  = useState<string[]>([]);
  const [options,   setOptions]   = useState<Record<string, Record<string, any>>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const isSelected   = (id: string) => selected.includes(id);
  const canLaunch    = !loading && !!target.trim() && selected.length > 0;

  const getNonDefaults = useCallback((id: string) => {
    const tool = getTool(id);
    const opts = options[id] ?? {};
    if (!tool) return 0;
    return tool.fields.filter(f => opts[f.key] !== undefined && opts[f.key] !== f.default).length;
  }, [options]);

  const handleCheck = useCallback((id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(t => t !== id);
        setOptions(o => { const c = { ...o }; delete c[id]; return c; });
        setActiveTab(at => at === id ? (next[next.length - 1] ?? null) : at);
        return next;
      }
      setActiveTab(id);
      return [...prev, id];
    });
  }, []);

  const handleOpen = useCallback((id: string) => {
    if (!selected.includes(id)) setSelected(p => [...p, id]);
    setActiveTab(id);
  }, [selected]);

  const handleFieldChange = useCallback((toolId: string, key: string, val: any) => {
    setOptions(prev => ({
      ...prev,
      [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val },
    }));
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!target.trim()) { setError('Enter a target domain or IP address.'); return; }
    if (!selected.length) { setError('Select at least one tool.'); return; }
    setLoading(true);
    try {
      const filtered: Record<string, any> = {};
      for (const id of selected) {
        const o = options[id];
        if (o && Object.keys(o).length) filtered[id] = o;
      }
      const res = await apiClient.post('/api/v1/scans', {
        target: target.trim(), tools: selected,
        ...(Object.keys(filtered).length ? { options: filtered } : {}),
      });
      const sid = res.data?.scan_id ?? res.data?.id;
      router.push(sid ? `/dashboard/scans/${sid}` : '/dashboard/scans');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const activeToolDef = activeTab ? (getTool(activeTab) ?? null) : null;
  const activeOpts    = activeTab ? (options[activeTab] ?? {}) : {};
  const showConfig    = activeToolDef && isSelected(activeToolDef.id);

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>

        {/* ── TOPBAR ─────────────────────────────────────────────── */}
        <div style={{
          height: 44, flexShrink: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-default)',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...MONO, fontSize: 11 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '.02em' }}>pentoolkit</span>
            <span style={{ color: 'var(--text-faint)' }}>/</span>
            <span style={{ color: 'var(--text-muted)' }}>new scan</span>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PillBtn onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </PillBtn>
            <Link href="/dashboard/scans" style={{ textDecoration: 'none' }}>
              <PillBtn onClick={() => {}}>
                <BackIcon /> Back to Scans
              </PillBtn>
            </Link>
          </div>
        </div>

        {/* ── TARGET STRIP ───────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, zIndex: 30,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-default)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={{ ...MONO, fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Target
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              {/* Input */}
              <div className="sf-target-box" style={{
                flex: 1, display: 'flex', alignItems: 'center',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-strong)',
                borderRadius: 7, overflow: 'hidden',
                transition: 'border-color .15s, box-shadow .15s',
              }}>
                <span style={{ ...MONO, fontSize: 14, color: 'var(--accent)', padding: '0 10px 0 14px', userSelect: 'none', lineHeight: 1 }}>▸</span>
                <input
                  type="text" value={target} autoFocus disabled={loading}
                  onChange={e => { setTarget(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="example.com  ·  192.168.1.1  ·  10.0.0.0/24"
                  style={{ ...MONO, flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', padding: '12px 14px 12px 0' }}
                />
              </div>

              {/* Launch */}
              <button type="button" className="sf-launch" onClick={handleSubmit} disabled={!canLaunch} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '0 22px', flexShrink: 0,
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 7,
                ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                color: 'var(--accent)', cursor: canLaunch ? 'pointer' : 'not-allowed',
                opacity: canLaunch ? 1 : .2, transition: 'all .15s',
              }}>
                <PlayIcon />
                {loading ? 'Launching…' : 'Launch Scan'}
              </button>
            </div>

            {/* Hints + error */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const }}>
              <span style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)' }}>Try:</span>
              {['localhost', '127.0.0.1', '192.168.1.1'].map(q => (
                <button key={q} type="button" className="sf-hint" onClick={() => { setTarget(q); setError(null); }} style={{
                  ...MONO, fontSize: 10, color: 'var(--text-muted)',
                  background: 'transparent', border: '1px solid var(--border-default)',
                  borderRadius: 4, padding: '2px 8px', cursor: 'pointer', transition: 'all .12s',
                }}>{q}</button>
              ))}
              {error && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  ...MONO, fontSize: 10, padding: '2px 9px', borderRadius: 4,
                  color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
                }}>
                  <ErrIcon />{error}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

          {/* LEFT */}
          <div style={{
            width: 252, flexShrink: 0,
            borderRight: '1px solid var(--border-default)',
            background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: '11px 14px 10px', flexShrink: 0,
              borderBottom: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ ...MONO, fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tools</span>
              <SelectBadge count={selected.length} />
            </div>

            <div className="sf-scroll" style={{ flex: 1, overflowY: 'auto', padding: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {TOOLS.map(tool => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  selected={isSelected(tool.id)}
                  active={activeTab === tool.id}
                  modified={getNonDefaults(tool.id) > 0}
                  onCheck={() => handleCheck(tool.id)}
                  onOpen={() => handleOpen(tool.id)}
                />
              ))}
            </div>

            <div style={{ padding: '9px 14px', flexShrink: 0, borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {[
                { label: 'Select all', g: true, action: () => { setSelected(TOOLS.map(t => t.id)); if (!activeTab) setActiveTab(TOOLS[0].id); } },
                { label: '·', sep: true },
                { label: 'Clear', g: false, action: () => { setSelected([]); setOptions({}); setActiveTab(null); } },
              ].map((item: any, i) =>
                item.sep ? <span key={i} style={{ ...MONO, fontSize: 10, color: 'var(--text-ghost)' }}>·</span> : (
                  <button key={i} type="button" onClick={item.action}
                    onMouseEnter={e => (e.currentTarget.style.color = item.g ? 'var(--accent)' : 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
                    style={{ ...MONO, fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-faint)', transition: 'color .13s' }}>
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="sf-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-deep)' }}>
            {showConfig ? (
              <ConfigContent
                tool={activeToolDef!}
                options={activeOpts}
                nonDefaultCount={getNonDefaults(activeTab!)}
                onFieldChange={(k, v) => activeTab && handleFieldChange(activeTab, k, v)}
              />
            ) : (
              <ConfigEmpty />
            )}
          </div>

        </div>
      </div>
    </>
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
