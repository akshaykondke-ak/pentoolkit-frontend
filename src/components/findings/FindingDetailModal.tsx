// src/components/findings/FindingDetailModal.tsx
'use client';
import React, { useState } from 'react';
import { Finding, extractCVE, formatDate } from '@/lib/api/findings';
import FindingSeverityBadge from './FindingSeverityBadge';
import FindingStatusBadge from './FindingStatusBadge';

interface Props {
  finding: Finding;
  onClose: () => void;
  onStatusChange: (id: number, status: Finding['status']) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_OPTIONS: Finding['status'][] = ['open', 'confirmed', 'false_positive', 'resolved'];

export default function FindingDetailModal({ finding, onClose, onStatusChange }: Props) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(finding.status);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: Finding['status']) => {
    if (updating || currentStatus === newStatus) return;
    setUpdating(true);
    setStatusError(null);
    const result = await onStatusChange(finding.id, newStatus);
    if (result.success) {
      setCurrentStatus(newStatus);
    } else {
      setStatusError(result.error || 'Failed to update status');
    }
    setUpdating(false);
  };

  const cve = extractCVE(finding.evidence);
  const host = finding.scan_info?.target || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <FindingSeverityBadge severity={finding.severity} />
              <FindingStatusBadge status={currentStatus} />
              {finding.is_false_positive && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded-full">
                  False Positive
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{finding.title}</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              {host && <span className="font-mono">{host}</span>}
              {host && <span>·</span>}
              <span>{finding.tool}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Scan Info */}
          <div className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-4 text-xs text-gray-600">
            <span><span className="font-semibold text-gray-700">Scan:</span> {finding.scan_id}</span>
            <span><span className="font-semibold text-gray-700">Scanned:</span> {formatDate(finding.scan_info?.scan_date, true)}</span>
            <span><span className="font-semibold text-gray-700">Target:</span> {finding.scan_info?.target}</span>
          </div>

          {/* Description */}
          {finding.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{finding.description}</p>
            </div>
          )}

          {/* CVE */}
          {cve && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">CVE ID</h3>
              <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-sm font-mono">
                {cve}
              </span>
            </div>
          )}

          {/* Evidence */}
          {finding.evidence && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Evidence</h3>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                {finding.evidence}
              </pre>
            </div>
          )}

          {/* Notes */}
          {finding.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
              <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {finding.notes}
              </p>
            </div>
          )}

          {/* Update Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h3>
            {statusError && (
              <p className="text-xs text-red-600 mb-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                {statusError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  disabled={updating}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-all ${
                    currentStatus === s
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {updating && currentStatus !== s
                    ? '...'
                    : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex flex-wrap gap-4">
            <span>Created: {formatDate(finding.created_at)}</span>
            {finding.updated_at && (
              <span>Updated: {formatDate(finding.updated_at)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}