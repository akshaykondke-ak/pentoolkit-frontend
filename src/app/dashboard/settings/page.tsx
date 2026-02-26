// src/app/dashboard/settings/page.tsx
// This file just imports and renders the SettingsPage component.
// The actual component is in src/components/settings/SettingsPage.tsx

import SettingsPage from '@/components/settings/SettingsPage';
import NotificationSettings from "@/components/settings/NotificationSettings";


export default function Page() {
  return <NotificationSettings />;
}