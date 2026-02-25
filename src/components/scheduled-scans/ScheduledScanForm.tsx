// src/components/scheduled-scans/ScheduledScanForm.tsx
// src/components/scheduled-scans/ScheduledScanForm.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import CronPreview from './CronPreview';
import {
  TOOLS, getTool, getToolDefaults,
  ToolOptionField, SelectField, ToggleField, NumberField,
} from '@/lib/config/tools';

// ─── Design tokens ────────────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" };

const PRESETS = [
  { key: 'hourly',         label: 'Every hour',     sub: 'Continuous monitoring',   cron: '0 * * * *',  glyph: '⟳' },
  { key: 'daily_9am',      label: 'Daily at 9 AM',  sub: 'Morning digest',          cron: '0 9 * * *',  glyph: '☀' },
  { key: 'daily_midnight', label: 'Daily midnight', sub: 'Off-hours scan',          cron: '0 0 * * *',  glyph: '◑' },
  { key: 'weekly_monday',  label: 'Mon 9 AM',       sub: 'Start of week',           cron: '0 9 * * 1',  glyph: 'M' },
  { key: 'weekly_friday',  label: 'Fri 9 AM',       sub: 'End of week',             cron: '0 9 * * 5',  glyph: 'F' },
  { key: 'monthly_1st',    label: '1st of month',   sub: 'Monthly sweep',           cron: '0 9 1 * *',  glyph: '1' },
  { key: 'custom',         label: 'Custom cron',    sub: 'Advanced scheduling',     cron: '',            glyph: '~' },
];

type StepId = 0 | 1 | 2 | 3;
const STEP_LABELS = ['Target', 'Schedule', 'Tools', 'Launch'];
const STEP_DESCS  = [
  'Define the asset to monitor',
  'Set execution frequency',
  'Configure security tools',
  'Review & deploy',
];

interface Props {
  existing?: {
    id: string; label?: string; target: string; tools: string[];
    options?: Record<string, Record<string, any>>;
    preset_key?: string; cron_expression: string;
    notify_on_complete: boolean; notify_on_failure: boolean;
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function err(e: unknown): string {
  const x = e as any;
  if (x?.response?.data?.detail) {
    const d = x.response.data.detail;
    return Array.isArray(d) ? d.map((m: any) => m.msg).join(', ') : String(d);
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Pill({ on, children }: { on?: boolean; children: React.ReactNode }) {
  return (
    <span style={{
      ...MONO, fontSize: 9, padding: '2px 6px', borderRadius: 3,
      border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
      backgroundColor: on ? 'var(--accent-dim)' : 'transparent',
      color: on ? 'var(--accent)' : 'var(--text-faint)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>{children}</span>
  );
}

function GlowToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      position: 'relative', width: 44, height: 24, borderRadius: 12, flexShrink: 0,
      background: value ? 'var(--accent-dim)' : 'var(--bg-base)',
      border: `1.5px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
      cursor: 'pointer', transition: 'all .25s',
      boxShadow: value ? '0 0 12px var(--accent-glow)' : 'none',
    }}>
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 'calc(100% - 19px)' : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: value ? 'var(--accent)' : 'var(--border-strong)',
        transition: 'left .25s',
        boxShadow: value ? '0 0 8px var(--accent)' : 'none',
      }} />
    </button>
  );
}

// ─── Field renderers ──────────────────────────────────────────────────────────
function SelectFieldView({ field, value, onChange }: { field: SelectField; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>{field.label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {field.choices.map(c => {
          const on = value === c.value;
          return (
            <div key={c.value} onClick={() => onChange(c.value)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 6,
              border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
              backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-hover)',
              cursor: 'pointer', transition: 'all .15s',
              boxShadow: on ? '0 0 12px var(--accent-glow)' : 'none',
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}>
                {on && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...MONO, fontSize: 11, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 2 }}>{c.label}</p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.4 }}>{c.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleFieldView({ field, value, onChange }: { field: ToggleField; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '10px 14px', borderRadius: 6,
      border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)',
    }}>
      <div>
        <p style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>{field.label}</p>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)' }}>{field.desc}</p>
      </div>
      <GlowToggle value={value} onChange={onChange} />
    </div>
  );
}

function NumberFieldView({ field, value, onChange }: { field: NumberField; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <p style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{field.label}</p>
        <span style={{ ...MONO, fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{value}</span>
      </div>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', marginBottom: 10 }}>{field.desc}</p>
      <input type="range" min={field.min} max={field.max} value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', ...MONO, fontSize: 9, color: 'var(--text-faint)', marginTop: 4 }}>
        <span>{field.min}</span><span>{field.max}</span>
      </div>
    </div>
  );
}

function FieldView({ field, value, onChange }: { field: ToolOptionField; value: any; onChange: (k: string, v: any) => void }) {
  if (field.type === 'select') return <SelectFieldView field={field as SelectField} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'toggle') return <ToggleFieldView field={field as ToggleField} value={value} onChange={v => onChange(field.key, v)} />;
  if (field.type === 'number') return <NumberFieldView field={field as NumberField} value={value} onChange={v => onChange(field.key, v)} />;
  return null;
}

// ─── Left rail — vertical step indicator ─────────────────────────────────────
function StepRail({ step, visitedMax, onNavigate }: {
  step: StepId; visitedMax: StepId; onNavigate: (s: StepId) => void;
}) {
  return (
    <div style={{
      width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: 32, paddingBottom: 32, gap: 0,
      borderRight: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-card)',
      position: 'relative',
    }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', top: 56, bottom: 56, width: 1, left: 31,
        background: 'linear-gradient(to bottom, var(--accent-border), var(--border-default))',
      }} />

      {([0, 1, 2, 3] as StepId[]).map(i => {
        const isActive  = step === i;
        const isDone    = i < step || i <= visitedMax;
        const canClick  = i <= visitedMax;

        return (
          <button key={i} type="button"
            onClick={() => canClick && onNavigate(i)}
            title={STEP_LABELS[i]}
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              marginBottom: i < 3 ? 28 : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1,
              cursor: canClick ? 'pointer' : 'default',
              border: `2px solid ${isActive ? 'var(--accent)' : isDone ? 'var(--accent-border)' : 'var(--border-strong)'}`,
              backgroundColor: isActive ? 'var(--accent)' : isDone ? 'var(--accent-dim)' : 'var(--bg-hover)',
              boxShadow: isActive ? '0 0 0 4px var(--accent-glow), 0 0 16px var(--accent-border)' : 'none',
              transition: 'all .3s',
              ...MONO, fontSize: 10, fontWeight: 900,
              color: isActive ? 'var(--bg-base)' : isDone ? 'var(--accent)' : 'var(--text-faint)',
            }}>
            {isDone && !isActive ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : String(i + 1)}
          </button>
        );
      })}

      {/* Step label tooltip — abbreviated */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        ...MONO, fontSize: 8, color: 'var(--text-ghost)', textTransform: 'uppercase',
        letterSpacing: '0.08em', whiteSpace: 'nowrap', writingMode: 'vertical-rl',
        textOrientation: 'mixed',
      }}>
        {STEP_LABELS[step]}
      </div>
    </div>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────────
function TopBar({ step, isEdit }: { step: StepId; isEdit: boolean }) {
  const pct = Math.round(((step) / 3) * 100);

  return (
    <div style={{
      height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
      paddingLeft: 24, paddingRight: 24, gap: 16,
      borderBottom: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-card)',
    }}>
      <Link href="/dashboard/scheduled-scans"
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 4, border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)',
          textDecoration: 'none', ...MONO, fontSize: 10, transition: 'all .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Schedules
      </Link>

      <span style={{ width: 1, height: 18, backgroundColor: 'var(--border-default)', flexShrink: 0 }} />

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--accent)' }}>$</span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)' }}>
          {isEdit ? 'sched --edit' : 'sched --new'}
        </span>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--border-strong)' }}>›</span>
        <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
          {STEP_LABELS[step]}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 120, height: 3, borderRadius: 2, backgroundColor: 'var(--bg-hover)',
          overflow: 'hidden', border: '1px solid var(--border-default)',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--accent-border), var(--accent))',
            transition: 'width .4s ease',
            boxShadow: '0 0 6px var(--accent)',
          }} />
        </div>
        <span style={{ ...MONO, fontSize: 9, color: 'var(--text-faint)', width: 28 }}>
          {step + 1}/4
        </span>
      </div>
    </div>
  );
}

// ─── Bottom action bar ────────────────────────────────────────────────────────
function ActionBar({ step, onBack, onNext, nextLabel, nextDisabled, loading }: {
  step: StepId; onBack?: () => void; onNext: () => void;
  nextLabel: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div style={{
      height: 60, flexShrink: 0, display: 'flex', alignItems: 'center',
      paddingLeft: 32, paddingRight: 32, gap: 12,
      borderTop: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-card)',
    }}>
      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {([0,1,2,3] as StepId[]).map(i => (
          <div key={i} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
            backgroundColor: i === step ? 'var(--accent)' : i < step ? 'var(--accent-border)' : 'var(--border-strong)',
            transition: 'all .3s', boxShadow: i === step ? '0 0 6px var(--accent)' : 'none',
          }} />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {onBack && (
        <button type="button" onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 4,
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-muted)', cursor: 'pointer',
          ...MONO, fontSize: 11, transition: 'all .15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          ‹ Back
        </button>
      )}

      <button type="button" onClick={onNext} disabled={nextDisabled} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 24px', borderRadius: 4,
        border: `1.5px solid ${nextDisabled ? 'var(--border-default)' : 'var(--accent-border)'}`,
        backgroundColor: nextDisabled ? 'var(--bg-hover)' : 'var(--accent-dim)',
        color: nextDisabled ? 'var(--text-ghost)' : 'var(--accent)',
        cursor: nextDisabled ? 'not-allowed' : 'pointer',
        opacity: nextDisabled ? 0.4 : 1,
        ...MONO, fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        boxShadow: nextDisabled ? 'none' : '0 0 16px var(--accent-glow)',
        transition: 'all .2s',
      }}>
        {loading && (
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            borderWidth: 1.5, borderStyle: 'solid',
            borderTopColor: 'transparent', borderRightColor: 'var(--accent)',
            borderBottomColor: 'var(--accent)', borderLeftColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite', display: 'inline-block',
          }} />
        )}
        {nextLabel}
      </button>
    </div>
  );
}

// ─── Step 0: Target ───────────────────────────────────────────────────────────
function TargetPanel({ label, setLabel, target, setTarget, error, setError }: {
  label: string; setLabel: (v: string) => void;
  target: string; setTarget: (v: string) => void;
  error: string | null; setError: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 48px',
      gap: 0,
    }}>
      {/* Hero section */}
      <div style={{ width: '100%', maxWidth: 640 }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
          Step 01 · Target
        </p>

        <h2 style={{ ...MONO, fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 8 }}>
          What are we<br />
          <span style={{ color: 'var(--accent)' }}>scanning?</span>
        </h2>
        <p style={{ ...MONO, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.7, marginBottom: 40 }}>
          Enter the domain, IP address, or CIDR range.<br />Every scheduled run will target this asset.
        </p>

        {/* Giant target input */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderRadius: 8, overflow: 'hidden',
          border: `2px solid ${error ? 'var(--danger-border)' : 'var(--border-strong)'}`,
          backgroundColor: 'var(--bg-card)',
          boxShadow: error ? '0 0 0 3px var(--danger-dim)' : '0 0 0 0px transparent',
          transition: 'all .2s',
          marginBottom: error ? 8 : 24,
        }}
          onFocusCapture={e => { if (!error) e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
          onBlurCapture={e  => { if (!error) e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = '0 0 0 0px transparent'; }}
        >
          <span style={{ padding: '0 18px', ...MONO, fontSize: 20, color: 'var(--accent)', userSelect: 'none', flexShrink: 0 }}>▸</span>
          <input ref={inputRef} type="text" value={target}
            onChange={e => { setTarget(e.target.value); setError(null); }}
            placeholder="example.com"
            style={{
              flex: 1, padding: '18px 0', ...MONO, fontSize: 20,
              color: 'var(--text-primary)', backgroundColor: 'transparent',
              border: 'none', outline: 'none',
            }}
          />
          {target && (
            <Pill on>{target.includes('/') ? 'CIDR' : /^\d+\.\d+/.test(target) ? 'IP' : 'HOST'}</Pill>
          )}
          <span style={{ width: 18 }} />
        </div>

        {error && (
          <p style={{ ...MONO, fontSize: 11, color: 'var(--danger)', marginBottom: 24 }}>⚠ {error}</p>
        )}

        {/* Label — understated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ ...MONO, fontSize: 9, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>optional label</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
        </div>
        <input type="text" value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Production API gateway"
          style={{
            width: '100%', padding: '10px 14px', ...MONO, fontSize: 12,
            color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-default)', borderRadius: 6, outline: 'none',
            transition: 'border-color .15s', boxSizing: 'border-box',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>
    </div>
  );
}

// ─── Step 1: Schedule ────────────────────────────────────────────────────────
function SchedulePanel({ selectedPreset, setPreset, customCron, setCustomCron, activeCron }: {
  selectedPreset: string; setPreset: (v: string) => void;
  customCron: string; setCustomCron: (v: string) => void;
  activeCron: string;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left — presets grid */}
      <div style={{
        flex: 1, padding: '32px 40px', overflowY: 'auto',
        borderRight: '1px solid var(--border-default)',
      }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
          Step 02 · Schedule
        </p>
        <h2 style={{ ...MONO, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
          When should it run?
        </h2>
        <p style={{ ...MONO, fontSize: 12, color: 'var(--text-faint)', marginBottom: 28, lineHeight: 1.6 }}>
          Choose a preset or define a custom cron expression.
        </p>

        {/* Preset grid — 2 columns, feels spatial */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {PRESETS.map(p => {
            const on = selectedPreset === p.key;
            return (
              <button key={p.key} type="button" onClick={() => setPreset(p.key)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 8, textAlign: 'left',
                border: `1.5px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
                backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-card)',
                cursor: 'pointer', transition: 'all .2s',
                boxShadow: on ? '0 0 20px var(--accent-glow)' : 'none',
                outline: 'none',
              }}
                onMouseEnter={e => { if (!on) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; } }}
                onMouseLeave={e => { if (!on) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)'; } }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? 'var(--accent)' : 'var(--bg-hover)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border-default)'}`,
                  ...MONO, fontSize: 15, fontWeight: 700,
                  color: on ? 'var(--bg-base)' : 'var(--text-muted)',
                  boxShadow: on ? '0 0 12px var(--accent-border)' : 'none',
                  transition: 'all .2s',
                }}>
                  {p.glyph}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...MONO, fontSize: 12, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 2 }}>{p.label}</p>
                  <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)' }}>{p.sub}</p>
                  {p.cron && <p style={{ ...MONO, fontSize: 9, color: on ? 'var(--accent)' : 'var(--text-ghost)', marginTop: 4, opacity: 0.8 }}>{p.cron}</p>}
                </div>
                {on && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.5"/>
                    <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {selectedPreset === 'custom' && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>
              Expression <span style={{ color: 'var(--text-ghost)', letterSpacing: 0 }}>— min hour dom month dow</span>
            </p>
            <input type="text" value={customCron} onChange={e => setCustomCron(e.target.value)}
              placeholder="0 9 * * 1"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', ...MONO, fontSize: 16,
                color: 'var(--text-primary)', backgroundColor: 'var(--bg-hover)',
                border: '1.5px solid var(--border-strong)', borderRadius: 6, outline: 'none',
                letterSpacing: '0.06em', boxSizing: 'border-box', transition: 'border-color .15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            />
          </div>
        )}
      </div>

      {/* Right — cron preview panel */}
      <div style={{
        width: 300, flexShrink: 0, padding: '32px 24px', overflowY: 'auto',
        backgroundColor: 'var(--bg-card)',
      }}>
        <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 16 }}>Next runs</p>
        <CronPreview value={activeCron} />

        {activeCron && (
          <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 6, border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-dim)' }}>
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Expression</p>
            <p style={{ ...MONO, fontSize: 16, fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.06em' }}>{activeCron}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Tools ───────────────────────────────────────────────────────────
function ToolsPanel({ selectedTools, handleCheck, handleOpen, activeTab, activeToolDef, activeOpts, getNonDefaults, handleFieldChange, isSelected }: {
  selectedTools: string[]; handleCheck: (id: string) => void; handleOpen: (id: string) => void;
  activeTab: string | null; activeToolDef: any; activeOpts: Record<string, any>;
  getNonDefaults: (id: string) => number; handleFieldChange: (t: string, k: string, v: any) => void;
  isSelected: (id: string) => boolean;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* Left — tool grid/list */}
      <div style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', flexShrink: 0,
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-faint)', marginBottom: 2 }}>Step 03 · Tools</p>
            <p style={{ ...MONO, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Security scanners</p>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: selectedTools.length > 0 ? 'var(--accent-dim)' : 'var(--bg-base)',
            border: `1.5px solid ${selectedTools.length > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
            ...MONO, fontSize: 13, fontWeight: 900,
            color: selectedTools.length > 0 ? 'var(--accent)' : 'var(--text-ghost)',
            boxShadow: selectedTools.length > 0 ? '0 0 10px var(--accent-glow)' : 'none',
          }}>
            {selectedTools.length}
          </div>
        </div>

        {/* Tool list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {TOOLS.map(tool => {
            const selected = isSelected(tool.id);
            const active   = activeTab === tool.id;
            const modified = getNonDefaults(tool.id) > 0;

            return (
              <div key={tool.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 6, cursor: 'pointer',
                marginBottom: 2, position: 'relative',
                border: `1px solid ${active ? 'var(--border-default)' : 'transparent'}`,
                backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: 7, bottom: 7, width: 2.5, borderRadius: 2, backgroundColor: tool.color, boxShadow: `0 0 8px ${tool.color}` }} />}

                {/* Checkbox */}
                <div onClick={e => { e.stopPropagation(); handleCheck(tool.id); }} style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${selected ? tool.color : 'var(--border-strong)'}`,
                  backgroundColor: selected ? tool.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .12s', cursor: 'pointer',
                  boxShadow: selected ? `0 0 10px ${tool.color}66` : 'none',
                }}>
                  {selected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleOpen(tool.id)}>
                  <p style={{ ...MONO, fontSize: 11, fontWeight: 700, color: selected ? tool.color : 'var(--text-muted)', marginBottom: 1 }}>{tool.label}</p>
                  <p style={{ ...MONO, fontSize: 9, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.desc}</p>
                </div>

                {modified && <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />}
                {selected && <span style={{ ...MONO, fontSize: 12, color: active ? 'var(--accent)' : 'var(--text-faint)', flexShrink: 0 }}>›</span>}
              </div>
            );
          })}
        </div>

        {/* Bulk actions */}
        <div style={{
          padding: '10px 18px', flexShrink: 0,
          borderTop: '1px solid var(--border-default)',
          display: 'flex', gap: 16, alignItems: 'center',
        }}>
          <span style={{ ...MONO, fontSize: 9, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select:</span>
          {[
            { label: 'All',  action: () => TOOLS.forEach(t => { if (!isSelected(t.id)) handleCheck(t.id); }), col: 'var(--accent)' },
            { label: 'None', action: () => TOOLS.forEach(t => { if (isSelected(t.id))  handleCheck(t.id); }), col: 'var(--danger)' },
          ].map(b => (
            <button key={b.label} type="button" onClick={b.action} style={{
              ...MONO, fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, transition: 'color .15s',
            }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = b.col)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
            >{b.label}</button>
          ))}
        </div>
      </div>

      {/* Right — config panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
        {!activeToolDef || !isSelected(activeToolDef.id) ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)',
            }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="9" width="14" height="10" rx="2" stroke="var(--text-faint)" strokeWidth="1.3"/>
                <path d="M7 9V6a3 3 0 016 0v3" stroke="var(--text-faint)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...MONO, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Select a tool to configure</p>
              <p style={{ ...MONO, fontSize: 11, color: 'var(--text-faint)' }}>Check a tool on the left, then click its name</p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tool config header */}
            <div style={{
              padding: '16px 24px', flexShrink: 0,
              borderBottom: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                backgroundColor: activeToolDef.color,
                boxShadow: `0 0 12px ${activeToolDef.color}`,
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ ...MONO, fontSize: 14, fontWeight: 900, color: activeToolDef.color, marginBottom: 2 }}>{activeToolDef.label}</p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{activeToolDef.desc}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill>{activeToolDef.fields.length} opt</Pill>
                {activeTab && getNonDefaults(activeTab) > 0 && <Pill on>✦ {getNonDefaults(activeTab)} mod</Pill>}
              </div>
            </div>

            {/* Fields */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeToolDef.fields.length > 0 ? (
                activeToolDef.fields.map((field: ToolOptionField) => (
                  <FieldView key={field.key} field={field}
                    value={activeOpts[field.key] !== undefined ? activeOpts[field.key] : field.default}
                    onChange={(k, v) => activeTab && handleFieldChange(activeTab, k, v)} />
                ))
              ) : (
                <div style={{
                  display: 'flex', gap: 14, padding: '16px 18px', borderRadius: 8,
                  border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-dim)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'var(--accent)', color: 'var(--bg-base)',
                    boxShadow: '0 0 12px var(--accent-border)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ ...MONO, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No configuration needed</p>
                    <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {activeToolDef.label} runs optimally with built-in defaults. Just select it and proceed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Launch ───────────────────────────────────────────────────────────
function LaunchPanel({ notifyComplete, setNotifyComplete, notifyFail, setNotifyFail, target, label, activeCron, selectedTools, submitError, isEdit }: {
  notifyComplete: boolean; setNotifyComplete: (v: boolean) => void;
  notifyFail: boolean; setNotifyFail: (v: boolean) => void;
  target: string; label: string; activeCron: string; selectedTools: string[];
  submitError: string | null; isEdit: boolean;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* Left — notifications */}
      <div style={{
        flex: 1, padding: '32px 40px', overflowY: 'auto',
        borderRight: '1px solid var(--border-default)',
      }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
          Step 04 · Launch
        </p>
        <h2 style={{ ...MONO, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
          {isEdit ? 'Save your changes' : 'Ready to deploy?'}
        </h2>
        <p style={{ ...MONO, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.7, marginBottom: 32 }}>
          Set up email alerts, then review everything before {isEdit ? 'saving' : 'creating'} your schedule.
        </p>

        <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-faint)', marginBottom: 14 }}>
          Email notifications
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
          {[
            { key: 'c', label: 'On completion', desc: 'Get notified when each scheduled scan finishes successfully', value: notifyComplete, onChange: setNotifyComplete },
            { key: 'f', label: 'On failure',    desc: 'Get alerted if a scan errors, times out, or is cancelled',  value: notifyFail,     onChange: setNotifyFail },
          ].map(row => (
            <div key={row.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 24, padding: '14px 18px', borderRadius: 8,
              border: `1px solid ${row.value ? 'var(--accent-border)' : 'var(--border-default)'}`,
              backgroundColor: row.value ? 'var(--accent-dim)' : 'var(--bg-card)',
              transition: 'all .2s',
              boxShadow: row.value ? '0 0 12px var(--accent-glow)' : 'none',
            }}>
              <div>
                <p style={{ ...MONO, fontSize: 13, fontWeight: 700, color: row.value ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 3 }}>{row.label}</p>
                <p style={{ ...MONO, fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>{row.desc}</p>
              </div>
              <GlowToggle value={row.value} onChange={row.onChange} />
            </div>
          ))}
        </div>

        {submitError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 24, padding: '12px 16px', borderRadius: 6,
            border: '1px solid var(--danger-border)', backgroundColor: 'var(--danger-dim)',
            ...MONO, fontSize: 11, color: 'var(--danger)', maxWidth: 480,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 5v2.5M7 9.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {submitError}
          </div>
        )}
      </div>

      {/* Right — mission briefing / review */}
      <div style={{
        width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--bg-card)', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
          <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-faint)', marginBottom: 4 }}>Mission briefing</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>Review before {isEdit ? 'saving' : 'launch'}</p>
        </div>

        <div style={{ flex: 1, padding: '8px 0' }}>
          {[
            { icon: '▸', label: 'Target',   val: target || '—',                              hi: !!target },
            { icon: '#', label: 'Label',    val: label  || 'Not set',                        hi: false   },
            { icon: '◷', label: 'Schedule', val: activeCron || '—',                          hi: !!activeCron },
            { icon: '⚙', label: 'Tools',    val: selectedTools.length > 0 ? `${selectedTools.length} selected` : '—', hi: selectedTools.length > 0 },
            { icon: '✉', label: 'Notify',   val: [notifyComplete && 'Complete', notifyFail && 'Failure'].filter(Boolean).join(' · ') || 'Off', hi: notifyComplete || notifyFail },
          ].map((row, i) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 24px',
              borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none',
              backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0, width: 16, textAlign: 'center' }}>{row.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...MONO, fontSize: 9, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{row.label}</p>
                <p style={{ ...MONO, fontSize: 12, fontWeight: 700, color: row.hi ? 'var(--text-primary)' : 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</p>
              </div>
              {row.hi && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 6px var(--accent)' }} />}
            </div>
          ))}
        </div>

        {/* Tool list inside review */}
        {selectedTools.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', flexShrink: 0 }}>
            <p style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 12 }}>Tool roster</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedTools.map(id => {
                const t = getTool(id);
                return t ? (
                  <span key={id} style={{
                    ...MONO, fontSize: 9, padding: '3px 8px', borderRadius: 4,
                    border: `1px solid ${t.color}44`, backgroundColor: `${t.color}11`,
                    color: t.color, fontWeight: 700,
                  }}>{t.label}</span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ScheduledScanForm({ existing }: Props) {
  const router = useRouter();
  const isEdit = !!existing;

  const initPreset = existing?.preset_key
    ? (PRESETS.find(p => p.key === existing.preset_key) ? existing.preset_key : 'custom')
    : 'daily_9am';

  const [step,           setStep]           = useState<StepId>(0);
  const [visitedMax,     setVisitedMax]     = useState<StepId>(isEdit ? 3 : 0);
  const [label,          setLabel]          = useState(existing?.label ?? '');
  const [target,         setTarget]         = useState(existing?.target ?? '');
  const [targetError,    setTargetError]    = useState<string | null>(null);
  const [selectedPreset, setPreset]         = useState(initPreset);
  const [customCron,     setCustomCron]     = useState(initPreset === 'custom' ? (existing?.cron_expression ?? '') : '');
  const [selectedTools,  setSelectedTools]  = useState<string[]>(existing?.tools ?? ['nmap']);
  const [options,        setOptions]        = useState<Record<string, Record<string, any>>>(existing?.options ?? {});
  const [activeTab,      setActiveTab]      = useState<string | null>(existing?.tools?.[0] ?? 'nmap');
  const [notifyComplete, setNotifyComplete] = useState(existing?.notify_on_complete ?? true);
  const [notifyFail,     setNotifyFail]     = useState(existing?.notify_on_failure  ?? true);
  const [loading,        setLoading]        = useState(false);
  const [submitError,    setSubmitError]    = useState<string | null>(null);

  const activeCron = selectedPreset === 'custom' ? customCron : (PRESETS.find(p => p.key === selectedPreset)?.cron ?? '');

  const advance = (to: StepId) => {
    setStep(to);
    setVisitedMax(v => Math.max(v, to) as StepId);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!target.trim()) { setTargetError('Target is required'); return; }
      advance(1);
    } else if (step === 1) {
      advance(2);
    } else if (step === 2) {
      advance(3);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((step - 1) as StepId);
  };

  const isSelected = (id: string) => selectedTools.includes(id);
  const getNonDefaults = useCallback((id: string) => {
    const tool = getTool(id); const opts = options[id] ?? {};
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
    setOptions(prev => ({ ...prev, [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val } }));
  }, []);

  const activeToolDef = activeTab ? (getTool(activeTab) ?? null) : null;
  const activeOpts    = activeTab ? (options[activeTab] ?? {}) : {};

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
        label: label.trim() || undefined, target: target.trim(),
        tools: selectedTools, notify_on_complete: notifyComplete, notify_on_failure: notifyFail,
        ...(Object.keys(filtered).length ? { options: filtered } : {}),
      };
      if (selectedPreset !== 'custom') payload.preset_key = selectedPreset;
      else payload.cron_expression = customCron.trim();

      if (isEdit) await apiClient.put(`/api/v1/scheduled-scans/${existing!.id}`, payload);
      else await apiClient.post('/api/v1/scheduled-scans', payload);
      router.push('/dashboard/scheduled-scans');
    } catch (e) {
      setSubmitError(err(e));
    } finally {
      setLoading(false);
    }
  };

  const nextDisabled =
    (step === 0 && !target.trim()) ||
    (step === 1 && !activeCron.trim()) ||
    (step === 2 && selectedTools.length === 0) ||
    (step === 3 && loading);

  const nextLabel = step === 3
    ? (loading ? (isEdit ? 'Saving...' : 'Deploying...') : (isEdit ? '✓ Save changes' : '✓ Deploy schedule'))
    : 'Continue';

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        overflow: 'hidden', ...MONO,
        backgroundColor: 'var(--bg-base)',
      }}>
        {/* Top bar */}
        <TopBar step={step} isEdit={isEdit} />

        {/* Main body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left step rail */}
          <StepRail step={step} visitedMax={visitedMax} onNavigate={(s) => { if (s <= visitedMax) setStep(s); }} />

          {/* Step content — fills remaining space */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {step === 0 && (
              <TargetPanel label={label} setLabel={setLabel} target={target} setTarget={setTarget} error={targetError} setError={setTargetError} />
            )}
            {step === 1 && (
              <SchedulePanel selectedPreset={selectedPreset} setPreset={setPreset} customCron={customCron} setCustomCron={setCustomCron} activeCron={activeCron} />
            )}
            {step === 2 && (
              <ToolsPanel selectedTools={selectedTools} handleCheck={handleCheck} handleOpen={handleOpen}
                activeTab={activeTab} activeToolDef={activeToolDef} activeOpts={activeOpts}
                getNonDefaults={getNonDefaults} handleFieldChange={handleFieldChange} isSelected={isSelected} />
            )}
            {step === 3 && (
              <LaunchPanel notifyComplete={notifyComplete} setNotifyComplete={setNotifyComplete}
                notifyFail={notifyFail} setNotifyFail={setNotifyFail}
                target={target} label={label} activeCron={activeCron} selectedTools={selectedTools}
                submitError={submitError} isEdit={isEdit} />
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <ActionBar
          step={step}
          onBack={step > 0 ? handleBack : undefined}
          onNext={handleNext}
          nextLabel={nextLabel}
          nextDisabled={nextDisabled}
          loading={loading}
        />
      </div>
    </>
  );
}

// 'use client';

// import React, { useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import apiClient from '@/lib/api/client';
// import CronPreview from './CronPreview';
// import {
//   TOOLS,
//   getTool,
//   getToolDefaults,
//   ToolOptionField,
//   SelectField,
//   ToggleField,
//   NumberField,
// } from '@/lib/config/tools';

// const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// // ─── Cron presets ─────────────────────────────────────────────────────────────

// const PRESETS = [
//   { key: 'hourly',         label: 'Hourly',         cron: '0 * * * *',  icon: '⏱' },
//   { key: 'daily_9am',      label: 'Daily 9 AM',     cron: '0 9 * * *',  icon: '☀' },
//   { key: 'daily_midnight', label: 'Midnight',        cron: '0 0 * * *',  icon: '🌙' },
//   { key: 'weekly_monday',  label: 'Mon 9 AM',        cron: '0 9 * * 1',  icon: 'M' },
//   { key: 'weekly_friday',  label: 'Fri 9 AM',        cron: '0 9 * * 5',  icon: 'F' },
//   { key: 'monthly_1st',    label: '1st Monthly',     cron: '0 9 1 * *',  icon: '1' },
//   { key: 'custom',         label: 'Custom',          cron: '',            icon: '~' },
// ];

// // ─── Steps ────────────────────────────────────────────────────────────────────

// const STEPS = [
//   { id: 'target',   label: 'Target',   short: '01' },
//   { id: 'schedule', label: 'Schedule', short: '02' },
//   { id: 'tools',    label: 'Tools',    short: '03' },
//   { id: 'notify',   label: 'Notify',   short: '04' },
// ];

// type StepId = 'target' | 'schedule' | 'tools' | 'notify';

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface Props {
//   existing?: {
//     id: string;
//     label?: string;
//     target: string;
//     tools: string[];
//     options?: Record<string, Record<string, any>>;
//     preset_key?: string;
//     cron_expression: string;
//     notify_on_complete: boolean;
//     notify_on_failure: boolean;
//   };
// }

// // ─── Field components ─────────────────────────────────────────────────────────

// function SelectFieldView({ field, value, onChange }: {
//   field: SelectField; value: string; onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <p className="text-xs mb-2" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
//         {field.label}
//       </p>
//       <div className="flex flex-col gap-1.5">
//         {field.choices.map(choice => {
//           const on = value === choice.value;
//           return (
//             <div
//               key={choice.value}
//               onClick={() => onChange(choice.value)}
//               className="flex items-start gap-3 p-2.5 rounded cursor-pointer transition-all"
//               style={{
//                 border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
//                 backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-hover)',
//               }}
//             >
//               <div style={{
//                 width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 2,
//                 border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 {on && <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--accent)' }} />}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                   <span className="text-xs font-semibold" style={{ color: on ? 'var(--accent)' : 'var(--text-secondary)', ...mono }}>
//                     {choice.label}
//                   </span>
//                   {choice.requiresNote && (
//                     <span className="text-xs px-1 py-0.5 rounded" style={{ color: 'var(--warn)', backgroundColor: 'var(--warn-dim)', border: '1px solid rgba(255,170,0,.15)', ...mono, fontSize: 9 }}>
//                       {choice.requiresNote}
//                     </span>
//                   )}
//                   <span className="ml-auto text-xs px-1 py-0.5 rounded flex-shrink-0" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', ...mono, fontSize: 9 }}>
//                     {choice.time}
//                   </span>
//                 </div>
//                 <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.5, fontSize: 10 }}>{choice.desc}</p>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function ToggleFieldView({ field, value, onChange }: {
//   field: ToggleField; value: boolean; onChange: (v: boolean) => void;
// }) {
//   return (
//     <div className="flex items-center justify-between gap-4 p-2.5 rounded"
//       style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
//       <div>
//         <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>{field.label}</p>
//         <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.5 }}>{field.desc}</p>
//       </div>
//       <Toggle value={value} onChange={onChange} />
//     </div>
//   );
// }

// function NumberFieldView({ field, value, onChange }: {
//   field: NumberField; value: number; onChange: (v: number) => void;
// }) {
//   return (
//     <div className="p-2.5 rounded" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
//       <div className="flex items-baseline justify-between mb-0.5">
//         <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>{field.label}</p>
//         <span className="text-base font-bold" style={{ color: 'var(--accent)', ...mono }}>{value}</span>
//       </div>
//       <p className="text-xs mb-2" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.5 }}>{field.desc}</p>
//       <input type="range" min={field.min} max={field.max} value={value}
//         onChange={e => onChange(parseInt(e.target.value, 10))}
//         style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
//       <div className="flex justify-between mt-0.5" style={{ color: 'var(--text-faint)', ...mono, fontSize: 9 }}>
//         <span>{field.min}</span><span>{field.max}</span>
//       </div>
//     </div>
//   );
// }

// function FieldView({ field, value, onChange }: {
//   field: ToolOptionField; value: any; onChange: (k: string, v: any) => void;
// }) {
//   if (field.type === 'select') return <SelectFieldView field={field as SelectField} value={value} onChange={v => onChange(field.key, v)} />;
//   if (field.type === 'toggle') return <ToggleFieldView field={field as ToggleField} value={value} onChange={v => onChange(field.key, v)} />;
//   if (field.type === 'number') return <NumberFieldView field={field as NumberField} value={value} onChange={v => onChange(field.key, v)} />;
//   return null;
// }

// // ─── Shared Toggle ────────────────────────────────────────────────────────────

// function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <button type="button" onClick={() => onChange(!value)} style={{
//       flexShrink: 0, position: 'relative', width: 36, height: 20, borderRadius: 10,
//       background: value ? 'var(--accent-dim)' : 'var(--bg-base)',
//       border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border-strong)'}`,
//       cursor: 'pointer', transition: 'all .2s',
//     }}>
//       <span style={{
//         position: 'absolute', top: 3,
//         left: value ? 'calc(100% - 17px)' : 3,
//         width: 12, height: 12, borderRadius: '50%',
//         background: value ? 'var(--accent)' : 'var(--border-strong)',
//         transition: 'all .2s',
//       }} />
//     </button>
//   );
// }

// // ─── Error helper ─────────────────────────────────────────────────────────────

// function extractError(err: unknown): string {
//   const e = err as any;
//   if (e?.response?.data?.detail) {
//     const d = e.response.data.detail;
//     if (Array.isArray(d)) return d.map((x: any) => x.msg).join(', ');
//     if (typeof d === 'string') return d;
//   }
//   if (err instanceof Error) return err.message;
//   return 'Something went wrong';
// }

// // ─── Step indicator ───────────────────────────────────────────────────────────

// function StepBar({ current, onNavigate, completed }: {
//   current: StepId;
//   onNavigate: (s: StepId) => void;
//   completed: Set<StepId>;
// }) {
//   const currentIdx = STEPS.findIndex(s => s.id === current);

//   return (
//     <div className="flex items-center gap-0" style={{ ...mono }}>
//       {STEPS.map((step, i) => {
//         const isActive    = step.id === current;
//         const isDone      = completed.has(step.id as StepId);
//         const isReachable = i <= currentIdx || isDone;

//         return (
//           <React.Fragment key={step.id}>
//             <button
//               type="button"
//               onClick={() => isReachable && onNavigate(step.id as StepId)}
//               disabled={!isReachable}
//               className="flex items-center gap-2 px-3 py-1.5 transition-all"
//               style={{
//                 cursor: isReachable ? 'pointer' : 'default',
//                 opacity: isReachable ? 1 : 0.35,
//                 borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
//               }}
//             >
//               <span
//                 className="flex items-center justify-center text-xs font-bold"
//                 style={{
//                   width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
//                   fontSize: 9,
//                   backgroundColor: isActive
//                     ? 'var(--accent)'
//                     : isDone
//                       ? 'var(--accent-dim)'
//                       : 'var(--bg-hover)',
//                   border: `1px solid ${isActive
//                     ? 'var(--accent)'
//                     : isDone
//                       ? 'var(--accent-border)'
//                       : 'var(--border-strong)'}`,
//                   color: isActive
//                     ? 'var(--bg-base)'
//                     : isDone
//                       ? 'var(--accent)'
//                       : 'var(--text-faint)',
//                 }}
//               >
//                 {isDone && !isActive ? '✓' : step.short}
//               </span>
//               <span
//                 className="text-xs font-semibold tracking-wider"
//                 style={{
//                   color: isActive
//                     ? 'var(--text-primary)'
//                     : isDone
//                       ? 'var(--text-muted)'
//                       : 'var(--text-faint)',
//                 }}
//               >
//                 {step.label}
//               </span>
//             </button>
//             {i < STEPS.length - 1 && (
//               <span style={{ color: 'var(--border-strong)', fontSize: 10, padding: '0 2px' }}>›</span>
//             )}
//           </React.Fragment>
//         );
//       })}
//     </div>
//   );
// }

// // ─── Step panels ──────────────────────────────────────────────────────────────

// function TargetStep({ label, setLabel, target, setTarget, onNext, error, setError }: {
//   label: string; setLabel: (v: string) => void;
//   target: string; setTarget: (v: string) => void;
//   onNext: () => void; error: string | null; setError: (v: string | null) => void;
// }) {
//   return (
//     <div className="flex flex-col gap-6 max-w-lg">
//       <div>
//         <p className="text-xs mb-1" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
//           Label <span style={{ color: 'var(--text-ghost)' }}>— optional</span>
//         </p>
//         <input
//           type="text"
//           value={label}
//           onChange={e => setLabel(e.target.value)}
//           placeholder="e.g. Weekly prod scan"
//           className="w-full px-3 py-2.5 text-sm rounded outline-none transition-colors"
//           style={{
//             backgroundColor: 'var(--bg-hover)',
//             border: '1px solid var(--border-default)',
//             color: 'var(--text-primary)', ...mono,
//           }}
//           onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
//           onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}
//         />
//         <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)', ...mono }}>
//           A friendly name to identify this schedule in your list.
//         </p>
//       </div>

//       <div>
//         <p className="text-xs mb-1" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
//           Target <span style={{ color: 'var(--danger)', fontSize: 9 }}>required</span>
//         </p>
//         <div
//           className="flex items-center rounded overflow-hidden transition-colors"
//           style={{ border: `1px solid ${error ? 'var(--danger-border)' : 'var(--border-strong)'}`, backgroundColor: 'var(--bg-hover)' }}
//           onFocusCapture={e => !error && (e.currentTarget.style.borderColor = 'var(--accent-border)')}
//           onBlurCapture={e  => !error && (e.currentTarget.style.borderColor = 'var(--border-strong)')}
//         >
//           <span className="px-3 text-sm select-none" style={{ color: 'var(--accent)' }}>▸</span>
//           <input
//             type="text"
//             value={target}
//             onChange={e => { setTarget(e.target.value); setError(null); }}
//             placeholder="example.com · 192.168.1.1 · 10.0.0.0/24"
//             className="flex-1 py-2.5 pr-3 text-sm bg-transparent outline-none"
//             style={{ color: 'var(--text-primary)', ...mono }}
//           />
//         </div>
//         {error
//           ? <p className="text-xs mt-1.5" style={{ color: 'var(--danger)', ...mono }}>{error}</p>
//           : <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)', ...mono }}>Domain, IP address, or CIDR range to scan on schedule.</p>
//         }
//       </div>

//       <button
//         type="button"
//         onClick={onNext}
//         disabled={!target.trim()}
//         className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest rounded transition-opacity w-fit"
//         style={{
//           color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
//           border: '1px solid var(--accent-border)', ...mono,
//           opacity: target.trim() ? 1 : 0.35,
//           cursor: target.trim() ? 'pointer' : 'not-allowed',
//           textTransform: 'uppercase', letterSpacing: '0.12em',
//         }}
//       >
//         Next — Schedule
//         <span style={{ fontSize: 12 }}>›</span>
//       </button>
//     </div>
//   );
// }

// function ScheduleStep({ selectedPreset, setPreset, customCron, setCustomCron, activeCron, onNext, onBack }: {
//   selectedPreset: string; setPreset: (v: string) => void;
//   customCron: string; setCustomCron: (v: string) => void;
//   activeCron: string; onNext: () => void; onBack: () => void;
// }) {
//   return (
//     <div className="flex flex-col gap-6 max-w-lg">
//       <div>
//         <p className="text-xs mb-3" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
//           Preset schedules
//         </p>
//         <div className="grid grid-cols-4 gap-2">
//           {PRESETS.map(p => {
//             const on = selectedPreset === p.key;
//             return (
//               <button
//                 key={p.key}
//                 type="button"
//                 onClick={() => setPreset(p.key)}
//                 className="flex flex-col items-center gap-1.5 p-3 rounded transition-all"
//                 style={{
//                   border: `1px solid ${on ? 'var(--accent-border)' : 'var(--border-default)'}`,
//                   backgroundColor: on ? 'var(--accent-dim)' : 'var(--bg-hover)',
//                   cursor: 'pointer',
//                 }}
//                 onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
//                 onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
//               >
//                 <span className="flex items-center justify-center w-7 h-7 rounded text-sm font-bold"
//                   style={{
//                     backgroundColor: on ? 'var(--accent)' : 'var(--bg-base)',
//                     color: on ? 'var(--bg-base)' : 'var(--text-muted)',
//                     border: `1px solid ${on ? 'var(--accent)' : 'var(--border-default)'}`,
//                     ...mono,
//                   }}>
//                   {p.icon}
//                 </span>
//                 <span className="text-center leading-tight" style={{ color: on ? 'var(--accent)' : 'var(--text-secondary)', ...mono, fontSize: 10, fontWeight: 600 }}>
//                   {p.label}
//                 </span>
//                 {p.cron && (
//                   <span style={{ color: on ? 'var(--accent)' : 'var(--text-faint)', fontSize: 9, ...mono, opacity: 0.8 }}>
//                     {p.cron}
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {selectedPreset === 'custom' && (
//         <div>
//           <p className="text-xs mb-1.5" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
//             Custom expression
//             <span className="ml-2 normal-case" style={{ color: 'var(--text-ghost)', fontSize: 10 }}>min hour dom month dow</span>
//           </p>
//           <input
//             type="text"
//             value={customCron}
//             onChange={e => setCustomCron(e.target.value)}
//             placeholder="0 9 * * 1"
//             className="w-full px-3 py-2.5 text-sm rounded outline-none"
//             style={{
//               backgroundColor: 'var(--bg-hover)',
//               border: '1px solid var(--border-strong)',
//               color: 'var(--text-primary)', ...mono,
//             }}
//             onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
//             onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
//           />
//         </div>
//       )}

//       <CronPreview value={activeCron} />

//       <div className="flex items-center gap-3">
//         <button type="button" onClick={onBack}
//           className="flex items-center gap-1.5 px-4 py-2 text-xs rounded transition-colors"
//           style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
//           ‹ Back
//         </button>
//         <button
//           type="button"
//           onClick={onNext}
//           disabled={!activeCron.trim()}
//           className="flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest rounded transition-opacity"
//           style={{
//             color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
//             border: '1px solid var(--accent-border)', ...mono,
//             opacity: activeCron.trim() ? 1 : 0.35,
//             cursor: activeCron.trim() ? 'pointer' : 'not-allowed',
//             textTransform: 'uppercase', letterSpacing: '0.12em',
//           }}>
//           Next — Tools ›
//         </button>
//       </div>
//     </div>
//   );
// }

// function ToolsStep({ selectedTools, handleCheck, handleOpen, activeTab, activeToolDef, activeOpts, getNonDefaults, handleFieldChange, isSelected, onNext, onBack }: {
//   selectedTools: string[];
//   handleCheck: (id: string) => void;
//   handleOpen: (id: string) => void;
//   activeTab: string | null;
//   activeToolDef: any;
//   activeOpts: Record<string, any>;
//   getNonDefaults: (id: string) => number;
//   handleFieldChange: (toolId: string, key: string, val: any) => void;
//   isSelected: (id: string) => boolean;
//   onNext: () => void;
//   onBack: () => void;
// }) {
//   const showConfig = activeToolDef && isSelected(activeToolDef.id);

//   return (
//     <div className="flex gap-5" style={{ minHeight: 360 }}>
//       {/* Tool list */}
//       <div className="flex flex-col flex-shrink-0" style={{ width: 200 }}>
//         <p className="text-xs mb-3" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
//           Select tools
//           <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold"
//             style={{
//               backgroundColor: selectedTools.length > 0 ? 'var(--accent-dim)' : 'transparent',
//               color: selectedTools.length > 0 ? 'var(--accent)' : 'var(--text-ghost)',
//               border: `1px solid ${selectedTools.length > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
//             }}>
//             {selectedTools.length}
//           </span>
//         </p>

//         <div className="flex flex-col gap-1 flex-1">
//           {TOOLS.map(tool => {
//             const selected = isSelected(tool.id);
//             const active   = activeTab === tool.id;
//             const modified = getNonDefaults(tool.id) > 0;

//             return (
//               <div
//                 key={tool.id}
//                 className="flex items-center gap-2.5 px-2.5 py-2 rounded cursor-pointer transition-all"
//                 style={{
//                   border: `1px solid ${active ? 'var(--border-default)' : 'transparent'}`,
//                   backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
//                   position: 'relative',
//                 }}
//                 onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
//                 onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
//               >
//                 {active && (
//                   <div style={{ position: 'absolute', left: 0, top: 5, bottom: 5, width: 2, borderRadius: 1, backgroundColor: tool.color }} />
//                 )}
//                 <div
//                   onClick={e => { e.stopPropagation(); handleCheck(tool.id); }}
//                   style={{
//                     width: 13, height: 13, borderRadius: 2, flexShrink: 0,
//                     border: `1.5px solid ${selected ? tool.color : 'var(--border-strong)'}`,
//                     backgroundColor: selected ? tool.color : 'transparent',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     transition: 'all .12s', cursor: 'pointer',
//                   }}
//                 >
//                   {selected && (
//                     <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
//                       <path d="M1 4l2 2 4-4" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-0" onClick={() => handleOpen(tool.id)}>
//                   <p className="text-xs font-semibold truncate" style={{ color: selected ? tool.color : 'var(--text-muted)', ...mono }}>{tool.label}</p>
//                   <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-faint)', ...mono, fontSize: 10 }}>{tool.desc}</p>
//                 </div>
//                 {modified && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }} />}
//                 {selected && <span className="flex-shrink-0 text-xs" style={{ color: active ? 'var(--accent)' : 'var(--text-faint)', ...mono }}>›</span>}
//               </div>
//             );
//           })}
//         </div>

//         <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
//           <button type="button"
//             onClick={() => { handleOpen(TOOLS[0]?.id ?? ''); TOOLS.forEach(t => handleCheck(t.id)); }}
//             className="text-xs transition-colors" style={{ color: 'var(--text-faint)', ...mono }}
//             onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
//             onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}>
//             All
//           </button>
//           <span style={{ color: 'var(--text-ghost)', fontSize: 10 }}>·</span>
//           <button type="button"
//             onClick={() => TOOLS.forEach(t => { if (isSelected(t.id)) handleCheck(t.id); })}
//             className="text-xs transition-colors" style={{ color: 'var(--text-faint)', ...mono }}
//             onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--danger)')}
//             onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}>
//             None
//           </button>
//         </div>
//       </div>

//       {/* Config panel */}
//       <div className="flex-1 rounded overflow-hidden" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
//         {!showConfig ? (
//           <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-faint)', minHeight: 280 }}>
//             <div className="w-10 h-10 rounded flex items-center justify-center"
//               style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                 <path d="M8 2l1.5 3h3l-2.5 2 1 3L8 8.5 5 10l1-3L3.5 5h3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
//               </svg>
//             </div>
//             <div className="text-center">
//               <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)', ...mono }}>No tool selected</p>
//               <p className="text-xs mt-1" style={{ color: 'var(--text-faint)', ...mono }}>Click a tool to configure</p>
//             </div>
//           </div>
//         ) : (
//           <div className="flex flex-col h-full">
//             <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
//               <div className="flex items-center gap-2 mb-0.5">
//                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeToolDef.color, boxShadow: `0 0 6px ${activeToolDef.color}66` }} />
//                 <h3 className="text-sm font-bold" style={{ color: activeToolDef.color, ...mono }}>{activeToolDef.label}</h3>
//                 <div className="ml-auto flex items-center gap-2">
//                   <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', ...mono }}>
//                     {activeToolDef.fields.length} option{activeToolDef.fields.length !== 1 ? 's' : ''}
//                   </span>
//                   {activeTab && getNonDefaults(activeTab) > 0 && (
//                     <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', ...mono }}>
//                       ✦ {getNonDefaults(activeTab)} modified
//                     </span>
//                   )}
//                 </div>
//               </div>
//               <p className="text-xs" style={{ color: 'var(--text-muted)', ...mono }}>{activeToolDef.desc}</p>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {activeToolDef.fields.length > 0 ? (
//                 activeToolDef.fields.map((field: ToolOptionField) => (
//                   <FieldView
//                     key={field.key}
//                     field={field}
//                     value={activeOpts[field.key] !== undefined ? activeOpts[field.key] : field.default}
//                     onChange={(k, v) => activeTab && handleFieldChange(activeTab, k, v)}
//                   />
//                 ))
//               ) : (
//                 <div className="flex items-start gap-3 p-3 rounded" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
//                   <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
//                     <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
//                       <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                   </div>
//                   <div>
//                     <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>Runs with optimal defaults</p>
//                     <p className="text-xs mt-1" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.6 }}>
//                       {activeToolDef.label} requires no configuration.
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Nav buttons — below the two-column layout */}
//       <div />
//     </div>
//   );
// }

// // ─── Review summary ───────────────────────────────────────────────────────────

// function ReviewRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
//   return (
//     <div className="flex items-start gap-4 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
//       <span className="text-xs flex-shrink-0 w-20" style={{ color: 'var(--text-faint)', ...mono, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>
//         {label}
//       </span>
//       <span className="text-xs font-semibold flex-1" style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)', ...mono }}>
//         {value}
//       </span>
//     </div>
//   );
// }

// // ─── Main component ───────────────────────────────────────────────────────────

// export default function ScheduledScanForm({ existing }: Props) {
//   const router  = useRouter();
//   const isEdit  = !!existing;

//   const initPreset = existing?.preset_key
//     ? (PRESETS.find(p => p.key === existing.preset_key) ? existing.preset_key : 'custom')
//     : 'daily_9am';

//   // ── State ────────────────────────────────────────────────────────────────────
//   const [step,           setStep]           = useState<StepId>(isEdit ? 'target' : 'target');
//   const [completed,      setCompleted]      = useState<Set<StepId>>(
//     isEdit ? new Set<StepId>(['target', 'schedule', 'tools', 'notify']) : new Set<StepId>()
//   );

//   // Step 1 — target
//   const [label,          setLabel]          = useState(existing?.label ?? '');
//   const [target,         setTarget]         = useState(existing?.target ?? '');
//   const [targetError,    setTargetError]    = useState<string | null>(null);

//   // Step 2 — schedule
//   const [selectedPreset, setPreset]         = useState(initPreset);
//   const [customCron,     setCustomCron]     = useState(
//     initPreset === 'custom' ? (existing?.cron_expression ?? '') : ''
//   );

//   // Step 3 — tools
//   const [selectedTools,  setSelectedTools]  = useState<string[]>(existing?.tools ?? ['nmap']);
//   const [options,        setOptions]        = useState<Record<string, Record<string, any>>>(existing?.options ?? {});
//   const [activeTab,      setActiveTab]      = useState<string | null>(existing?.tools?.[0] ?? 'nmap');

//   // Step 4 — notify
//   const [notifyComplete, setNotifyComplete] = useState(existing?.notify_on_complete ?? true);
//   const [notifyFail,     setNotifyFail]     = useState(existing?.notify_on_failure ?? true);

//   // Submission
//   const [loading, setLoading] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const activeCron = selectedPreset === 'custom'
//     ? customCron
//     : (PRESETS.find(p => p.key === selectedPreset)?.cron ?? '');

//   // ── Navigation ───────────────────────────────────────────────────────────────
//   const goTo = (s: StepId) => setStep(s);

//   const markComplete = (s: StepId) => {
//     setCompleted(prev => new Set([...prev, s]));
//   };

//   const stepIndex = STEPS.findIndex(s => s.id === step);

//   const goNext = () => {
//     if (stepIndex < STEPS.length - 1) {
//       markComplete(step);
//       setStep(STEPS[stepIndex + 1].id as StepId);
//     }
//   };

//   const goBack = () => {
//     if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id as StepId);
//   };

//   // ── Tool helpers ─────────────────────────────────────────────────────────────
//   const isSelected = (id: string) => selectedTools.includes(id);

//   const getNonDefaults = useCallback((id: string) => {
//     const tool = getTool(id);
//     const opts = options[id] ?? {};
//     if (!tool) return 0;
//     return tool.fields.filter(f => opts[f.key] !== undefined && opts[f.key] !== f.default).length;
//   }, [options]);

//   const handleCheck = useCallback((id: string) => {
//     setSelectedTools(prev => {
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
//     if (!selectedTools.includes(id)) setSelectedTools(p => [...p, id]);
//     setActiveTab(id);
//   }, [selectedTools]);

//   const handleFieldChange = useCallback((toolId: string, key: string, val: any) => {
//     setOptions(prev => ({
//       ...prev,
//       [toolId]: { ...(prev[toolId] ?? getToolDefaults(toolId)), [key]: val },
//     }));
//   }, []);

//   const activeToolDef = activeTab ? (getTool(activeTab) ?? null) : null;
//   const activeOpts    = activeTab ? (options[activeTab] ?? {}) : {};

//   // ── Submit ───────────────────────────────────────────────────────────────────
//   const handleSubmit = async () => {
//     setSubmitError(null);
//     setLoading(true);
//     try {
//       const filtered: Record<string, any> = {};
//       for (const id of selectedTools) {
//         const o = options[id];
//         if (o && Object.keys(o).length) filtered[id] = o;
//       }

//       const payload: Record<string, unknown> = {
//         label:              label.trim() || undefined,
//         target:             target.trim(),
//         tools:              selectedTools,
//         notify_on_complete: notifyComplete,
//         notify_on_failure:  notifyFail,
//         ...(Object.keys(filtered).length ? { options: filtered } : {}),
//       };

//       if (selectedPreset !== 'custom') {
//         payload.preset_key = selectedPreset;
//       } else {
//         payload.cron_expression = customCron.trim();
//       }

//       if (isEdit) {
//         await apiClient.put(`/api/v1/scheduled-scans/${existing!.id}`, payload);
//       } else {
//         await apiClient.post('/api/v1/scheduled-scans', payload);
//       }

//       router.push('/dashboard/scheduled-scans');
//     } catch (e) {
//       setSubmitError(extractError(e));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const canSubmit = !loading && target.trim() && selectedTools.length > 0 && activeCron.trim();

//   // ── Notify step (inline) ──────────────────────────────────────────────────────
//   const NotifyStep = (
//     <div className="flex flex-col gap-5 max-w-lg">
//       <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono, lineHeight: 1.7 }}>
//         Choose when to receive email notifications for this scheduled scan.
//       </p>

//       <div className="flex flex-col gap-2">
//         {[
//           { key: 'complete', label: 'On completion', desc: 'Email when a scheduled scan finishes successfully', value: notifyComplete, onChange: setNotifyComplete },
//           { key: 'failure',  label: 'On failure',    desc: 'Email if a scheduled scan errors or times out',   value: notifyFail,     onChange: setNotifyFail },
//         ].map(row => (
//           <div key={row.key}
//             className="flex items-center justify-between gap-6 px-4 py-3 rounded"
//             style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-hover)' }}>
//             <div>
//               <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)', ...mono }}>{row.label}</p>
//               <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)', ...mono }}>{row.desc}</p>
//             </div>
//             <Toggle value={row.value} onChange={row.onChange} />
//           </div>
//         ))}
//       </div>

//       {/* Summary */}
//       <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
//         <div className="px-4 py-2.5" style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-default)' }}>
//           <p className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-muted)', ...mono, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
//             Review
//           </p>
//         </div>
//         <div className="px-4" style={{ backgroundColor: 'var(--bg-card)' }}>
//           <ReviewRow label="Target" value={target} accent />
//           {label && <ReviewRow label="Label" value={label} />}
//           <ReviewRow label="Schedule" value={activeCron} accent />
//           <ReviewRow label="Tools" value={selectedTools.join(', ')} />
//           <ReviewRow label="Notify" value={`${notifyComplete ? 'On complete' : ''}${notifyComplete && notifyFail ? ' · ' : ''}${notifyFail ? 'On failure' : ''}${!notifyComplete && !notifyFail ? 'Off' : ''}`} />
//         </div>
//       </div>

//       {submitError && (
//         <div className="flex items-center gap-2 px-3 py-2 rounded text-xs"
//           style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-dim)', border: '1px solid var(--danger-border)', ...mono }}>
//           <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
//             <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
//             <path d="M6 4v2.2M6 7.8h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
//           </svg>
//           {submitError}
//         </div>
//       )}

//       <div className="flex items-center gap-3">
//         <button type="button" onClick={goBack}
//           className="flex items-center gap-1.5 px-4 py-2 text-xs rounded transition-colors"
//           style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
//           ‹ Back
//         </button>
//         <button
//           type="button"
//           onClick={handleSubmit}
//           disabled={!canSubmit}
//           className="flex items-center gap-2 px-6 py-2 text-xs font-bold tracking-widest rounded transition-opacity"
//           style={{
//             color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
//             border: '1px solid var(--accent-border)', ...mono,
//             opacity: canSubmit ? 1 : 0.35,
//             cursor: canSubmit ? 'pointer' : 'not-allowed',
//             textTransform: 'uppercase', letterSpacing: '0.12em',
//           }}>
//           {loading ? (
//             <>
//               <span className="w-3 h-3 rounded-full animate-spin" style={{
//                 borderWidth: 1.5, borderStyle: 'solid',
//                 borderTopColor: 'transparent',
//                 borderRightColor: 'var(--accent)',
//                 borderBottomColor: 'var(--accent)',
//                 borderLeftColor: 'var(--accent)',
//               }} />
//               {isEdit ? 'Saving...' : 'Creating...'}
//             </>
//           ) : (
//             isEdit ? '✓ Save changes' : '✓ Create schedule'
//           )}
//         </button>
//       </div>
//     </div>
//   );

//   // ─── Render ────────────────────────────────────────────────────────────────

//   return (
//     <div className="flex flex-col h-full overflow-hidden" style={mono}>

//       {/* ── Header ── */}
//       <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Link
//               href="/dashboard/scheduled-scans"
//               className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors"
//               style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
//               onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
//               onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
//             >
//               <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
//                 <path d="M7 2L4 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//               Back
//             </Link>
//             <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-default)' }} />
//             <div>
//               <div className="flex items-center gap-1.5">
//                 <span className="text-xs" style={{ color: 'var(--accent)' }}>$</span>
//                 <span className="text-xs tracking-wider" style={{ color: 'var(--text-faint)' }}>
//                   {isEdit ? 'scheduled-scans --edit' : 'scheduled-scans --new'}
//                 </span>
//               </div>
//               <h1 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
//                 {isEdit ? 'Edit Scheduled Scan' : 'New Scheduled Scan'}
//               </h1>
//             </div>
//           </div>

//           {/* Step bar in header */}
//           <StepBar current={step} onNavigate={goTo} completed={completed} />
//         </div>
//       </div>

//       {/* ── Body ── */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="p-8">

//           {/* Step label */}
//           <div className="flex items-center gap-3 mb-6">
//             <div className="flex items-center justify-center text-xs font-bold"
//               style={{
//                 width: 24, height: 24, borderRadius: '50%',
//                 backgroundColor: 'var(--accent)',
//                 color: 'var(--bg-base)', ...mono,
//                 fontSize: 10,
//               }}>
//               {STEPS.findIndex(s => s.id === step) + 1}
//             </div>
//             <div>
//               <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', ...mono }}>
//                 {STEPS.find(s => s.id === step)?.label}
//               </h2>
//               <p className="text-xs" style={{ color: 'var(--text-faint)', ...mono }}>
//                 {step === 'target'   && 'Define what to scan'}
//                 {step === 'schedule' && 'Set when to run'}
//                 {step === 'tools'    && 'Choose security tools'}
//                 {step === 'notify'   && 'Configure alerts & confirm'}
//               </p>
//             </div>
//           </div>

//           {/* Step content */}
//           {step === 'target' && (
//             <TargetStep
//               label={label} setLabel={setLabel}
//               target={target} setTarget={setTarget}
//               onNext={() => { if (!target.trim()) { setTargetError('Target is required'); return; } goNext(); }}
//               error={targetError}
//               setError={setTargetError}
//             />
//           )}

//           {step === 'schedule' && (
//             <ScheduleStep
//               selectedPreset={selectedPreset} setPreset={setPreset}
//               customCron={customCron} setCustomCron={setCustomCron}
//               activeCron={activeCron}
//               onNext={goNext} onBack={goBack}
//             />
//           )}

//           {step === 'tools' && (
//             <div className="flex flex-col gap-5">
//               <ToolsStep
//                 selectedTools={selectedTools}
//                 handleCheck={handleCheck}
//                 handleOpen={handleOpen}
//                 activeTab={activeTab}
//                 activeToolDef={activeToolDef}
//                 activeOpts={activeOpts}
//                 getNonDefaults={getNonDefaults}
//                 handleFieldChange={handleFieldChange}
//                 isSelected={isSelected}
//                 onNext={goNext}
//                 onBack={goBack}
//               />
//               <div className="flex items-center gap-3">
//                 <button type="button" onClick={goBack}
//                   className="flex items-center gap-1.5 px-4 py-2 text-xs rounded transition-colors"
//                   style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', ...mono }}>
//                   ‹ Back
//                 </button>
//                 <button
//                   type="button"
//                   onClick={goNext}
//                   disabled={selectedTools.length === 0}
//                   className="flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest rounded transition-opacity"
//                   style={{
//                     color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
//                     border: '1px solid var(--accent-border)', ...mono,
//                     opacity: selectedTools.length > 0 ? 1 : 0.35,
//                     cursor: selectedTools.length > 0 ? 'pointer' : 'not-allowed',
//                     textTransform: 'uppercase', letterSpacing: '0.12em',
//                   }}>
//                   Next — Notify ›
//                 </button>
//               </div>
//             </div>
//           )}

//           {step === 'notify' && NotifyStep}
//         </div>
//       </div>
//     </div>
//   );
// }
