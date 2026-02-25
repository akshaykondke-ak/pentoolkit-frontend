// src/components/scheduled-scans/ScheduledScanForm.tsx
// src/components/scheduled-scans/ScheduledScanForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import CronPreview from './CronPreview';
import {
  TOOLS,
  getTool,
  getToolDefaults,
  ToolOptionField,
  SelectField,
  ToggleField,
  NumberField,
} from '@/lib/config/tools';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// ─── Cron presets ─────────────────────────────────────────────────────────────

const PRESETS = [
  { key: 'hourly',         label: 'Hourly',         cron: '0 * * * *',  icon: '⏱' },
  { key: 'daily_9am',      label: 'Daily 9 AM',     cron: '0 9 * * *',  icon: '☀' },
  { key: 'daily_midnight', label: 'Midnight',        cron: '0 0 * * *',  icon: '🌙' },
  { key: 'weekly_monday',  label: 'Mon 9 AM',        cron: '0 9 * * 1',  icon: 'M' },
  { key: 'weekly_friday',  label: 'Fri 9 AM',        cron: '0 9 * * 5',  icon: 'F' },
  { key: 'monthly_1st',    label: '1st Monthly',     cron: '0 9 1 * *',  icon: '1' },
  { key: 'custom',         label: 'Custom',          cron: '',            icon: '~' },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'target',   label: 'Target',   short: '01' },
  { id: 'schedule', label: 'Schedule', short: '02' },
  { id: 'tools',    label: 'Tools',    short: '03' },
  { id: 'notify',   label: 'Notify',   short: '04' },
];

type StepId = 'target' | 'schedule' | 'tools' | 'notify';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  existing?: {
    id: string;
    label?: string;
    target: string;
    tools: string[];
    options?: Record<string, Record<string, any>>;
    preset_key?: string;
    cron_expression: string;
    notify_on_complete: boolean;
    notify_on_failure: boolean;
  };
}

// ─── Field components ─────────────────────────────────────────────────────────

function SelectFieldView({ field, value, onChange }: {
  field: SelectField; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {field.label}
      </p>
      <div className="flex flex-col gap-1.5">
        {field.choices.map(choice => {
          const on = value === choice.value;
          return (
            <div
              key={choice.value}
              onClick={() => onChange(choice.value)}
              className="flex items-start gap-3 p-2.5 rounded cursor-pointer transition-all"
              style={{
                border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
                backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-hover)',
              }}
            >
              <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {on && <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--accent)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: on ? 'var(--accent)' : 'var(--text-secondary)', ...mono }}>
                    {choice.label}
                  </span>
                  {choice.requiresNote && (
                    <span className="text-xs px-1 py-0.5 rounded" style={{ color: 'var(--warn)', backgroundColor: 'var(--warn-dim)', border: '1px solid rgba(255,170,0,.15)', ...mono, fontSize: 9 }}>
                      {choice.requiresNote}
                    </span>
                  )}
                  <span className="ml-auto text-xs px-1 py-0.5 rounded flex-shrink-0" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', ...mono, fontSize: 9 }}>
                    {choice.time}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.5, fontSize: 10 }}>{choice.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleFieldView({ field, value, onChange }: {
  field: ToggleField; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-2.5 rounded"
      style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>{field.label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.5 }}>{field.desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function NumberFieldView({ field, value, onChange }: {
  field: NumberField; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="p-2.5 rounded" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
      <div className="flex items-baseline justify-between mb-0.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>{field.label}</p>
        <span className="text-base font-bold" style={{ color: 'var(--accent)', ...mono }}>{value}</span>
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.5 }}>{field.desc}</p>
      <input type="range" min={field.min} max={field.max} value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
      <div className="flex justify-between mt-0.5" style={{ color: 'var(--text-faint)', ...mono, fontSize: 9 }}>
        <span>{field.min}</span><span>{field.max}</span>
      </div>
    </div>
  );
}

function FieldView({ field, value, onChange }: {
  field: ToolOptionField; value: any; onChange: (k: string, v: any) => void;
}) {
  if (field.type === 'select') return <SelectFieldView field={field as SelectField} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'toggle') return <ToggleFieldView field={field as ToggleField} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'number') return <NumberFieldView field={field as NumberField} value={value} onChange={v => onChange(field.key, v)} />;
  return null;
}

