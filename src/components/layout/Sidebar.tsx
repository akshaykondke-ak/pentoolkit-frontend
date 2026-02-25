

// // 'use client';
// // // src/components/layout/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/store/authStore';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="8" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8" y="8" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/scans',
    label: 'Scans',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7.5 2v1.5M7.5 11.5V13M2 7.5h1.5M11.5 7.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/findings',
    label: 'Findings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1L13 4v7l-5.5 3L2 11V4l5.5-3z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7.5 7.5V5M7.5 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/reports',
    label: 'Reports',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="2" y="1" width="11" height="13" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 5h5M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  // ── NEW ──────────────────────────────────────────────────
  {
    href: '/dashboard/scheduled-scans',
    label: 'Scheduled',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1.5" y="2.5" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 1.5v2M10 1.5v2M1.5 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="7.5" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.1"/>
        <path d="M7.5 8.5V9.5l.8.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  // ─────────────────────────────────────────────────────────
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 13c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className="flex flex-col flex-shrink-0 transition-all duration-300"
      style={{
        width: collapsed ? 56 : 200,
        borderRight: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-base)',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-5"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ border: '1px solid var(--accent-border)' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 4l6-2 6 2v6l-6 2-6-2V4z" stroke="var(--accent)" strokeWidth="1.4" fill="none"/>
            <path d="M8 2v12M2 4l6 4 6-4" stroke="var(--accent)" strokeWidth="1.4" opacity="0.5"/>
          </svg>
        </div>
        {!collapsed && (
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            Pentoolkit
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto transition-colors flex-shrink-0"
          style={{ color: 'var(--text-faint)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={collapsed ? 'M2 6h8M5 3l3 3-3 3' : 'M10 6H2M7 3L4 6l3 3'}
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs transition-all duration-150"
              style={{
                backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="tracking-wide">{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin — only if role is admin */}
        {user?.role === 'admin' && (
          <Link
            href="/dashboard/admin"
            title={collapsed ? 'Admin' : undefined}
            className="flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs transition-all duration-150"
            style={{
              backgroundColor: isActive('/dashboard/admin') ? 'var(--accent-dim)' : 'transparent',
              color: isActive('/dashboard/admin') ? 'var(--accent)' : 'var(--text-muted)',
              border: isActive('/dashboard/admin') ? '1px solid var(--accent-border)' : '1px solid transparent',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!collapsed && <span className="tracking-wide">Admin</span>}
          </Link>
        )}
      </nav>

      {/* User + Logout */}
      <div style={{ borderTop: '1px solid var(--border-default)' }} className="p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-1.5">
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.full_name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className="flex items-center gap-3 w-full px-2.5 py-2 rounded-sm text-xs transition-all duration-150"
          style={{
            color: 'var(--text-muted)',
            border: '1px solid transparent',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger-dim)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-border)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0">
            <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span className="tracking-wide">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useState } from 'react';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useAuthStore } from '@/lib/store/authStore';

// const navItems = [
//   {
//     href: '/dashboard',
//     label: 'Dashboard',
//     exact: true,
//     icon: (
//       <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
//         <rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
//         <rect x="8" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
//         <rect x="1" y="8" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
//         <rect x="8" y="8" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
//       </svg>
//     ),
//   },
//   {
//     href: '/dashboard/scans',
//     label: 'Scans',
//     icon: (
//       <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
//         <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
//         <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
//         <path d="M7.5 2v1.5M7.5 11.5V13M2 7.5h1.5M11.5 7.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//       </svg>
//     ),
//   },
//   {
//     href: '/dashboard/findings',
//     label: 'Findings',
//     icon: (
//       <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
//         <path d="M7.5 1L13 4v7l-5.5 3L2 11V4l5.5-3z" stroke="currentColor" strokeWidth="1.2"/>
//         <path d="M7.5 7.5V5M7.5 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//       </svg>
//     ),
//   },
//   {
//     href: '/dashboard/reports',
//     label: 'Reports',
//     icon: (
//       <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
//         <rect x="2" y="1" width="11" height="13" rx="1" stroke="currentColor" strokeWidth="1.2"/>
//         <path d="M5 5h5M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//       </svg>
//     ),
//   },
//   {
//     href: '/dashboard/profile',
//     label: 'Profile',
//     icon: (
//       <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
//         <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
//         <path d="M2 13c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//       </svg>
//     ),
//   },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const { logout } = useAuth();
//   const { user } = useAuthStore();
//   const [collapsed, setCollapsed] = useState(false);

//   const isActive = (href: string, exact?: boolean) =>
//     exact ? pathname === href : pathname.startsWith(href);

//   return (
//     <aside
//       className="flex flex-col flex-shrink-0 transition-all duration-300"
//       style={{
//         width: collapsed ? 56 : 200,
//         borderRight: '1px solid var(--border-default)',
//         backgroundColor: 'var(--bg-base)',
//         fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
//       }}
//     >
//       {/* Logo */}
//       <div
//         className="flex items-center gap-2.5 px-4 py-5"
//         style={{ borderBottom: '1px solid var(--border-default)' }}
//       >
//         <div
//           className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
//           style={{ border: '1px solid var(--accent-border)' }}
//         >
//           <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
//             <path d="M2 4l6-2 6 2v6l-6 2-6-2V4z" stroke="var(--accent)" strokeWidth="1.4" fill="none"/>
//             <path d="M8 2v12M2 4l6 4 6-4" stroke="var(--accent)" strokeWidth="1.4" opacity="0.5"/>
//           </svg>
//         </div>
//         {!collapsed && (
//           <span
//             className="text-sm font-bold tracking-widest uppercase"
//             style={{ color: 'var(--accent)' }}
//           >
//             Pentoolkit
//           </span>
//         )}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="ml-auto transition-colors flex-shrink-0"
//           style={{ color: 'var(--text-faint)' }}
//         >
//           <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//             <path
//               d={collapsed ? 'M2 6h8M5 3l3 3-3 3' : 'M10 6H2M7 3L4 6l3 3'}
//               stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
//             />
//           </svg>
//         </button>
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 py-3 space-y-0.5 px-2">
//         {navItems.map((item) => {
//           const active = isActive(item.href, item.exact);
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               title={collapsed ? item.label : undefined}
//               className="flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs transition-all duration-150"
//               style={{
//                 backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
//                 color: active ? 'var(--accent)' : 'var(--text-muted)',
//                 border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
//               }}
//               onMouseEnter={e => {
//                 if (!active) {
//                   (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
//                   (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
//                 }
//               }}
//               onMouseLeave={e => {
//                 if (!active) {
//                   (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
//                   (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
//                 }
//               }}
//             >
//               <span className="flex-shrink-0">{item.icon}</span>
//               {!collapsed && <span className="tracking-wide">{item.label}</span>}
//             </Link>
//           );
//         })}

//         {/* Admin — only if role is admin */}
//         {user?.role === 'admin' && (
//           <Link
//             href="/dashboard/admin"
//             title={collapsed ? 'Admin' : undefined}
//             className="flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs transition-all duration-150"
//             style={{
//               backgroundColor: isActive('/dashboard/admin') ? 'var(--accent-dim)' : 'transparent',
//               color: isActive('/dashboard/admin') ? 'var(--accent)' : 'var(--text-muted)',
//               border: isActive('/dashboard/admin') ? '1px solid var(--accent-border)' : '1px solid transparent',
//             }}
//           >
//             <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0">
//               <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
//               <path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//             {!collapsed && <span className="tracking-wide">Admin</span>}
//           </Link>
//         )}
//       </nav>

//       {/* User + Logout */}
//       <div style={{ borderTop: '1px solid var(--border-default)' }} className="p-3 space-y-2">
//         {!collapsed && user && (
//           <div className="px-2 py-1.5">
//             <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.full_name}</p>
//             <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{user.email}</p>
//           </div>
//         )}
//         <button
//           onClick={logout}
//           title={collapsed ? 'Logout' : undefined}
//           className="flex items-center gap-3 w-full px-2.5 py-2 rounded-sm text-xs transition-all duration-150"
//           style={{
//             color: 'var(--text-muted)',
//             border: '1px solid transparent',
//           }}
//           onMouseEnter={e => {
//             (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
//             (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger-dim)';
//             (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-border)';
//           }}
//           onMouseLeave={e => {
//             (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
//             (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
//             (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
//           }}
//         >
//           <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0">
//             <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//           {!collapsed && <span className="tracking-wide">Logout</span>}
//         </button>
//       </div>
//     </aside>
//   );
// }

