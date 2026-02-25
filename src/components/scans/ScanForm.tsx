// // src/components/scans/ScanForm.tsx
// src/components/scans/ScanForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
type SelectField_ = SelectField;
type ToggleField_ = ToggleField;
type NumberField_ = NumberField;

// ─── Shared style tokens (match the rest of the app exactly) ─────────────────
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
};

function extractErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  const e = err as any;
  if (e?.response?.data) {
    const d = e.response.data;
    if (Array.isArray(d?.detail))
      return d.detail
        .map((x: any) => {
          const f = Array.isArray(x.loc) ? x.loc.join(' → ') : '';
          return f ? `${f}: ${x.msg}` : x.msg;
        })
        .join('\n');
    if (typeof d?.detail  === 'string') return d.detail;
    if (typeof d?.message === 'string') return d.message;
    if (typeof d          === 'string') return d;
  }
  if (err instanceof Error) return err.message;
  return 'Failed to create scan';
}

// ─── Field renderers ─────────────────────────────────────────────────────────

function SelectFieldView({
  field,
  value,
  onChange,
}: {
  field: SelectField_;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)', ...mono }}>
        {field.label}
      </p>
      <div className="flex flex-col gap-2">
        {field.choices.map((choice) => {
          const on = value === choice.value;
          return (
            <div
              key={choice.value}
              onClick={() => onChange(choice.value)}
              className="flex items-start gap-3 p-3 rounded-sm cursor-pointer transition-all"
              style={{
                border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
                backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-hover)',
              }}
              onMouseEnter={(e) => {
                if (!on) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                if (!on) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              }}
            >
              {/* Radio dot */}
              <div
                className="flex-shrink-0 mt-0.5"
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color .12s',
                }}
              >
                {on && (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: on ? 'var(--accent)' : 'var(--text-secondary)', ...mono }}
                  >
                    {choice.label}
                  </span>
                  {choice.requiresNote && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-sm"
                      style={{
                        color: 'var(--warn)',
                        backgroundColor: 'var(--warn-dim)',
                        border: '1px solid rgba(255,170,0,.15)',
                        ...mono,
                        fontSize: 9,
                      }}
                    >
                      {choice.requiresNote}
                    </span>
                  )}
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                    style={{
                      color: 'var(--text-faint)',
                      backgroundColor: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      ...mono,
                      fontSize: 9,
                    }}
                  >
                    {choice.time}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.6 }}>
                  {choice.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleFieldView({
  field,
  value,
  onChange,
}: {
  field: ToggleField_;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-6 p-3 rounded-sm"
      style={{
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-hover)',
      }}
    >
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)', ...mono }}>
          {field.label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.6 }}>
          {field.desc}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex-shrink-0"
        style={{
          position: 'relative',
          width: 38,
          height: 20,
          borderRadius: 10,
          background: value ? 'var(--accent-dim)' : 'var(--bg-base)',
          border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
          cursor: 'pointer',
          transition: 'all .2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: value ? 'calc(100% - 17px)' : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: value ? 'var(--accent)' : 'var(--border-strong)',
            transition: 'all .2s',
          }}
        />
      </button>
    </div>
  );
}

function NumberFieldView({
  field,
  value,
  onChange,
}: {
  field: NumberField_;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="p-3 rounded-sm"
      style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>
          {field.label}
        </p>
        <span
          className="text-base font-bold"
          style={{ color: 'var(--accent)', letterSpacing: '-0.02em', ...mono }}
        >
          {value}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.6 }}>
        {field.desc}
      </p>
      <input
        type="range"
        min={field.min}
        max={field.max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{
          width: '100%',
          accentColor: 'var(--accent)',
          cursor: 'pointer',
        }}
      />
      <div
        className="flex justify-between mt-1 text-xs"
        style={{ color: 'var(--text-faint)', ...mono, fontSize: 9 }}
      >
        <span>{field.min}</span>
        <span>{field.max}</span>
      </div>
    </div>
  );
}

function FieldView({
  field,
  value,
  onChange,
}: {
  field: ToolOptionField;
  value: any;
  onChange: (k: string, v: any) => void;
}) {
  if (field.type === 'select')
    return <SelectFieldView field={field} value={value} onChange={(v) => onChange(field.key, v)} />;
  if (field.type === 'toggle')
    return <ToggleFieldView field={field} value={value} onChange={(v) => onChange(field.key, v)} />;
  if (field.type === 'number')
    return <NumberFieldView field={field} value={value} onChange={(v) => onChange(field.key, v)} />;
  return null;
}

// ─── Tool row ─────────────────────────────────────────────────────────────────

