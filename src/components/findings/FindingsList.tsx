// src/components/findings/FindingsList.tsx
'use client';
import React, { useState, useMemo } from 'react';
import { useFindings } from '@/lib/hooks/useFindings';
import { Finding, getHost, extractCVE, formatDate } from '@/lib/api/findings';
import FindingSeverityBadge from './FindingSeverityBadge';
import FindingStatusBadge from './FindingStatusBadge';
import FindingsFilterBar from './FindingsFilterBar';
import FindingDetailModal from './FindingDetailModal';

type SeverityTab = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info';

const SEVERITY_TABS: { key: SeverityTab; label: string; color: string; bg: string; activeBg: string; dot: string }[] = [
  { key: 'all',      label: 'All',      color: 'text-gray-700',   bg: 'bg-gray-100',    activeBg: 'bg-gray-800 text-white',    dot: 'bg-gray-400' },
  { key: 'critical', label: 'Critical', color: 'text-red-700',    bg: 'bg-red-50',      activeBg: 'bg-red-600 text-white',     dot: 'bg-red-500' },
  { key: 'high',     label: 'High',     color: 'text-orange-700', bg: 'bg-orange-50',   activeBg: 'bg-orange-500 text-white',  dot: 'bg-orange-500' },
  { key: 'medium',   label: 'Medium',   color: 'text-yellow-700', bg: 'bg-yellow-50',   activeBg: 'bg-yellow-500 text-white',  dot: 'bg-yellow-500' },
  { key: 'low',      label: 'Low',      color: 'text-blue-700',   bg: 'bg-blue-50',     activeBg: 'bg-blue-500 text-white',    dot: 'bg-blue-400' },
  { key: 'info',     label: 'Info',     color: 'text-gray-600',   bg: 'bg-gray-50',     activeBg: 'bg-gray-500 text-white',    dot: 'bg-gray-400' },
];

export default function FindingsList() {
  const { findings, loading, error, total, fetchFindings, updateFinding, applyFilters, clearFilters } = useFindings();
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeTab, setActiveTab] = useState<SeverityTab>('all');

  // Count per severity across ALL findings
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: findings.length, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach(f => { if (c[f.severity] !== undefined) c[f.severity]++; });
    return c;
  }, [findings]);

  // Filtered findings based on active tab
  const visibleFindings = useMemo(() => {
    if (activeTab === 'all') return findings;
    return findings.filter(f => f.severity === activeTab);
  }, [findings, activeTab]);

  const handleTabClick = (tab: SeverityTab) => {
    setActiveTab(tab);
  };

  const handleStatusChange = async (id: number, status: Finding['status']) => {
    const result = await updateFinding(id, { status });
    if (result.success && selectedFinding?.id === id) {
      setSelectedFinding(prev => prev ? { ...prev, status } : null);
    }
    return result;
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Findings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${total} total finding${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => fetchFindings()}
          className="px-4 py-2 text-sm font-medium bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Severity Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SEVERITY_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`rounded-xl p-4 text-left transition-all border-2 ${
                isActive
                  ? `${tab.activeBg} border-transparent shadow-md scale-[1.02]`
                  : `bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm`
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : tab.dot}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </div>
              <div className={`text-2xl font-bold ${isActive ? 'text-white' : tab.color}`}>
                {loading ? '—' : count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <FindingsFilterBar onFilter={(f) => { applyFilters(f); setActiveTab('all'); }} onClear={() => { clearFilters(); setActiveTab('all'); }} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table Header with active filter label */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== 'all' && (
              <FindingSeverityBadge severity={activeTab as any} />
            )}
            <span className="text-sm text-gray-600 font-medium">
              {loading ? 'Loading...' : `Showing ${visibleFindings.length} finding${visibleFindings.length !== 1 ? 's' : ''}${activeTab !== 'all' ? ` (${activeTab})` : ''}`}
            </span>
          </div>
          {activeTab !== 'all' && (
            <button
              onClick={() => setActiveTab('all')}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear filter ×
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading findings...</span>
          </div>
        ) : visibleFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-3">{activeTab === 'all' ? '🛡️' : '✅'}</div>
            <p className="font-medium text-gray-600">
              {activeTab === 'all' ? 'No findings found' : `No ${activeTab} findings`}
            </p>
            <p className="text-sm mt-1">
              {activeTab === 'all' ? 'Run a scan to discover vulnerabilities' : 'Good news — nothing at this severity level'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Severity</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Target</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tool</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">CVE</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleFindings.map(finding => (
                  <tr
                    key={finding.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedFinding(finding)}
                  >
                    <td className="px-4 py-3">
                      <FindingSeverityBadge severity={finding.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{finding.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {getHost(finding)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{finding.tool || '—'}</td>
                    <td className="px-4 py-3">
                      {extractCVE(finding.evidence) ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-mono">
                          {extractCVE(finding.evidence)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <FindingStatusBadge status={finding.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(finding.created_at, true)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedFinding(finding); }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}