// ─── Shared Toggle ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      flexShrink: 0, position: 'relative', width: 36, height: 20, borderRadius: 10,
      background: value ? 'var(--accent-dim)' : 'var(--bg-base)',
      border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
      cursor: 'pointer', transition: 'all .2s',
    }}>
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 'calc(100% - 17px)' : 3,
        width: 12, height: 12, borderRadius: '50%',
        background: value ? 'var(--accent)' : 'var(--border-strong)',
        transition: 'all .2s',
      }} />
    </button>
  );
}

// ─── Error helper ─────────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  const e = err as any;
  if (e?.response?.data?.detail) {
    const d = e.response.data.detail;
    if (Array.isArray(d)) return d.map((x: any) => x.msg).join(', ');
    if (typeof d === 'string') return d;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current, onNavigate, completed }: {
  current: StepId;
  onNavigate: (s: StepId) => void;
  completed: Set<StepId>;
}) {
  const currentIdx = STEPS.findIndex(s => s.id === current);

  return (
    <div className="flex items-center gap-0" style={{ ...mono }}>
      {STEPS.map((step, i) => {
        const isActive    = step.id === current;
        const isDone      = completed.has(step.id as StepId);
        const isReachable = i <= currentIdx || isDone;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => isReachable && onNavigate(step.id as StepId)}
              disabled={!isReachable}
              className="flex items-center gap-2 px-3 py-1.5 transition-all"
              style={{
                cursor: isReachable ? 'pointer' : 'default',
                opacity: isReachable ? 1 : 0.35,
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <span
                className="flex items-center justify-center text-xs font-bold"
                style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  fontSize: 9,
                  backgroundColor: isActive
                    ? 'var(--accent)'
                    : isDone
                      ? 'var(--accent-dim)'
                      : 'var(--bg-hover)',
                  border: `1px solid ${isActive
                    ? 'var(--accent)'
                    : isDone
                      ? 'var(--accent-border)'
                      : 'var(--border-strong)'}`,
                  color: isActive
                    ? 'var(--bg-base)'
                    : isDone
                      ? 'var(--accent)'
                      : 'var(--text-faint)',
                }}
              >
                {isDone && !isActive ? '✓' : step.short}
              </span>
              <span
                className="text-xs font-semibold tracking-wider"
                style={{
                  color: isActive
                    ? 'var(--text-primary)'
                    : isDone
                      ? 'var(--text-muted)'
                      : 'var(--text-faint)',
                }}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span style={{ color: 'var(--border-strong)', fontSize: 10, padding: '0 2px' }}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step panels ──────────────────────────────────────────────────────────────

function TargetStep({ label, setLabel, target, setTarget, onNext, error, setError }: {
  label: string; setLabel: (v: string) => void;
  target: string; setTarget: (v: string) => void;
  onNext: () => void; error: string | null; setError: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <p className="text-xs mb-1" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Label <span style={{ color: 'var(--text-ghost)' }}>— optional</span>
        </p>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Weekly prod scan"
          className="w-full px-3 py-2.5 text-sm rounded outline-none transition-colors"
          style={{
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', ...mono,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)', ...mono }}>
          A friendly name to identify this schedule in your list.
        </p>
      </div>

      <div>
        <p className="text-xs mb-1" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Target <span style={{ color: 'var(--danger)', fontSize: 9 }}>required</span>
        </p>
        <div
          className="flex items-center rounded overflow-hidden transition-colors"
          style={{ border: `1px solid ${error ? 'var(--danger-border)' : 'var(--border-strong)'}`, backgroundColor: 'var(--bg-hover)' }}
          onFocusCapture={e => !error && (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onBlurCapture={e  => !error && (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        >
          <span className="px-3 text-sm select-none" style={{ color: 'var(--accent)' }}>▸</span>
          <input
            type="text"
            value={target}
            onChange={e => { setTarget(e.target.value); setError(null); }}
            placeholder="example.com · 192.168.1.1 · 10.0.0.0/24"
            className="flex-1 py-2.5 pr-3 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', ...mono }}
          />
        </div>
        {error
          ? <p className="text-xs mt-1.5" style={{ color: 'var(--danger)', ...mono }}>{error}</p>
          : <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)', ...mono }}>Domain, IP address, or CIDR range to scan on schedule.</p>
        }
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!target.trim()}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest rounded transition-opacity w-fit"
        style={{
          color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
          border: '1px solid var(--accent-border)', ...mono,
          opacity: target.trim() ? 1 : 0.35,
          cursor: target.trim() ? 'pointer' : 'not-allowed',
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}
      >
        Next — Schedule
        <span style={{ fontSize: 12 }}>›</span>
      </button>
    </div>
  );
}

function ScheduleStep({ selectedPreset, setPreset, customCron, setCustomCron, activeCron, onNext, onBack }: {
  selectedPreset: string; setPreset: (v: string) => void;
  customCron: string; setCustomCron: (v: string) => void;
  activeCron: string; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Preset schedules
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map(p => {
            const on = selectedPreset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                className="flex flex-col items-center gap-1.5 p-3 rounded transition-all"
                style={{
                  border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-hover)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
              >
                <span className="flex items-center justify-center w-7 h-7 rounded text-sm font-bold"
                  style={{
                    backgroundColor: on ? 'var(--accent)' : 'var(--bg-base)',
                    color: on ? 'var(--bg-base)' : 'var(--text-muted)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border-default)'}`,
                    ...mono,
                  }}>
                  {p.icon}
                </span>
                <span className="text-center leading-tight" style={{ color: on ? 'var(--accent)' : 'var(--text-secondary)', ...mono, fontSize: 10, fontWeight: 600 }}>
                  {p.label}
                </span>
                {p.cron && (
                  <span style={{ color: on ? 'var(--accent)' : 'var(--text-faint)', fontSize: 9, ...mono, opacity: 0.8 }}>
                    {p.cron}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPreset === 'custom' && (
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Custom expression
            <span className="ml-2 normal-case" style={{ color: 'var(--text-ghost)', fontSize: 10 }}>min hour dom month dow</span>
          </p>
          <input
            type="text"
            value={customCron}
            onChange={e => setCustomCron(e.target.value)}
            placeholder="0 9 * * 1"
            className="w-full px-3 py-2.5 text-sm rounded outline-none"
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)', ...mono,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          />
        </div>
      )}

      <CronPreview value={activeCron} />

      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-xs rounded transition-colors"
          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
          ‹ Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!activeCron.trim()}
          className="flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest rounded transition-opacity"
          style={{
            color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)', ...mono,
            opacity: activeCron.trim() ? 1 : 0.35,
            cursor: activeCron.trim() ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
          Next — Tools ›
        </button>
      </div>
    </div>
  );
}

function ToolsStep({ selectedTools, handleCheck, handleOpen, activeTab, activeToolDef, activeOpts, getNonDefaults, handleFieldChange, isSelected, onNext, onBack }: {
  selectedTools: string[];
  handleCheck: (id: string) => void;
  handleOpen: (id: string) => void;
  activeTab: string | null;
  activeToolDef: any;
  activeOpts: Record<string, any>;
  getNonDefaults: (id: string) => number;
  handleFieldChange: (toolId: string, key: string, val: any) => void;
  isSelected: (id: string) => boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const showConfig = activeToolDef && isSelected(activeToolDef.id);

  return (
    <div className="flex gap-5" style={{ minHeight: 360 }}>
      {/* Tool list */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 200 }}>
        <p className="text-xs mb-3" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Select tools
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold"
            style={{
              backgroundColor: selectedTools.length > 0 ? 'var(--accent-dim)' : 'transparent',
              color: selectedTools.length > 0 ? 'var(--accent)' : 'var(--text-ghost)',
              border: `1px solid ${selectedTools.length > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
            }}>
            {selectedTools.length}
          </span>
        </p>

        <div className="flex flex-col gap-1 flex-1">
          {TOOLS.map(tool => {
            const selected = isSelected(tool.id);
            const active   = activeTab === tool.id;
            const modified = getNonDefaults(tool.id) > 0;

            return (
              <div
                key={tool.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded cursor-pointer transition-all"
                style={{
                  border: `1px solid ${active ? 'var(--border-default)' : 'transparent'}`,
                  backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                {active && (
                  <div style={{ position: 'absolute', left: 0, top: 5, bottom: 5, width: 2, borderRadius: 1, backgroundColor: tool.color }} />
                )}
                <div
                  onClick={e => { e.stopPropagation(); handleCheck(tool.id); }}
                  style={{
                    width: 13, height: 13, borderRadius: 2, flexShrink: 0,
                    border: `1.5px solid ${selected ? tool.color : 'var(--border-strong)'}`,
                    backgroundColor: selected ? tool.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s', cursor: 'pointer',
                  }}
                >
                  {selected && (
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0" onClick={() => handleOpen(tool.id)}>
                  <p className="text-xs font-semibold truncate" style={{ color: selected ? tool.color : 'var(--text-muted)', ...mono }}>{tool.label}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-faint)', ...mono, fontSize: 10 }}>{tool.desc}</p>
                </div>
                {modified && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }} />}
                {selected && <span className="flex-shrink-0 text-xs" style={{ color: active ? 'var(--accent)' : 'var(--text-faint)', ...mono }}>›</span>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
          <button type="button"
            onClick={() => { handleOpen(TOOLS[0]?.id ?? ''); TOOLS.forEach(t => handleCheck(t.id)); }}
            className="text-xs transition-colors" style={{ color: 'var(--text-faint)', ...mono }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}>
            All
          </button>
          <span style={{ color: 'var(--text-ghost)', fontSize: 10 }}>·</span>
          <button type="button"
            onClick={() => TOOLS.forEach(t => { if (isSelected(t.id)) handleCheck(t.id); })}
            className="text-xs transition-colors" style={{ color: 'var(--text-faint)', ...mono }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--danger)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}>
            None
          </button>
        </div>
      </div>

      {/* Config panel */}
      <div className="flex-1 rounded overflow-hidden" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
        {!showConfig ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-faint)', minHeight: 280 }}>
            <div className="w-10 h-10 rounded flex items-center justify-center"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2l1.5 3h3l-2.5 2 1 3L8 8.5 5 10l1-3L3.5 5h3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)', ...mono }}>No tool selected</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)', ...mono }}>Click a tool to configure</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeToolDef.color, boxShadow: `0 0 6px ${activeToolDef.color}66` }} />
                <h3 className="text-sm font-bold" style={{ color: activeToolDef.color, ...mono }}>{activeToolDef.label}</h3>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', ...mono }}>
                    {activeToolDef.fields.length} option{activeToolDef.fields.length !== 1 ? 's' : ''}
                  </span>
                  {activeTab && getNonDefaults(activeTab) > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', ...mono }}>
                      ✦ {getNonDefaults(activeTab)} modified
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)', ...mono }}>{activeToolDef.desc}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeToolDef.fields.length > 0 ? (
                activeToolDef.fields.map((field: ToolOptionField) => (
                  <FieldView
                    key={field.key}
                    field={field}
                    value={activeOpts[field.key] !== undefined ? activeOpts[field.key] : field.default}
                    onChange={(k, v) => activeTab && handleFieldChange(activeTab, k, v)}
                  />
                ))
              ) : (
                <div className="flex items-start gap-3 p-3 rounded" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>Runs with optimal defaults</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.6 }}>
                      {activeToolDef.label} requires no configuration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons — below the two-column layout */}
      <div />
    </div>
  );
}

// ─── Review summary ───────────────────────────────────────────────────────────

function ReviewRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-xs flex-shrink-0 w-20" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>
        {label}
      </span>
      <span className="text-xs font-semibold flex-1" style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)', ...mono }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScheduledScanForm({ existing }: Props) {
  const router  = useRouter();
  const isEdit  = !!existing;

  const initPreset = existing?.preset_key
    ? (PRESETS.find(p => p.key === existing.preset_key) ? existing.preset_key : 'custom')
    : 'daily_9am';

  // ── State ────────────────────────────────────────────────────────────────────
  const [step,           setStep]           = useState<StepId>(isEdit ? 'target' : 'target');
  const [completed,      setCompleted]      = useState<Set<StepId>>(
    isEdit ? new Set<StepId>(['target', 'schedule', 'tools', 'notify']) : new Set<StepId>()
  );

  // Step 1 — target
  const [label,          setLabel]          = useState(existing?.label ?? '');
  const [target,         setTarget]         = useState(existing?.target ?? '');
  const [targetError,    setTargetError]    = useState<string | null>(null);

  // Step 2 — schedule
  const [selectedPreset, setPreset]         = useState(initPreset);
  const [customCron,     setCustomCron]     = useState(
    initPreset === 'custom' ? (existing?.cron_expression ?? '') : ''
  );

  // Step 3 — tools
  const [selectedTools,  setSelectedTools]  = useState<string[]>(existing?.tools ?? ['nmap']);
  const [options,        setOptions]        = useState<Record<string, Record<string, any>>>(existing?.options ?? {});
  const [activeTab,      setActiveTab]      = useState<string | null>(existing?.tools?.[0] ?? 'nmap');

  // Step 4 — notify
  const [notifyComplete, setNotifyComplete] = useState(existing?.notify_on_complete ?? true);
  const [notifyFail,     setNotifyFail]     = useState(existing?.notify_on_failure ?? true);

  // Submission
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeCron = selectedPreset === 'custom'
    ? customCron
    : (PRESETS.find(p => p.key === selectedPreset)?.cron ?? '');

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goTo = (s: StepId) => setStep(s);

  const markComplete = (s: StepId) => {
    setCompleted(prev => new Set([...prev, s]));
  };

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      markComplete(step);
      setStep(STEPS[stepIndex + 1].id as StepId);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id as StepId);
  };

  // ── Tool helpers ─────────────────────────────────────────────────────────────
  const isSelected = (id: string) => selectedTools.includes(id);

  const getNonDefaults = useCallback((id: string) => {
    const tool = getTool(id);
    const opts = options[id] ?? {};
    if (!tool) return 0;
    return tool.fields.filter(f => opts[f.key] !== undefined && opts[f.key] !== f.default).length;
  }, [options]);

  const handleCheck = useCallback((id: string) => {
    setSelectedTools(prev => {
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
    if (!selectedTools.includes(id)) setSelectedTools(p => [...p, id]);
    setActiveTab(id);
  }, [selectedTools]);

  const handleFieldChange = useCallback((toolId: string, key: string, val: any) => {
    setOptions(prev => ({
      ...prev,
      [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val },
    }));
  }, []);

  const activeToolDef = activeTab ? (getTool(activeTab) ?? null) : null;
  const activeOpts    = activeTab ? (options[activeTab] ?? {}) : {};

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null);
    setLoading(true);
    try {
      const filtered: Record<string, any> = {};
      for (const id of selectedTools) {
        const o = options[id];
        if (o && Object.keys(o).length) filtered[id] = o;
      }

      const payload: Record<string, unknown> = {
        label:              label.trim() || undefined,
        target:             target.trim(),
        tools:              selectedTools,
        notify_on_complete: notifyComplete,
        notify_on_failure:  notifyFail,
        ...(Object.keys(filtered).length ? { options: filtered } : {}),
      };

      if (selectedPreset !== 'custom') {
        payload.preset_key = selectedPreset;
      } else {
        payload.cron_expression = customCron.trim();
      }

      if (isEdit) {
        await apiClient.put(`/api/v1/scheduled-scans/${existing!.id}`, payload);
      } else {
        await apiClient.post('/api/v1/scheduled-scans', payload);
      }

      router.push('/dashboard/scheduled-scans');
    } catch (e) {
      setSubmitError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && target.trim() && selectedTools.length > 0 && activeCron.trim();

  // ── Notify step (inline) ──────────────────────────────────────────────────────
  const NotifyStep = (
    <div className="flex flex-col gap-5 max-w-lg">
      <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.7 }}>
        Choose when to receive email notifications for this scheduled scan.
      </p>

      <div className="flex flex-col gap-2">
        {[
          { key: 'complete', label: 'On completion', desc: 'Email when a scheduled scan finishes successfully', value: notifyComplete, onChange: setNotifyComplete },
          { key: 'failure',  label: 'On failure',    desc: 'Email if a scheduled scan errors or times out',   value: notifyFail,     onChange: setNotifyFail },
        ].map(row => (
          <div key={row.key}
            className="flex items-center justify-between gap-6 px-4 py-3 rounded"
            style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>{row.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)', ...mono }}>{row.desc}</p>
            </div>
            <Toggle value={row.value} onChange={row.onChange} />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        <div className="px-4 py-2.5" style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-default)' }}>
          <p className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-muted)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Review
          </p>
        </div>
        <div className="px-4" style={{ backgroundColor: 'var(--bg-card)' }}>
          <ReviewRow label="Target" value={target} accent />
          {label && <ReviewRow label="Label" value={label} />}
          <ReviewRow label="Schedule" value={activeCron} accent />
          <ReviewRow label="Tools" value={selectedTools.join(', ')} />
          <ReviewRow label="Notify" value={`${notifyComplete ? 'On complete' : ''}${notifyComplete && notifyFail ? ' · ' : ''}${notifyFail ? 'On failure' : ''}${!notifyComplete && !notifyFail ? 'Off' : ''}`} />
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded text-xs"
          style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-dim)', border: '1px solid var(--danger-border)', ...mono }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 4v2.2M6 7.8h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {submitError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={goBack}
          className="flex items-center gap-1.5 px-4 py-2 text-xs rounded transition-colors"
          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
          ‹ Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-6 py-2 text-xs font-bold tracking-widest rounded transition-opacity"
          style={{
            color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)', ...mono,
            opacity: canSubmit ? 1 : 0.35,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
          {loading ? (
            <>
              <span className="w-3 h-3 rounded-full animate-spin" style={{
                borderWidth: 1.5, borderStyle: 'solid',
                borderTopColor: 'transparent',
                borderRightColor: 'var(--accent)',
                borderBottomColor: 'var(--accent)',
                borderLeftColor: 'var(--accent)',
              }} />
              {isEdit ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            isEdit ? '✓ Save changes' : '✓ Create schedule'
          )}
        </button>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden" style={mono}>

      {/* ── Header ── */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/scheduled-scans"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M7 2L4 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </Link>
            <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-default)' }} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
                <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  {isEdit ? 'scheduled-scans --edit' : 'scheduled-scans --new'}
                </span>
              </div>
              <h1 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {isEdit ? 'Edit Scheduled Scan' : 'New Scheduled Scan'}
              </h1>
            </div>
          </div>

          {/* Step bar in header */}
          <StepBar current={step} onNavigate={goTo} completed={completed} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">

          {/* Step label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center text-xs font-bold"
              style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-base)', ...mono,
                fontSize: 10,
              }}>
              {STEPS.findIndex(s => s.id === step) + 1}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', ...mono }}>
                {STEPS.find(s => s.id === step)?.label}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono }}>
                {step === 'target'   && 'Define what to scan'}
                {step === 'schedule' && 'Set when to run'}
                {step === 'tools'    && 'Choose security tools'}
                {step === 'notify'   && 'Configure alerts & confirm'}
              </p>
            </div>
          </div>

          {/* Step content */}
          {step === 'target' && (
            <TargetStep
              label={label} setLabel={setLabel}
              target={target} setTarget={setTarget}
              onNext={() => { if (!target.trim()) { setTargetError('Target is required'); return; } goNext(); }}
              error={targetError}
              setError={setTargetError}
            />
          )}

          {step === 'schedule' && (
            <ScheduleStep
              selectedPreset={selectedPreset} setPreset={setPreset}
              customCron={customCron} setCustomCron={setCustomCron}
              activeCron={activeCron}
              onNext={goNext} onBack={goBack}
            />
          )}

          {step === 'tools' && (
            <div className="flex flex-col gap-5">
              <ToolsStep
                selectedTools={selectedTools}
                handleCheck={handleCheck}
                handleOpen={handleOpen}
                activeTab={activeTab}
                activeToolDef={activeToolDef}
                activeOpts={activeOpts}
                getNonDefaults={getNonDefaults}
                handleFieldChange={handleFieldChange}
                isSelected={isSelected}
                onNext={goNext}
                onBack={goBack}
              />
              <div className="flex items-center gap-3">
                <button type="button" onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded transition-colors"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
                  ‹ Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={selectedTools.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest rounded transition-opacity"
                  style={{
                    color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)', ...mono,
                    opacity: selectedTools.length > 0 ? 1 : 0.35,
                    cursor: selectedTools.length > 0 ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                  }}>
                  Next — Notify ›
                </button>
              </div>
            </div>
          )}

          {step === 'notify' && NotifyStep}
        </div>
      </div>
    </div>
  );
}