function ToolRow({
  tool,
  selected,
  active,
  modified,
  onCheck,
  onOpen,
}: {
  tool: ToolDefinition;
  selected: boolean;
  active: boolean;
  modified: boolean;
  onCheck: () => void;
  onOpen: () => void;
}) {
  const [hov, setHov] = useState(false);
  const highlight = active || hov;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-all group"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${active ? 'var(--border-default)' : 'transparent'}`,
        backgroundColor: active
          ? 'var(--bg-card)'
          : hov
          ? 'var(--bg-hover)'
          : 'transparent',
        position: 'relative',
      }}
    >
      {/* Active left bar */}
      {active && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            bottom: 6,
            width: 2,
            borderRadius: 1,
            backgroundColor: tool.color,
          }}
        />
      )}

      {/* Checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onCheck();
        }}
        className="flex-shrink-0"
        style={{
          width: 14,
          height: 14,
          borderRadius: 2,
          border: `1.5px solid ${selected ? tool.color : 'var(--border-strong)'}`,
          backgroundColor: selected ? tool.color : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all .12s',
        }}
      >
        {selected && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0" onClick={onOpen}>
        <p
          className="text-xs font-semibold truncate transition-colors"
          style={{ color: selected ? tool.color : highlight ? 'var(--text-secondary)' : 'var(--text-muted)', ...mono }}
        >
          {tool.label}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-faint)', ...mono, fontSize: 10 }}>
          {tool.desc}
        </p>
      </div>

      {/* Modified dot */}
      {modified && (
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
          title="Customised"
        />
      )}

      {/* Chevron when selected */}
      {selected && (
        <span className="flex-shrink-0 text-xs" style={{ color: active ? 'var(--accent)' : 'var(--text-faint)', ...mono }}>
          ›
        </span>
      )}
    </div>
  );
}

// ─── Config panel right side ──────────────────────────────────────────────────

function ConfigPanel({
  tool,
  options,
  nonDefaultCount,
  onFieldChange,
}: {
  tool: ToolDefinition | null;
  options: Record<string, any>;
  nonDefaultCount: number;
  onFieldChange: (k: string, v: any) => void;
}) {
  if (!tool) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3"
        style={{ color: 'var(--text-faint)' }}
      >
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center"
          style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2l1.5 3h3l-2.5 2 1 3L8 8.5 5 10l1-3L3.5 5h3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)', ...mono }}>
            No tool selected
          </p>
          <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono }}>
            Select a tool to configure it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tool header — matches card sub-header style from rest of app */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: tool.color, boxShadow: `0 0 6px ${tool.color}66` }}
          />
          <span className="text-xs" style={{ color: 'var(--accent)', ...mono }}>$</span>
          <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)', ...mono }}>
            config --tool {tool.id}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: tool.color, ...mono }}>
            {tool.label}
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-sm"
              style={{
                color: 'var(--text-faint)',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                ...mono,
              }}
            >
              {tool.fields.length} option{tool.fields.length !== 1 ? 's' : ''}
            </span>
            {nonDefaultCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-sm"
                style={{
                  color: 'var(--accent)',
                  backgroundColor: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                  ...mono,
                }}
              >
                ✦ {nonDefaultCount} modified
              </span>
            )}
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', ...mono }}>
          {tool.desc}
        </p>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tool.fields.length > 0 ? (
          tool.fields.map((field) => (
            <div key={field.key}>
              <FieldView
                field={field}
                value={options[field.key] !== undefined ? options[field.key] : field.default}
                onChange={onFieldChange}
              />
            </div>
          ))
        ) : (
          <div
            className="flex items-start gap-3 p-4 rounded-sm"
            style={{
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-hover)',
            }}
          >
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)', ...mono }}>
                Runs with optimal defaults
              </p>
              <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.6 }}>
                {tool.label} requires no configuration. Select it and launch.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ScanForm ────────────────────────────────────────────────────────────

