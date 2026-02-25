// src/app/dashboard/scheduled-scans/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api/client';
import ScheduledScanForm from '@/components/scheduled-scans/ScheduledScanForm';

export default function EditScheduledScanPage() {
  const { id } = useParams<{ id: string }>();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/api/v1/scheduled-scans/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load scheduled scan'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-2"
      style={{ color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace" }}
    >
      <span className="w-3 h-3 rounded-full animate-spin" style={{
        borderWidth: 1.5, borderStyle: 'solid',
        borderTopColor: 'transparent',
        borderRightColor: 'var(--accent)',
        borderBottomColor: 'var(--accent)',
        borderLeftColor: 'var(--accent)',
      }} />
      <span className="text-xs">Loading...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-xs" style={{ color: 'var(--danger)', fontFamily: "'JetBrains Mono', monospace" }}>
        {error ?? 'Scan not found'}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <ScheduledScanForm existing={data} />
    </div>
  );
}