// // // src/components/layout/TopNav.tsx
// // src/components/layout/TopNav.tsx


// 'use client';

// import { usePathname } from 'next/navigation';
// import Link from 'next/link';
// import { useAuthStore } from '@/lib/store/authStore';
// import ThemeToggle from '@/components/ui/ThemeToggle';

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
//       className="px-6 py-3 flex items-center justify-between"
//       style={{
//         borderBottom: '1px solid var(--border-default)',
//         backgroundColor: 'var(--bg-base)',
//         fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
//       }}
//     >
//       {/* Breadcrumb */}
//       <nav className="flex items-center gap-1.5 text-xs">
//         {segments.map((seg, i) => {
//           const isLast = i === segments.length - 1;
//           const href = '/' + segments.slice(0, i + 1).join('/');
//           const label = breadcrumbMap[seg] ?? seg;
//           return (
//             <span key={seg} className="flex items-center gap-1.5">
//               {i > 0 && <span style={{ color: 'var(--border-strong)' }}>/</span>}
//               {isLast ? (
//                 <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
//               ) : (
//                 <Link
//                   href={href}
//                   className="transition-colors hover:opacity-80"
//                   style={{ color: 'var(--text-muted)' }}
//                 >
//                   {label}
//                 </Link>
//               )}
//             </span>
//           );
//         })}
//       </nav>

//       {/* Right side */}
//       <div className="flex items-center gap-3">
//         {/* Online indicator */}
//         <div className="hidden sm:flex items-center gap-1.5">
//           <span
//             className="w-1.5 h-1.5 rounded-full animate-pulse"
//             style={{ backgroundColor: 'var(--accent)' }}
//           />
//           <span className="text-xs" style={{ color: 'var(--text-faint)' }}>online</span>
//         </div>

//         {/* Theme toggle */}
//         <ThemeToggle />

//         {/* User avatar */}
//         <Link
//           href="/dashboard/profile"
//           className="flex items-center gap-2.5 group"
//         >
//           <div
//             className="w-6 h-6 rounded-sm flex items-center justify-center transition-all"
//             style={{
//               border: '1px solid var(--border-default)',
//               backgroundColor: 'var(--bg-hover)',
//             }}
//           >
//             <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
//               {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
//             </span>
//           </div>
//           <span
//             className="hidden sm:block text-xs transition-colors"
//             style={{ color: 'var(--text-muted)' }}
//           >
//             {user?.full_name}
//           </span>
//         </Link>
//       </div>
//     </header>
//   );
// }


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
  settings: 'Settings',
  scheduled: 'Scheduled',
  'scheduled-scans': 'Scheduled Scans',
};

export default function TopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const segments = pathname.split('/').filter(Boolean);

  const isSettings = pathname.startsWith('/dashboard/settings');

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

        {/* Settings gear icon */}
        <Link
          href="/dashboard/settings"
          title="Settings"
          className="flex items-center justify-center w-6 h-6 rounded-sm transition-all"
          style={{
            border: `1px solid ${isSettings ? 'var(--accent-border)' : 'var(--border-default)'}`,
            backgroundColor: isSettings ? 'var(--accent-dim)' : 'var(--bg-hover)',
            color: isSettings ? 'var(--accent)' : 'var(--text-muted)',
          }}
          onMouseEnter={e => {
            if (!isSettings) {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            }
          }}
          onMouseLeave={e => {
            if (!isSettings) {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
            }
          }}
        >
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <path
              d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.4 3.4l.7.7M10.9 10.9l.7.7M10.9 4.1l-.7.7M4.2 10.8l-.7.7"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
            />
          </svg>
        </Link>

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