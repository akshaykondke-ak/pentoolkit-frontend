// src/components/scans/ScanStatusBadge.tsx
import React from 'react';
import { ScanStatus } from '@/lib/hooks/useScanPolling';

interface Props {
  status: ScanStatus | string;
  showSpinner?: boolean;
}

const config: Record<string, { label: string; classes: string; spin?: boolean }> = {
  queued:    { label: 'Queued',    classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  running:   { label: 'Running',   classes: 'bg-blue-100 text-blue-700 border border-blue-200', spin: true },
  completed: { label: 'Completed', classes: 'bg-green-100 text-green-700 border border-green-200' },
  failed:    { label: 'Failed',    classes: 'bg-red-100 text-red-700 border border-red-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
};

export default function ScanStatusBadge({ status, showSpinner = true }: Props) {
  const cfg = config[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600 border border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.spin && showSpinner ? (
        <span className="w-2 h-2 rounded-full border border-blue-500 border-t-transparent animate-spin" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : status === 'running' ? 'bg-blue-500' : 'bg-gray-400'}`} />
      )}
      {cfg.label}
    </span>
  );
}





// interface ScanStatusBadgeProps {
//   status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
// }

// export default function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
//   const styles = {
//     queued: 'bg-gray-100 text-gray-800',
//     running: 'bg-blue-100 text-blue-800',
//     completed: 'bg-green-100 text-green-800',
//     failed: 'bg-red-100 text-red-800',
//     cancelled: 'bg-yellow-100 text-yellow-800',
//   };

//   const icons = {
//     queued: '⏳',
//     running: '⚙️',
//     completed: '✅',
//     failed: '❌',
//     cancelled: '⛔',
//   };

//   return (
//     <span
//       className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
//         styles[status] || styles.queued
//       }`}
//     >
//       <span>{icons[status]}</span>
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </span>
//   );
// }