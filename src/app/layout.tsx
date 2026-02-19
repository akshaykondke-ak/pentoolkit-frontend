// src/app/layout.tsx
import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import '@/styles/themes.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pentoolkit',
  description: 'Security scanning platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
