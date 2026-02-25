// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: src/app/dashboard/scheduled-scans/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
import ScheduledScansList from '@/components/scheduled-scans/ScheduledScansList';

export const metadata = { title: 'Scheduled Scans — Pentoolkit' };

export default function ScheduledScansPage() {
  return <ScheduledScansList />;
}
