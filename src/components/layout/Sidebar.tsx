

// 'use client';
// // src/components/layout/Sidebar.tsx


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
//       className="flex flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] transition-all duration-300 flex-shrink-0"
//       style={{ width: collapsed ? 56 : 200, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
//     >
//       {/* Logo */}
//       <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#1a1a1a]">
//         <div className="w-6 h-6 rounded border border-[#00ff88]/40 flex items-center justify-center flex-shrink-0">
//           <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
//             <path d="M2 4l6-2 6 2v6l-6 2-6-2V4z" stroke="#00ff88" strokeWidth="1.4" fill="none"/>
//             <path d="M8 2v12M2 4l6 4 6-4" stroke="#00ff88" strokeWidth="1.4" opacity="0.5"/>
//           </svg>
//         </div>
//         {!collapsed && (
//           <span className="text-[#00ff88] text-sm font-bold tracking-widest uppercase">Pentoolkit</span>
//         )}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="ml-auto text-[#333] hover:text-[#666] transition-colors flex-shrink-0"
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
//               className={`flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs transition-all duration-150 group ${
//                 active
//                   ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
//                   : 'text-[#444] hover:text-[#888] hover:bg-[#111] border border-transparent'
//               }`}
//               title={collapsed ? item.label : undefined}
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
//             className={`flex items-center gap-3 px-2.5 py-2 rounded-sm text-xs transition-all duration-150 border ${
//               isActive('/dashboard/admin')
//                 ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
//                 : 'text-[#444] hover:text-[#888] hover:bg-[#111] border-transparent'
//             }`}
//             title={collapsed ? 'Admin' : undefined}
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
//       <div className="border-t border-[#1a1a1a] p-3 space-y-2">
//         {!collapsed && user && (
//           <div className="px-2 py-1.5">
//             <p className="text-[#888] text-xs truncate">{user.full_name}</p>
//             <p className="text-[#333] text-xs truncate">{user.email}</p>
//           </div>
//         )}
//         <button
//           onClick={logout}
//           className="flex items-center gap-3 w-full px-2.5 py-2 rounded-sm text-xs text-[#444] hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all duration-150"
//           title={collapsed ? 'Logout' : undefined}
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

// import Link from 'next/link';
// import { useRouter, usePathname } from 'next/navigation';
// import { useAuthStore } from '@/lib/store/authStore';
// import { useEffect, useState } from 'react';

// const menuItems = [
//   { href: '/dashboard',          label: 'Dashboard', icon: '📊' },
//   { href: '/dashboard/scans',    label: 'Scans',     icon: '🔍' },
//   { href: '/dashboard/findings', label: 'Findings',  icon: '⚠️' },
//   { href: '/dashboard/reports',  label: 'Reports',   icon: '📄' },
//   { href: '/dashboard/profile',  label: 'Profile',   icon: '👤' },
// ];

// export default function Sidebar() {
//   const pathname      = usePathname();
//   const router        = useRouter();
//   const { logout }    = useAuthStore();
//   const [collapsed, setCollapsed] = useState(false);

//   // Persist state in localStorage
//   useEffect(() => {
//     const saved = localStorage.getItem('sidebar-collapsed');
//     if (saved === 'true') setCollapsed(true);
//   }, []);

//   const toggle = () => {
//     setCollapsed(prev => {
//       localStorage.setItem('sidebar-collapsed', String(!prev));
//       return !prev;
//     });
//   };

//   const handleLogout = async () => {
//     await logout();
//     router.push('/auth/login');
//   };

//   const isActive = (href: string) =>
//     href === '/dashboard'
//       ? pathname === '/dashboard'
//       : pathname === href || pathname.startsWith(href + '/');

//   return (
//     <aside
//       className="relative flex h-screen flex-col bg-gray-950 text-white shrink-0 transition-all duration-300 ease-in-out"
//       style={{ width: collapsed ? '64px' : '220px' }}
//     >
//       {/* Logo */}
//       <div className="flex items-center h-14 border-b border-white/[0.06] px-4 overflow-hidden">
//         <span className="text-xl shrink-0">🛡️</span>
//         {!collapsed && (
//           <span className="ml-2.5 text-base font-bold tracking-tight whitespace-nowrap">
//             Pentoolkit
//           </span>
//         )}
//       </div>

//       {/* Toggle button on right edge */}
//       <button
//         onClick={toggle}
//         className="absolute -right-3 top-10 z-50 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all shadow-md"
//         title={collapsed ? 'Expand' : 'Collapse'}
//       >
//         <svg
//           className={`w-3 h-3 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
//           viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//         </svg>
//       </button>

//       {/* Nav items */}
//       <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
//         {menuItems.map(item => {
//           const active = isActive(item.href);
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               title={collapsed ? item.label : undefined}
//               className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
//                 ${collapsed ? 'justify-center' : ''}
//                 ${active
//                   ? 'bg-blue-600 text-white'
//                   : 'text-gray-400 hover:text-white hover:bg-white/[0.07]'
//                 }`}
//             >
//               <span className="text-base leading-none shrink-0">{item.icon}</span>
//               {!collapsed && (
//                 <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
//               )}
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Logout */}
//       <div className="px-2 pb-4 pt-3 border-t border-white/[0.06]">
//         <button
//           onClick={handleLogout}
//           title={collapsed ? 'Logout' : undefined}
//           className={`w-full flex items-center gap-2 rounded-lg bg-red-600/90 hover:bg-red-600 px-3 py-2 text-sm font-semibold transition-colors justify-center`}
//         >
//           <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//           </svg>
//           {!collapsed && <span>Logout</span>}
//         </button>
//       </div>
//     </aside>
//   );
// }