// src/components/findings/FindingSeverityBadge.tsx
import React from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface Props {
  severity: Severity;
  size?: 'sm' | 'md';
}

const config: Record<Severity, { label: string; classes: string; dot: string }> = {
  critical: {
    label: 'Critical',
    classes: 'bg-red-100 text-red-800 border border-red-200',
    dot: 'bg-red-500',
  },
  high: {
    label: 'High',
    classes: 'bg-orange-100 text-orange-800 border border-orange-200',
    dot: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    dot: 'bg-yellow-500',
  },
  low: {
    label: 'Low',
    classes: 'bg-blue-100 text-blue-800 border border-blue-200',
    dot: 'bg-blue-500',
  },
  info: {
    label: 'Info',
    classes: 'bg-gray-100 text-gray-700 border border-gray-200',
    dot: 'bg-gray-400',
  },
};

export default function FindingSeverityBadge({ severity, size = 'md' }: Props) {
  const { label, classes, dot } = config[severity] ?? config.info;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}