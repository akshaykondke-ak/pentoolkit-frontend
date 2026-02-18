// // src/components/layout/TopNav.tsx
// src/components/layout/TopNav.tsx


'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  scans: 'Scans',
  findings: 'Findings',
  reports: 'Reports',
  profile: 'Profile',
  admin: 'Admin',
  new: 'New Scan',
};

export default function TopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const segments = pathname.split('/').filter(Boolean);

  return (
    <header
      className="px-6 py-3 flex items-center justify-between"
      style={{
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-base)',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const href = '/' + segments.slice(0, i + 1).join('/');
          const label = breadcrumbMap[seg] ?? seg;
          return (
            <span key={seg} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: 'var(--border-strong)' }}>/</span>}
              {isLast ? (
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              ) : (
                <Link
                  href={href}
                  className="transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Online indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>online</span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 group"
        >
          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center transition-all"
            style={{
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-hover)',
            }}
          >
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <span
            className="hidden sm:block text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {user?.full_name}
          </span>
        </Link>
      </div>
    </header>
  );
}

// 'use client';

// import { usePathname } from 'next/navigation';
// import Link from 'next/link';
// import { useAuthStore } from '@/lib/store/authStore';

// const breadcrumbMap: Record<string, string> = {
//   dashboard: 'Dashboard',
//   scans: 'Scans',
//   findings: 'Findings',
//   reports: 'Reports',
//   profile: 'Profile',
//   admin: 'Admin',
//   new: 'New Scan',
// };

// export default function TopNav() {
//   const pathname = usePathname();
//   const { user } = useAuthStore();

//   const segments = pathname.split('/').filter(Boolean);

//   return (
//     <header
//       className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-6 py-3 flex items-center justify-between"
//       style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
//     >
//       {/* Breadcrumb */}
//       <nav className="flex items-center gap-1.5 text-xs">
//         {segments.map((seg, i) => {
//           const isLast = i === segments.length - 1;
//           const href = '/' + segments.slice(0, i + 1).join('/');
//           const label = breadcrumbMap[seg] ?? seg;
//           return (
//             <span key={seg} className="flex items-center gap-1.5">
//               {i > 0 && <span className="text-[#2a2a2a]">/</span>}
//               {isLast ? (
//                 <span className="text-[#888]">{label}</span>
//               ) : (
//                 <Link href={href} className="text-[#444] hover:text-[#888] transition-colors">{label}</Link>
//               )}
//             </span>
//           );
//         })}
//       </nav>

//       {/* Right side */}
//       <div className="flex items-center gap-4">
//         {/* Status indicator */}
//         <div className="hidden sm:flex items-center gap-1.5">
//           <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
//           <span className="text-[#333] text-xs">online</span>
//         </div>

//         {/* User */}
//         <Link href="/dashboard/profile" className="flex items-center gap-2.5 group">
//           <div className="w-6 h-6 rounded-sm border border-[#1f1f1f] bg-[#111] group-hover:border-[#00ff88]/30 transition-colors flex items-center justify-center">
//             <span className="text-[#666] text-xs font-bold group-hover:text-[#00ff88] transition-colors">
//               {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
//             </span>
//           </div>
//           <span className="hidden sm:block text-[#555] text-xs group-hover:text-[#888] transition-colors">
//             {user?.full_name}
//           </span>
//         </Link>
//       </div>
//     </header>
//   );
// }

// 'use client';

// import { useAuthStore } from '@/lib/store/authStore';
// import { usePathname } from 'next/navigation';

// const PAGE_TITLES: Record<string, string> = {
//   '/dashboard':          'Dashboard',
//   '/dashboard/scans':    'Scans',
//   '/dashboard/scans/new':'New Scan',
//   '/dashboard/findings': 'Findings',
//   '/dashboard/reports':  'Reports',
//   '/dashboard/profile':  'Profile',
// };

// export default function TopNav() {
//   const { user } = useAuthStore();
//   const pathname = usePathname();

//   // Match exact or prefix (e.g. /dashboard/scans/[id])
//   const title =
//     PAGE_TITLES[pathname] ??
//     Object.entries(PAGE_TITLES)
//       .filter(([k]) => pathname.startsWith(k) && k !== '/dashboard')
//       .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
//     'Dashboard';

//   const initials = (user?.full_name || 'U')
//     .split(' ')
//     .map((w: string) => w[0])
//     .slice(0, 2)
//     .join('')
//     .toUpperCase();

//   return (
//     <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-sm px-8 py-0 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
//       <div className="flex items-center justify-between h-14">
//         {/* Page title */}
//         <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>

//         {/* Right side */}
//         <div className="flex items-center gap-3">
//           <span className="text-sm text-gray-500">
//             Welcome, <span className="font-semibold text-gray-800">{user?.full_name || 'User'}</span>
//           </span>
//           <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
//             {initials}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }


// 'use client';

// import { useAuthStore } from '@/lib/store/authStore';

// export default function TopNav() {
//   const { user } = useAuthStore();

//   return (
//     <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
//         <div className="flex items-center gap-4">
//           <span className="text-sm text-gray-700">
//             Welcome, <strong>{user?.full_name || 'User'}</strong>
//           </span>
//           <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
//             {user?.full_name?.charAt(0) || 'U'}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }