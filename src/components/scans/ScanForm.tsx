// src/components/scans/ScanForm.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';

const AVAILABLE_TOOLS = [
  { id: 'nmap',    label: 'Nmap',     desc: 'Port scanning & service detection',       icon: '🔌', color: 'blue' },
  { id: 'wpscan',  label: 'WPScan',   desc: 'WordPress vulnerability scanner',          icon: '🔍', color: 'orange' },
  { id: 'tlsinfo', label: 'TLS Info', desc: 'SSL/TLS certificate analysis',             icon: '🔒', color: 'green' },
  { id: 'httpx',   label: 'HTTPX',    desc: 'HTTP probe & fingerprinting',              icon: '🌐', color: 'purple' },
  { id: 'nuclei',  label: 'Nuclei',   desc: 'Template-based vulnerability scanner',    icon: '⚡', color: 'red' },
];

const TOOL_COLORS: Record<string, { border: string; bg: string; text: string; check: string }> = {
  blue:   { border: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   check: 'text-blue-600' },
  orange: { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', check: 'text-orange-600' },
  green:  { border: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  check: 'text-green-600' },
  purple: { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', check: 'text-purple-600' },
  red:    { border: 'border-red-400',    bg: 'bg-red-50',    text: 'text-red-700',    check: 'text-red-600' },
};

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

export default function ScanForm() {
  const router = useRouter();
  const [target, setTarget] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['nmap']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!target.trim()) { setError('Please enter a target domain or IP address'); return; }
    if (selectedTools.length === 0) { setError('Please select at least one tool'); return; }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/scans', {
        target: target.trim(),
        tools: selectedTools,
      });
      const scanId = response.data?.scan_id ?? response.data?.id;
      router.push(scanId ? `/dashboard/scans/${scanId}` : '/dashboard/scans');
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
            🔭
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Scan</h1>
            <p className="text-sm text-gray-500">Configure and launch a security scan</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Target Input */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎯</span>
            <label className="text-sm font-semibold text-gray-800">
              Target <span className="text-red-500">*</span>
            </label>
          </div>
          <p className="text-xs text-gray-400 mb-4 ml-6">Domain name or IP address to scan</p>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 text-sm font-mono">
              $
            </div>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="example.com or 192.168.1.1"
              className="w-full pl-8 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent font-mono transition-all"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['localhost', '127.0.0.1'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setTarget(s)}
                className="px-2.5 py-1 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Selection */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🛠️</span>
              <label className="text-sm font-semibold text-gray-800">
                Tools <span className="text-red-500">*</span>
              </label>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {selectedTools.length} selected
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4 ml-6">Select one or more scanning tools to run</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_TOOLS.map(tool => {
              const checked = selectedTools.includes(tool.id);
              const colors = TOOL_COLORS[tool.color];
              return (
                <label
                  key={tool.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    checked
                      ? `${colors.border} ${colors.bg}`
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTool(tool.id)}
                    disabled={loading}
                    className="sr-only"
                  />
                  {/* Custom checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    checked ? `${colors.border} ${colors.bg}` : 'border-gray-300 bg-white'
                  }`}>
                    {checked && (
                      <svg className={`w-3 h-3 ${colors.check}`} fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xl">{tool.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${checked ? colors.text : 'text-gray-700'}`}>
                      {tool.label}
                    </p>
                    <p className="text-xs text-gray-400 leading-tight">{tool.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Select all / none */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setSelectedTools(AVAILABLE_TOOLS.map(t => t.id))}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Select all
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={() => setSelectedTools([])}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Scan Summary */}
        {target && selectedTools.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">Scan Summary</p>
            <p className="text-sm text-blue-800">
              Running <strong>{selectedTools.join(', ')}</strong> against{' '}
              <strong className="font-mono">{target}</strong>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span>⚠️</span>
              <p className="text-sm font-semibold text-red-700">Failed to create scan</p>
            </div>
            <pre className="text-xs text-red-600 whitespace-pre-wrap ml-6">{error}</pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button
            type="submit"
            disabled={loading || !target || selectedTools.length === 0}
            className="px-8 py-3 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting scan...
              </>
            ) : (
              <>🚀 Start Scan</>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/scans')}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}