// src/components/findings/FindingStatusBadge.tsx
import React from 'react';

type Status = 'open' | 'confirmed' | 'false_positive' | 'resolved';

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

const config: Record<Status, { label: string; classes: string }> = {
  open: {
    label: 'Open',
    classes: 'bg-red-50 text-red-700 border border-red-200',
  },
  confirmed: {
    label: 'Confirmed',
    classes: 'bg-orange-50 text-orange-700 border border-orange-200',
  },
  false_positive: {
    label: 'False Positive',
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-green-50 text-green-700 border border-green-200',
  },
};

export default function FindingStatusBadge({ status, size = 'md' }: Props) {
  const { label, classes } = config[status] ?? config.open;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-md font-medium ${sizeClasses} ${classes}`}>
      {label}
    </span>
  );
}