// src/components/findings/FindingsFilterBar.tsx
'use client';
import React, { useState } from 'react';

interface Props {
  onFilter: (filters: {
    severity?: string;
    status?: string;
    search?: string;
  }) => void;
  onClear: () => void;
}

export default function FindingsFilterBar({ onFilter, onClear }: Props) {
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const handleApply = () => {
    onFilter({
      severity: severity || undefined,
      status: status || undefined,
      search: search || undefined,
    });
  };

  const handleClear = () => {
    setSeverity('');
    setStatus('');
    setSearch('');
    onClear();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
        <input
          type="text"
          placeholder="Host, title, CVE..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Severity */}
      <div className="w-40">
        <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="w-40">
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="confirmed">Confirmed</option>
          <option value="false_positive">False Positive</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}