export default function ScanForm() {
  const router = useRouter();

  const [target,    setTarget]    = useState('');
  const [selected,  setSelected]  = useState<string[]>([]);
  const [options,   setOptions]   = useState<Record<string, Record<string, any>>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const isSelected  = (id: string) => selected.includes(id);
  const canLaunch   = !loading && !!target.trim() && selected.length > 0;

  const getNonDefaults = useCallback(
    (id: string) => {
      const tool = getTool(id);
      const opts = options[id] ?? {};
      if (!tool) return 0;
      return tool.fields.filter(
        (f) => opts[f.key] !== undefined && opts[f.key] !== f.default
      ).length;
    },
    [options]
  );

  const handleCheck = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((t) => t !== id);
        setOptions((o) => { const c = { ...o }; delete c[id]; return c; });
        setActiveTab((at) => (at === id ? (next[next.length - 1] ?? null) : at));
        return next;
      }
      setActiveTab(id);
      return [...prev, id];
    });
  }, []);

  const handleOpen = useCallback(
    (id: string) => {
      if (!selected.includes(id)) setSelected((p) => [...p, id]);
      setActiveTab(id);
    },
    [selected]
  );

  const handleFieldChange = useCallback((toolId: string, key: string, val: any) => {
    setOptions((prev) => ({
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
        target: target.trim(),
        tools: selected,
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
    <div className="flex flex-col h-full" style={{ ...mono, overflow: 'hidden' }}>

      {/* ── Page header — matches all other dashboard pages ── */}
      <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
              <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>
                scan --new
              </span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              New Scan
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Configure target and tools, then launch
            </p>
          </div>
          <Link
            href="/dashboard/scans"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-colors"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M7 2L4 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Scans
          </Link>
        </div>
      </div>

      {/* ── Target input row ── */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3 max-w-3xl">
          {/* Input */}
          <div
            className="flex-1 flex items-center rounded-sm overflow-hidden transition-all"
            style={{
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--bg-input, var(--bg-hover))',
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          >
            <span
              className="px-3 text-sm select-none"
              style={{ color: 'var(--accent)' }}
            >
              ▸
            </span>
            <input
              type="text"
              value={target}
              autoFocus
              disabled={loading}
              onChange={(e) => { setTarget(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="example.com  ·  192.168.1.1  ·  10.0.0.0/24"
              className="flex-1 py-2.5 pr-3 text-xs bg-transparent outline-none"
              style={{ color: 'var(--text-primary)', ...mono }}
            />
          </div>

          {/* Launch button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canLaunch}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-sm transition-all"
            style={{
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              opacity: canLaunch ? 1 : 0.25,
              cursor: canLaunch ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (canLaunch) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,217,126,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-dim)';
            }}
          >
            {loading ? (
              <>
                <span
                  className="w-3 h-3 rounded-full animate-spin"
                  style={{
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderTopColor: 'transparent',
                    borderRightColor: 'var(--accent)',
                    borderBottomColor: 'var(--accent)',
                    borderLeftColor: 'var(--accent)',
                  }}
                />
                Launching...
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Launch Scan
              </>
            )}
          </button>
        </div>

        {/* Hints + quick fills */}
        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-xs" style={{ color: 'var(--text-faint)', ...mono }}>Try:</span>
          {['localhost', '127.0.0.1', '192.168.1.1'].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => { setTarget(q); setError(null); }}
              className="text-xs px-2 py-0.5 rounded-sm transition-colors"
              style={{
                color: 'var(--text-muted)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'transparent',
                ...mono,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              }}
            >
              {q}
            </button>
          ))}

          {/* Error inline */}
          {error && (
            <span
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-sm ml-2"
              style={{
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-dim)',
                border: '1px solid var(--danger-border)',
                ...mono,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 4v2.2M6 7.8h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {error}
            </span>
          )}
        </div>
      </div>

      {/* ── Body: Tools list + Config panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: tools list */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{
            width: 240,
            borderRight: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-base)',
            overflow: 'hidden',
          }}
        >
          {/* Sub-header — matches table sub-headers throughout app */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
              <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)', ...mono }}>
                Tools
              </span>
            </div>
            {/* Selected count badge */}
            <span
              className="text-xs px-2 py-0.5 rounded-sm font-bold"
              style={{
                color: selected.length > 0 ? 'var(--accent)' : 'var(--text-ghost)',
                backgroundColor: selected.length > 0 ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${selected.length > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
                transition: 'all .2s',
                ...mono,
              }}
            >
              {selected.length}
            </span>
          </div>

          {/* Tool rows */}
          <div className="flex-1 overflow-y-auto p-2">
            {TOOLS.map((tool) => (
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

          {/* Footer actions */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border-default)' }}
          >
            <button
              type="button"
              onClick={() => {
                setSelected(TOOLS.map((t) => t.id));
                if (!activeTab) setActiveTab(TOOLS[0]?.id ?? null);
              }}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)', ...mono }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
            >
              Select all
            </button>
            <span style={{ color: 'var(--text-ghost)', ...mono, fontSize: 10 }}>·</span>
            <button
              type="button"
              onClick={() => { setSelected([]); setOptions({}); setActiveTab(null); }}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)', ...mono }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--danger)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
            >
              Clear
            </button>
          </div>
        </div>

        {/* RIGHT: config panel */}
        <div
          className="flex flex-1 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          <div
            className="flex flex-col flex-1 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderLeft: 'none',
            }}
          >
            <ConfigPanel
              tool={showConfig ? activeToolDef : null}
              options={activeOpts}
              nonDefaultCount={activeTab ? getNonDefaults(activeTab) : 0}
              onFieldChange={(k, v) => activeTab && handleFieldChange(activeTab, k, v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 'use client';

// import React, { useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useTheme } from '@/lib/theme/ThemeProvider';
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

// // ─────────────────────────────────────────────────────────────────────────────
// // GLOBAL STYLES (injected once)
// // ─────────────────────────────────────────────────────────────────────────────

// const GLOBAL_CSS = `
//   /* NEW variables to add alongside your existing themes.css */
//   :root {
//     --bg-deep:         #070707;
//     --bg-raised:       #0f0f0f;
//     --bg-choice:       #0c0c0c;
//     --bg-choice-on:    #111111;
//     --border-choice:   #1e1e1e;
//     --border-choice-on:#2a2a2a;
//     --accent-soft:     rgba(0,255,136,0.06);
//     --accent-pulse:    rgba(0,255,136,0.14);
//   }
//   .theme-light {
//     --bg-deep:         #e8e8e3;
//     --bg-raised:       #fcfcf9;
//     --bg-choice:       #f2f2ee;
//     --bg-choice-on:    #ffffff;
//     --border-choice:   #ddddd5;
//     --border-choice-on:#c0c0b5;
//     --accent-soft:     rgba(0,136,68,0.05);
//     --accent-pulse:    rgba(0,136,68,0.12);
//   }

//   /* scrollbar */
//   .sf-scroll::-webkit-scrollbar { width: 2px; }
//   .sf-scroll::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 1px; }

//   /* target focus ring */
//   .sf-target-box:focus-within {
//     border-color: var(--accent-border) !important;
//     box-shadow: 0 0 0 3px var(--accent-dim), 0 0 12px var(--accent-soft) !important;
//   }

//   /* launch hover */
//   .sf-launch:hover:not(:disabled) {
//     background: var(--accent-pulse) !important;
//     border-color: var(--accent) !important;
//     box-shadow: 0 0 24px var(--accent-glow) !important;
//   }

//   /* hint chip hover */
//   .sf-hint:hover {
//     color: var(--accent) !important;
//     border-color: var(--accent-border) !important;
//     background: var(--accent-dim) !important;
//   }

//   /* tool row accent bar */
//   .sf-tr { position: relative; overflow: hidden; }
//   .sf-tr::before {
//     content: '';
//     position: absolute; left: 0; top: 6px; bottom: 6px;
//     width: 2px; border-radius: 1px;
//     background: var(--sf-tc, transparent);
//     opacity: 0; transition: opacity .15s;
//   }
//   .sf-tr.sf-active::before { opacity: 1; }

//   /* choice hover */
//   .sf-choice:hover {
//     border-color: var(--border-choice-on) !important;
//     background: var(--bg-choice-on) !important;
//   }

//   /* range thumb */
//   input[type=range] { -webkit-appearance: none; cursor: pointer; }
//   input[type=range]::-webkit-slider-thumb {
//     -webkit-appearance: none;
//     width: 16px; height: 16px; border-radius: 50%;
//     background: var(--accent); border: 2px solid var(--bg-deep);
//     box-shadow: 0 0 12px var(--accent-glow);
//     transition: transform .1s;
//   }
//   input[type=range]:active::-webkit-slider-thumb { transform: scale(1.2); }

//   /* cfg panel slide-in */
//   @keyframes sf-slide {
//     from { opacity: 0; transform: translateX(10px); }
//     to   { opacity: 1; transform: translateX(0); }
//   }
//   .sf-slide { animation: sf-slide .17s cubic-bezier(.22,.68,0,1.2) both; }

//   /* field label line */
//   .sf-field-label {
//     display: flex; align-items: center; gap: 8px;
//     font-family: 'IBM Plex Mono', monospace;
//     font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
//     color: var(--text-muted); margin-bottom: 12px;
//   }
//   .sf-field-label::after {
//     content: ''; flex: 1; height: 1px; background: var(--border-default);
//   }
// `;

// // ─────────────────────────────────────────────────────────────────────────────
// // UTILS
// // ─────────────────────────────────────────────────────────────────────────────

// const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" };

// function extractErrorMessage(err: unknown): string {
//   if (!err) return 'An unknown error occurred';
//   const e = err as any;
//   if (e?.response?.data) {
//     const d = e.response.data;
//     if (Array.isArray(d?.detail))
//       return d.detail.map((x: any) => {
//         const f = Array.isArray(x.loc) ? x.loc.join(' → ') : '';
//         return f ? `${f}: ${x.msg}` : x.msg;
//       }).join('\n');
//     if (typeof d?.detail  === 'string') return d.detail;
//     if (typeof d?.message === 'string') return d.message;
//     if (typeof d          === 'string') return d;
//   }
//   if (err instanceof Error) return err.message;
//   return 'Failed to create scan';
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ICONS
// // ─────────────────────────────────────────────────────────────────────────────

// const PlayIcon = () => (
//   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//     <polygon points="5 3 19 12 5 21 5 3" />
//   </svg>
// );
// const BackIcon = () => (
//   <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
//     <path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );
// const SunIcon = () => (
//   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//     <circle cx="12" cy="12" r="5" />
//     <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
//   </svg>
// );
// const MoonIcon = () => (
//   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//     <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
//   </svg>
// );
// const CheckIcon = () => (
//   <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
//     <path d="M1 4l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );
// const EmptyIcon = () => (
//   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
//     <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
//   </svg>
// );
// const ErrIcon = () => (
//   <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
//     <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
//     <path d="M6 4v2.2M6 7.8h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
//   </svg>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // SMALL PIECES
// // ─────────────────────────────────────────────────────────────────────────────

// function PillBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
//   const [hov, setHov] = useState(false);
//   return (
//     <button type="button" onClick={onClick}
//       onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
//       style={{
//         height: 26, padding: '0 11px',
//         display: 'inline-flex', alignItems: 'center', gap: 5,
//         border: `1px solid ${hov ? 'var(--border-strong)' : 'var(--border-default)'}`,
//         borderRadius: 5,
//         background: hov ? 'var(--bg-hover)' : 'transparent',
//         ...MONO, fontSize: 10,
//         color: hov ? 'var(--text-secondary)' : 'var(--text-muted)',
//         cursor: 'pointer', transition: 'all .13s', whiteSpace: 'nowrap' as const,
//       }}>
//       {children}
//     </button>
//   );
// }

// function SelectBadge({ count }: { count: number }) {
//   const on = count > 0;
//   return (
//     <span style={{
//       ...MONO, fontSize: 10, fontWeight: 700,
//       minWidth: 22, height: 20,
//       display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//       padding: '0 6px', borderRadius: 4, transition: 'all .2s',
//       color:      on ? 'var(--accent)'        : 'var(--text-ghost)',
//       background: on ? 'var(--accent-dim)'    : 'transparent',
//       border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
//     }}>
//       {count}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // TOOL ROW
// // ─────────────────────────────────────────────────────────────────────────────

// function ToolRow({ tool, selected, active, modified, onCheck, onOpen }: {
//   tool: ToolDefinition; selected: boolean; active: boolean; modified: boolean;
//   onCheck: () => void; onOpen: () => void;
// }) {
//   const [hov, setHov] = useState(false);
//   return (
//     <div
//       className={`sf-tr${active ? ' sf-active' : ''}`}
//       onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
//       style={{
//         display: 'flex', alignItems: 'center', gap: 9,
//         padding: '9px 10px 9px 12px', borderRadius: 6,
//         border: `1px solid ${active ? 'var(--border-default)' : 'transparent'}`,
//         background: active || hov ? 'var(--bg-hover)' : 'transparent',
//         transition: 'all .12s', cursor: 'pointer', userSelect: 'none',
//         ['--sf-tc' as any]: tool.color,
//       }}
//     >
//       {/* Checkbox */}
//       <div onClick={e => { e.stopPropagation(); onCheck(); }}
//         style={{
//           width: 15, height: 15, borderRadius: 3, flexShrink: 0,
//           border: `1.5px solid ${selected ? tool.color : 'var(--border-strong)'}`,
//           background: selected ? tool.color : 'transparent',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           transition: 'all .13s',
//         }}>
//         {selected && <CheckIcon />}
//       </div>

//       {/* Label */}
//       <div style={{ flex: 1, minWidth: 0 }} onClick={onOpen}>
//         <p style={{
//           fontSize: 12, fontWeight: 600,
//           color: selected ? tool.color : 'var(--text-secondary)',
//           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
//           transition: 'color .13s',
//         }}>
//           {tool.label}
//         </p>
//         <p style={{
//           ...MONO, fontSize: 9, color: 'var(--text-faint)', marginTop: 2,
//           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
//         }}>
//           {tool.desc}
//         </p>
//       </div>

//       {/* Right indicators */}
//       <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
//         {modified && (
//           <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
//         )}
//         {selected && (
//           <span style={{
//             ...MONO, fontSize: 12,
//             color: active ? 'var(--accent)' : 'var(--text-faint)',
//             opacity: 1, transition: 'color .13s',
//           }}>›</span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // FIELD COMPONENTS
// // ─────────────────────────────────────────────────────────────────────────────

// function SelectField_({ field, value, onChange }: {
//   field: SelectField; value: string; onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <div className="sf-field-label">{field.label}</div>
//       <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
//         {field.choices.map(choice => {
//           const on = value === choice.value;
//           return (
//             <div key={choice.value} onClick={() => onChange(choice.value)}
//               className="sf-choice"
//               style={{
//                 display: 'flex', alignItems: 'flex-start', gap: 12,
//                 padding: '10px 14px', borderRadius: 6,
//                 border: `1px solid ${on ? 'var(--border-choice-on)' : 'var(--border-choice)'}`,
//                 background: on ? 'var(--bg-choice-on)' : 'var(--bg-choice)',
//                 boxShadow: on ? 'inset 0 0 0 1px var(--border-default)' : 'none',
//                 cursor: 'pointer', transition: 'all .11s',
//               }}>
//               {/* Radio */}
//               <div style={{
//                 width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
//                 border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 transition: 'border-color .13s',
//               }}>
//                 {on && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
//               </div>
//               {/* Body */}
//               <div style={{ flex: 1, minWidth: 0 }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginBottom: 2 }}>
//                   <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color .11s' }}>
//                     {choice.label}
//                   </span>
//                   {choice.requiresNote && (
//                     <span style={{
//                       ...MONO, fontSize: 9, padding: '1px 6px', borderRadius: 3,
//                       color: 'var(--warn)', background: 'var(--warn-dim)',
//                       border: '1px solid rgba(255,170,0,.15)',
//                     }}>
//                       {choice.requiresNote}
//                     </span>
//                   )}
//                 </div>
//                 <p style={{ ...MONO, fontSize: 9, color: 'var(--text-faint)', lineHeight: 1.5 }}>
//                   {choice.desc}
//                 </p>
//               </div>
//               {/* Time */}
//               <span style={{
//                 ...MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4,
//                 color: 'var(--text-faint)', background: 'var(--bg-deep)',
//                 border: '1px solid var(--border-default)',
//                 flexShrink: 0, marginTop: 1, whiteSpace: 'nowrap' as const,
//               }}>
//                 {choice.time}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function ToggleField_({ field, value, onChange }: {
//   field: ToggleField; value: boolean; onChange: (v: boolean) => void;
// }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
//       <div>
//         <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</p>
//         <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.6 }}>{field.desc}</p>
//       </div>
//       <button type="button" onClick={() => onChange(!value)} style={{
//         position: 'relative', width: 40, height: 22, borderRadius: 11, flexShrink: 0,
//         background: value ? 'var(--accent-dim)' : 'var(--bg-deep)',
//         border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
//         cursor: 'pointer', transition: 'all .22s',
//       }}>
//         <span style={{
//           position: 'absolute', top: 2,
//           left: value ? 'calc(100% - 18px)' : 2,
//           width: 16, height: 16, borderRadius: '50%',
//           background: value ? 'var(--accent)' : 'var(--border-strong)',
//           boxShadow: '0 1px 2px rgba(0,0,0,.4)',
//           transition: 'all .22s',
//         }} />
//       </button>
//     </div>
//   );
// }

// function NumberField_({ field, value, onChange }: {
//   field: NumberField; value: number; onChange: (v: number) => void;
// }) {
//   return (
//     <div>
//       <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
//         <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{field.label}</p>
//         <span style={{ ...MONO, fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-.02em' }}>{value}</span>
//       </div>
//       <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', marginBottom: 14, lineHeight: 1.6 }}>{field.desc}</p>
//       <input type="range" min={field.min} max={field.max} value={value}
//         onChange={e => onChange(parseInt(e.target.value, 10))}
//         style={{ width: '100%', height: 3, background: 'var(--border-strong)', borderRadius: 2, outline: 'none', accentColor: 'var(--accent)' }} />
//       <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, ...MONO, fontSize: 9, color: 'var(--text-faint)' }}>
//         <span>{field.min}</span><span>{field.max}</span>
//       </div>
//     </div>
//   );
// }

// function FieldView({ field, value, onChange }: {
//   field: ToolOptionField; value: any; onChange: (k: string, v: any) => void;
// }) {
//   if (field.type === 'select') return <SelectField_ field={field} value={value} onChange={v => onChange(field.key, v)} />;
//   if (field.type === 'toggle') return <ToggleField_ field={field} value={value} onChange={v => onChange(field.key, v)} />;
//   if (field.type === 'number') return <NumberField_ field={field} value={value} onChange={v => onChange(field.key, v)} />;
//   return null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CONFIG PANEL
// // ─────────────────────────────────────────────────────────────────────────────

// function ConfigEmpty() {
//   return (
//     <div style={{
//       flex: 1, display: 'flex', flexDirection: 'column' as const,
//       alignItems: 'center', justifyContent: 'center',
//       gap: 12, padding: 48, textAlign: 'center',
//     }}>
//       <div style={{
//         width: 54, height: 54, borderRadius: 14,
//         background: 'var(--bg-card)', border: '1px solid var(--border-default)',
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         color: 'var(--text-faint)', marginBottom: 6,
//       }}>
//         <EmptyIcon />
//       </div>
//       <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>No tool selected</p>
//       <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.7 }}>
//         Click a tool on the left<br />to view and configure its options
//       </p>
//     </div>
//   );
// }

// function ConfigContent({ tool, options, onFieldChange, nonDefaultCount }: {
//   tool: ToolDefinition;
//   options: Record<string, any>;
//   onFieldChange: (k: string, v: any) => void;
//   nonDefaultCount: number;
// }) {
//   return (
//     <div key={tool.id} className="sf-slide" style={{ flex: 1, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const }}>

//       {/* ── Hero header ── */}
//       <div style={{
//         flexShrink: 0, padding: '22px 28px 20px',
//         background: 'var(--bg-card)',
//         borderBottom: '1px solid var(--border-default)',
//         position: 'relative', overflow: 'hidden',
//       }}>
//         {/* ambient glow */}
//         <div style={{
//           position: 'absolute', top: -40, right: -40,
//           width: 180, height: 180, borderRadius: '50%',
//           background: tool.color,
//           opacity: .04, filter: 'blur(40px)',
//           pointerEvents: 'none',
//         }} />

//         {/* title row */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
//           <div style={{
//             width: 10, height: 10, borderRadius: '50%',
//             background: tool.color,
//             boxShadow: `0 0 10px ${tool.color}66`,
//             flexShrink: 0,
//           }} />
//           <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.03em', color: tool.color }}>
//             {tool.label}
//           </h2>
//         </div>
//         <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
//           {tool.desc}
//         </p>

//         {/* meta tags */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
//           <span style={{
//             ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
//             color: 'var(--text-muted)', background: 'var(--bg-hover)',
//             border: '1px solid var(--border-default)',
//             display: 'inline-flex', alignItems: 'center', gap: 4,
//           }}>
//             {tool.fields.length} option{tool.fields.length !== 1 ? 's' : ''}
//           </span>
//           {nonDefaultCount > 0 && (
//             <span style={{
//               ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
//               color: 'var(--accent)', background: 'var(--accent-dim)',
//               border: '1px solid var(--accent-border)',
//               display: 'inline-flex', alignItems: 'center', gap: 4,
//             }}>
//               ✦ {nonDefaultCount} customised
//             </span>
//           )}
//           {tool.fields.length === 0 && (
//             <span style={{
//               ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
//               color: 'var(--text-muted)', background: 'var(--bg-hover)',
//               border: '1px solid var(--border-default)',
//             }}>
//               defaults only
//             </span>
//           )}
//         </div>
//       </div>

//       {/* ── Fields ── */}
//       <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
//         {tool.fields.length > 0 ? (
//           tool.fields.map((field, i) => (
//             <div key={field.key} style={{
//               padding: `${i === 0 ? 0 : 20}px 0 20px`,
//               borderBottom: i < tool.fields.length - 1 ? '1px solid var(--border-default)' : 'none',
//             }}>
//               <FieldView
//                 field={field}
//                 value={options[field.key] !== undefined ? options[field.key] : field.default}
//                 onChange={onFieldChange}
//               />
//             </div>
//           ))
//         ) : (
//           <div style={{
//             display: 'flex', alignItems: 'flex-start', gap: 14,
//             padding: '18px 20px', borderRadius: 8,
//             background: 'var(--bg-choice)', border: '1px solid var(--border-choice)',
//           }}>
//             <div style={{
//               width: 34, height: 34, borderRadius: 8, flexShrink: 0,
//               background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//               color: 'var(--accent)', fontSize: 14,
//             }}>✓</div>
//             <div>
//               <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
//                 Runs with default settings
//               </p>
//               <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.7 }}>
//                 {tool.label} requires no configuration.<br />
//                 Select it and launch — it uses optimal defaults automatically.
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// export default function ScanForm() {
//   const router = useRouter();
//   const { theme, toggleTheme } = useTheme();

//   const [target,    setTarget]    = useState('');
//   const [selected,  setSelected]  = useState<string[]>([]);
//   const [options,   setOptions]   = useState<Record<string, Record<string, any>>>({});
//   const [activeTab, setActiveTab] = useState<string | null>(null);
//   const [loading,   setLoading]   = useState(false);
//   const [error,     setError]     = useState<string | null>(null);

//   const isSelected   = (id: string) => selected.includes(id);
//   const canLaunch    = !loading && !!target.trim() && selected.length > 0;

//   const getNonDefaults = useCallback((id: string) => {
//     const tool = getTool(id);
//     const opts = options[id] ?? {};
//     if (!tool) return 0;
//     return tool.fields.filter(f => opts[f.key] !== undefined && opts[f.key] !== f.default).length;
//   }, [options]);

//   const handleCheck = useCallback((id: string) => {
//     setSelected(prev => {
//       if (prev.includes(id)) {
//         const next = prev.filter(t => t !== id);
//         setOptions(o => { const c = { ...o }; delete c[id]; return c; });
//         setActiveTab(at => at === id ? (next[next.length - 1] ?? null) : at);
//         return next;
//       }
//       setActiveTab(id);
//       return [...prev, id];
//     });
//   }, []);

//   const handleOpen = useCallback((id: string) => {
//     if (!selected.includes(id)) setSelected(p => [...p, id]);
//     setActiveTab(id);
//   }, [selected]);

//   const handleFieldChange = useCallback((toolId: string, key: string, val: any) => {
//     setOptions(prev => ({
//       ...prev,
//       [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val },
//     }));
//   }, []);

//   const handleSubmit = async () => {
//     setError(null);
//     if (!target.trim()) { setError('Enter a target domain or IP address.'); return; }
//     if (!selected.length) { setError('Select at least one tool.'); return; }
//     setLoading(true);
//     try {
//       const filtered: Record<string, any> = {};
//       for (const id of selected) {
//         const o = options[id];
//         if (o && Object.keys(o).length) filtered[id] = o;
//       }
//       const res = await apiClient.post('/api/v1/scans', {
//         target: target.trim(), tools: selected,
//         ...(Object.keys(filtered).length ? { options: filtered } : {}),
//       });
//       const sid = res.data?.scan_id ?? res.data?.id;
//       router.push(sid ? `/dashboard/scans/${sid}` : '/dashboard/scans');
//     } catch (e) {
//       setError(extractErrorMessage(e));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const activeToolDef = activeTab ? (getTool(activeTab) ?? null) : null;
//   const activeOpts    = activeTab ? (options[activeTab] ?? {}) : {};
//   const showConfig    = activeToolDef && isSelected(activeToolDef.id);

//   return (
//     <>
//       <style>{GLOBAL_CSS}</style>

//       <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>

//         {/* ── TOPBAR ─────────────────────────────────────────────── */}
//         <div style={{
//           height: 44, flexShrink: 0, zIndex: 40,
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '0 16px',
//           background: 'var(--bg-card)',
//           borderBottom: '1px solid var(--border-default)',
//         }}>
//           {/* Breadcrumb */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...MONO, fontSize: 11 }}>
//             <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '.02em' }}>pentoolkit</span>
//             <span style={{ color: 'var(--text-faint)' }}>/</span>
//             <span style={{ color: 'var(--text-muted)' }}>new scan</span>
//           </div>
//           {/* Actions */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//             <PillBtn onClick={toggleTheme}>
//               {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
//               {theme === 'dark' ? 'Light' : 'Dark'}
//             </PillBtn>
//             <Link href="/dashboard/scans" style={{ textDecoration: 'none' }}>
//               <PillBtn onClick={() => {}}>
//                 <BackIcon /> Back to Scans
//               </PillBtn>
//             </Link>
//           </div>
//         </div>

//         {/* ── TARGET STRIP ───────────────────────────────────────── */}
//         <div style={{
//           flexShrink: 0, zIndex: 30,
//           background: 'var(--bg-card)',
//           borderBottom: '1px solid var(--border-default)',
//           padding: '16px 20px',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}>
//           <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 9 }}>
//             <span style={{ ...MONO, fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
//               Target
//             </span>

//             <div style={{ display: 'flex', gap: 8 }}>
//               {/* Input */}
//               <div className="sf-target-box" style={{
//                 flex: 1, display: 'flex', alignItems: 'center',
//                 background: 'var(--bg-input)',
//                 border: '1px solid var(--border-strong)',
//                 borderRadius: 7, overflow: 'hidden',
//                 transition: 'border-color .15s, box-shadow .15s',
//               }}>
//                 <span style={{ ...MONO, fontSize: 14, color: 'var(--accent)', padding: '0 10px 0 14px', userSelect: 'none', lineHeight: 1 }}>▸</span>
//                 <input
//                   type="text" value={target} autoFocus disabled={loading}
//                   onChange={e => { setTarget(e.target.value); setError(null); }}
//                   onKeyDown={e => e.key === 'Enter' && handleSubmit()}
//                   placeholder="example.com  ·  192.168.1.1  ·  10.0.0.0/24"
//                   style={{ ...MONO, flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', padding: '12px 14px 12px 0' }}
//                 />
//               </div>

//               {/* Launch */}
//               <button type="button" className="sf-launch" onClick={handleSubmit} disabled={!canLaunch} style={{
//                 display: 'inline-flex', alignItems: 'center', gap: 8,
//                 padding: '0 22px', flexShrink: 0,
//                 background: 'var(--accent-dim)',
//                 border: '1px solid var(--accent-border)',
//                 borderRadius: 7,
//                 ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
//                 color: 'var(--accent)', cursor: canLaunch ? 'pointer' : 'not-allowed',
//                 opacity: canLaunch ? 1 : .2, transition: 'all .15s',
//               }}>
//                 <PlayIcon />
//                 {loading ? 'Launching…' : 'Launch Scan'}
//               </button>
//             </div>

//             {/* Hints + error */}
//             <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const }}>
//               <span style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)' }}>Try:</span>
//               {['localhost', '127.0.0.1', '192.168.1.1'].map(q => (
//                 <button key={q} type="button" className="sf-hint" onClick={() => { setTarget(q); setError(null); }} style={{
//                   ...MONO, fontSize: 10, color: 'var(--text-muted)',
//                   background: 'transparent', border: '1px solid var(--border-default)',
//                   borderRadius: 4, padding: '2px 8px', cursor: 'pointer', transition: 'all .12s',
//                 }}>{q}</button>
//               ))}
//               {error && (
//                 <span style={{
//                   display: 'inline-flex', alignItems: 'center', gap: 5,
//                   ...MONO, fontSize: 10, padding: '2px 9px', borderRadius: 4,
//                   color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
//                 }}>
//                   <ErrIcon />{error}
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── BODY ───────────────────────────────────────────────── */}
//         <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

//           {/* LEFT */}
//           <div style={{
//             width: 252, flexShrink: 0,
//             borderRight: '1px solid var(--border-default)',
//             background: 'var(--bg-card)',
//             display: 'flex', flexDirection: 'column', overflow: 'hidden',
//           }}>
//             <div style={{
//               padding: '11px 14px 10px', flexShrink: 0,
//               borderBottom: '1px solid var(--border-default)',
//               display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//             }}>
//               <span style={{ ...MONO, fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tools</span>
//               <SelectBadge count={selected.length} />
//             </div>

//             <div className="sf-scroll" style={{ flex: 1, overflowY: 'auto', padding: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
//               {TOOLS.map(tool => (
//                 <ToolRow
//                   key={tool.id}
//                   tool={tool}
//                   selected={isSelected(tool.id)}
//                   active={activeTab === tool.id}
//                   modified={getNonDefaults(tool.id) > 0}
//                   onCheck={() => handleCheck(tool.id)}
//                   onOpen={() => handleOpen(tool.id)}
//                 />
//               ))}
//             </div>

//             <div style={{ padding: '9px 14px', flexShrink: 0, borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
//               {[
//                 { label: 'Select all', g: true, action: () => { setSelected(TOOLS.map(t => t.id)); if (!activeTab) setActiveTab(TOOLS[0].id); } },
//                 { label: '·', sep: true },
//                 { label: 'Clear', g: false, action: () => { setSelected([]); setOptions({}); setActiveTab(null); } },
//               ].map((item: any, i) =>
//                 item.sep ? <span key={i} style={{ ...MONO, fontSize: 10, color: 'var(--text-ghost)' }}>·</span> : (
//                   <button key={i} type="button" onClick={item.action}
//                     onMouseEnter={e => (e.currentTarget.style.color = item.g ? 'var(--accent)' : 'var(--danger)')}
//                     onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
//                     style={{ ...MONO, fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-faint)', transition: 'color .13s' }}>
//                     {item.label}
//                   </button>
//                 )
//               )}
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div className="sf-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-deep)' }}>
//             {showConfig ? (
//               <ConfigContent
//                 tool={activeToolDef!}
//                 options={activeOpts}
//                 nonDefaultCount={getNonDefaults(activeTab!)}
//                 onFieldChange={(k, v) => activeTab && handleFieldChange(activeTab, k, v)}
//               />
//             ) : (
//               <ConfigEmpty />
//             )}
//           </div>

//         </div>
//       </div>
//     </>
//   );
// }
