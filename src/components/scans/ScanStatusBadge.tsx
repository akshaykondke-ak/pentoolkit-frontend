// src/components/scans/ScanStatusBadge.tsx
// src/components/scans/ScanStatusBadge.tsx
// 'use client';
// import React from 'react';

// interface Props {
//   status: string;
//   showSpinner?: boolean;
// }

// const config: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
//   queued:    { label: 'Queued',    color: 'var(--text-muted)', bg: 'var(--bg-hover)',   border: 'var(--border-default)',  dot: 'var(--text-muted)'  },
//   running:   { label: 'Running',   color: 'var(--warn)',       bg: 'var(--warn-dim)',   border: 'rgba(255,170,0,0.25)',   dot: 'var(--warn)'        },
//   completed: { label: 'Complete',  color: 'var(--accent)',     bg: 'var(--accent-dim)', border: 'var(--accent-border)',   dot: 'var(--accent)'      },
//   failed:    { label: 'Failed',    color: 'var(--danger)',     bg: 'var(--danger-dim)', border: 'var(--danger-border)',   dot: 'var(--danger)'      },
//   cancelled: { label: 'Cancelled', color: 'var(--text-muted)', bg: 'var(--bg-hover)',   border: 'var(--border-default)',  dot: 'var(--text-muted)'  },
// };

// export default function ScanStatusBadge({ status, showSpinner = true }: Props) {
//   const cfg = config[status] ?? config.queued;
//   const isRunning = status === 'running' || status === 'queued';

//   return (
//     <span
//       className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium"
//       style={{
//         color: cfg.color,
//         backgroundColor: cfg.bg,
//         border: `1px solid ${cfg.border}`,
//         fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
//       }}
//     >
//       {isRunning && showSpinner ? (
//         <span
//           className="w-2 h-2 rounded-full animate-spin flex-shrink-0"
//           style={{
//             // ← Fix: use individual border properties instead of mixing
//             // shorthand `border` + `borderTopColor`
//             borderWidth: '1px',
//             borderStyle: 'solid',
//             borderColor: cfg.dot,
//             borderTopColor: 'transparent',
//           }}
//         />
//       ) : (
//         <span
//           className="w-1.5 h-1.5 rounded-full flex-shrink-0"
//           style={{ backgroundColor: cfg.dot }}
//         />
//       )}
//       {cfg.label}
//     </span>
//   );
// }

// src/components/scans/ScanStatusBadge.tsx
'use client';
import React from 'react';

interface Props {
  status: string;
  showSpinner?: boolean;
}

const config: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  queued:    { label: 'Queued',    color: 'var(--text-muted)', bg: 'var(--bg-hover)',   border: 'var(--border-default)',  dot: 'var(--text-muted)'  },
  running:   { label: 'Running',   color: 'var(--warn)',       bg: 'var(--warn-dim)',   border: 'rgba(255,170,0,0.25)',   dot: 'var(--warn)'        },
  completed: { label: 'Complete',  color: 'var(--accent)',     bg: 'var(--accent-dim)', border: 'var(--accent-border)',   dot: 'var(--accent)'      },
  failed:    { label: 'Failed',    color: 'var(--danger)',     bg: 'var(--danger-dim)', border: 'var(--danger-border)',   dot: 'var(--danger)'      },
  cancelled: { label: 'Cancelled', color: 'var(--text-muted)', bg: 'var(--bg-hover)',   border: 'var(--border-default)',  dot: 'var(--text-muted)'  },
};

export default function ScanStatusBadge({ status, showSpinner = true }: Props) {
  const cfg = config[status] ?? config.queued;
  const isRunning = status === 'running' || status === 'queued';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium"
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {isRunning && showSpinner ? (
        <span
          className="w-2 h-2 rounded-full animate-spin flex-shrink-0"
          style={{
            // ✅ FIX: use individual border-side properties, no shorthand mixing
            borderTopWidth:    '1px',
            borderRightWidth:  '1px',
            borderBottomWidth: '1px',
            borderLeftWidth:   '1px',
            borderTopStyle:    'solid',
            borderRightStyle:  'solid',
            borderBottomStyle: 'solid',
            borderLeftStyle:   'solid',
            borderTopColor:    'transparent',
            borderRightColor:  cfg.dot,
            borderBottomColor: cfg.dot,
            borderLeftColor:   cfg.dot,
          }}
        />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: cfg.dot }}
        />
      )}
      {cfg.label}
    </span>
  );
}