// src/app/dashboard/scheduled-scans/new/page.tsx
import ScheduledScanForm from '@/components/scheduled-scans/ScheduledScanForm';

export const metadata = { title: 'New Scheduled Scan — Pentoolkit' };

export default function NewScheduledScanPage() {
  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <ScheduledScanForm />
    </div>
  );
}