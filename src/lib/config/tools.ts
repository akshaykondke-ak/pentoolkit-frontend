/**
 * src/lib/config/tools.ts
 *
 * Single source of truth for all tool definitions on the frontend.
 *
 * Adding a new tool:
 *   1. Add one entry to the TOOLS array below
 *   2. ScanForm, ScansList, ScanDetailPage all update automatically
 *   3. ScanOptions type updates automatically via ToolOptionsMap
 *
 * Nothing else needs to change on the frontend.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FIELD TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectChoice {
  value:        string;
  label:        string;
  desc:         string;
  time:         string;
  requiresNote?: string;   // e.g. "Requires root" — shown as a warning badge
}

export interface SelectField {
  type:    'select';
  key:     string;
  label:   string;
  default: string;
  choices: SelectChoice[];
}

export interface ToggleField {
  type:    'toggle';
  key:     string;
  label:   string;
  desc:    string;
  default: boolean;
}

export interface NumberField {
  type:    'number';
  key:     string;
  label:   string;
  desc:    string;
  default: number;
  min:     number;
  max:     number;
}

export type ToolOptionField = SelectField | ToggleField | NumberField;

// ─────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolDefinition {
  id:           string;
  label:        string;
  desc:         string;
  color:        string;   // CSS variable or hex, used for checkbox + badge
  configurable: boolean;  // true = show ⚙ Options button in ScanForm
  fields:       ToolOptionField[];
}

// ─────────────────────────────────────────────────────────────────────────────
// THE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const TOOLS: ToolDefinition[] = [

  // ── Nmap ────────────────────────────────────────────────────────────────
  {
    id:           'nmap',
    label:        'Nmap',
    desc:         'Port scanning & service detection',
    color:        'var(--severity-info)',
    configurable: true,
    fields: [
      {
        type:    'select',
        key:     'scan_type',
        label:   'Scan Type',
        default: 'short',
        choices: [
          {
            value: 'short',
            label: 'Short',
            desc:  'Top 100 ports, service version detection',
            time:  '~30s',
          },
          {
            value: 'fast',
            label: 'Fast',
            desc:  'Top 100 ports, aggressive T4 timing',
            time:  '~15s',
          },
          {
            value: 'deep',
            label: 'Deep',
            desc:  'All 65535 ports, OS detection, full scripts',
            time:  '~10-30m',
          },
          {
            value:        'stealth',
            label:        'Stealth (SYN)',
            desc:         'SYN scan — never completes TCP handshake, harder to log',
            time:         '~1-5m',
            requiresNote: 'Requires root',
          },
          {
            value:        'decoy',
            label:        'Decoy',
            desc:         'Sends from random decoy IPs to confuse IDS attribution',
            time:         '~2-5m',
            requiresNote: 'Requires root',
          },
          {
            value:        'udp',
            label:        'UDP Scan',
            desc:         'UDP ports — finds DNS, SNMP, TFTP, and other UDP services',
            time:         '~5-15m',
            requiresNote: 'Requires root',
          },
          {
            value: 'version-intense',
            label: 'Version Intense',
            desc:  'Maximum version detection effort (intensity 9)',
            time:  '~2-5m',
          },
          {
            value: 'script-vuln',
            label: 'Vuln Scripts',
            desc:  'Runs all Nmap vulnerability detection NSE scripts',
            time:  '~5-15m',
          },
          {
            value: 'discovery',
            label: 'Discovery',
            desc:  'Host discovery only — no port scan',
            time:  '~10s',
          },
          {
            value: 'firewall-bypass',
            label: 'Firewall Bypass',
            desc:  'ACK scan to detect stateful firewall rules',
            time:  '~30s',
          },
          {
            value: 'slow',
            label: 'Slow / Stealthy',
            desc:  '200ms inter-probe delay to evade rate-based IDS',
            time:  'varies',
          },
        ],
      },
    ],
  },

  // ── HTTPX ───────────────────────────────────────────────────────────────
  {
    id:           'httpx',
    label:        'HTTPX',
    desc:         'HTTP probe & technology fingerprinting',
    color:        'var(--severity-medium)',
    configurable: false,   // no user options yet
    fields:       [],
  },

  // ── Subfinder ───────────────────────────────────────────────────────────
  {
    id:           'subfinder',
    label:        'Subfinder',
    desc:         'Passive subdomain discovery & enumeration',
    color:        'var(--info)',
    configurable: true,
    fields: [
      {
        type:    'toggle',
        key:     'recursive',
        label:   'Recursive Discovery',
        desc:    'Also enumerate subdomains of discovered subdomains (slower)',
        default: false,
      },
    ],
  },

  // ── TLS Info ────────────────────────────────────────────────────────────
  {
    id:           'tlsinfo',
    label:        'TLS Info',
    desc:         'SSL/TLS certificate & cipher suite analysis',
    color:        'var(--accent)',
    configurable: true,
    fields: [
      {
        type:    'toggle',
        key:     'enumerate_ciphers',
        label:   'Enumerate Cipher Suites',
        desc:    'Test every supported cipher — slower but produces full SSL Labs-style table',
        default: true,
      },
    ],
  },

  // ── Nuclei ──────────────────────────────────────────────────────────────
  {
    id:           'nuclei',
    label:        'Nuclei',
    desc:         'Template-based vulnerability scanner',
    color:        'var(--severity-critical)',
    configurable: true,
    fields: [
      {
        type:    'select',
        key:     'severity',
        label:   'Severity Filter',
        default: 'all',
        choices: [
          { value: 'all',               label: 'All Severities', desc: 'Run all templates',                        time: 'varies'    },
          { value: 'critical,high',     label: 'Crit + High',    desc: 'Critical and high templates only',         time: '~faster'   },
          { value: 'critical,high,medium', label: 'Med +',       desc: 'Medium severity and above',                time: '~medium'   },
          { value: 'critical',          label: 'Critical Only',  desc: 'Critical severity templates only',         time: '~fastest'  },
        ],
      },
      {
        type:    'number',
        key:     'rate_limit',
        label:   'Rate Limit (req/sec)',
        desc:    'Maximum HTTP requests per second sent to the target',
        default: 50,
        min:     10,
        max:     500,
      },
    ],
  },

  // ── WPScan ──────────────────────────────────────────────────────────────
  {
    id:           'wpscan',
    label:        'WPScan',
    desc:         'WordPress vulnerability scanner',
    color:        'var(--severity-high)',
    configurable: true,
    fields: [
      {
        type:    'select',
        key:     'scan_mode',
        label:   'Scan Mode',
        default: 'light',
        choices: [
          { value: 'light',    label: 'Light',    desc: 'Vulnerable plugins only — good for CI/CD', time: '~30s-3m'  },
          { value: 'standard', label: 'Standard', desc: 'Plugins, themes, and user enumeration',    time: '~5-10m'   },
          { value: 'full',     label: 'Full',     desc: 'Complete enumeration of everything',        time: '~15-30m'  },
        ],
      },
    ],
  },

  // ── Nikto ───────────────────────────────────────────────────────────────
  {
    id:           'nikto',
    label:        'Nikto',
    desc:         'Web server misconfiguration scanner',
    color:        'var(--warn)',
    configurable: true,
    fields: [
      {
        type:    'select',
        key:     'scan_mode',
        label:   'Scan Mode',
        default: 'quick',
        choices: [
          { value: 'quick',    label: 'Quick',    desc: 'Essential checks — files, misconfig, info disclosure', time: '~2-5m'    },
          { value: 'standard', label: 'Standard', desc: 'Most checks, no denial-of-service tests',             time: '~10-15m'  },
          { value: 'thorough', label: 'Thorough', desc: 'All ~6700 checks including full tuning',              time: '~20-40m'  },
        ],
      },
    ],
  },

  // ── WAF Detector ────────────────────────────────────────────────────────
  {
    id:           'waf',
    label:        'WAF Detector',
    desc:         'Web Application Firewall detection via wafw00f',
    color:        '#ea580c',
    configurable: false,
    fields:       [],
  },


  // ── DMARC Checker ───────────────────────────────────────────────────────
  {
    id:           'dmarc',
    label:        'DMARC Checker',
    desc:         'Email security: DMARC, SPF, DKIM & MX record analysis',
    color:        '#0284c7',
    configurable: false,
    fields:       [],
  },



  // ════════════════════════════════════════════════════════════════════════
  // FUTURE TOOL TEMPLATE — copy this block when adding a new tool
  // ════════════════════════════════════════════════════════════════════════
  //
  // {
  //   id:           'dmarc',
  //   label:        'DMARC Checker',
  //   desc:         'DNS-based email authentication record checker',
  //   color:        'var(--severity-info)',
  //   configurable: true,
  //   fields: [
  //     {
  //       type:    'toggle',
  //       key:     'check_spf',
  //       label:   'Also Check SPF',
  //       desc:    'Validate SPF record in addition to DMARC',
  //       default: true,
  //     },
  //     {
  //       type:    'number',
  //       key:     'timeout',
  //       label:   'DNS Timeout (s)',
  //       desc:    'Timeout per DNS lookup in seconds',
  //       default: 10,
  //       min:     2,
  //       max:     30,
  //     },
  //   ],
  // },

];

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED TYPES & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Map of tool ID → its option object shape (used for ScanOptions type) */
export type ToolOptionsMap = {
  [K in typeof TOOLS[number]['id']]?: Record<string, string | boolean | number>;
};

/** Lookup a tool definition by ID */
export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS.find(t => t.id === id);
}

/** Get the default options object for a tool */
export function getToolDefaults(id: string): Record<string, string | boolean | number> {
  const tool = getTool(id);
  if (!tool) return {};
  return Object.fromEntries(
    tool.fields.map(f => [f.key, f.default])
  );
}

/** Check if a tool has any configurable options */
export function isConfigurable(id: string): boolean {
  return getTool(id)?.configurable ?? false;
}

/**
 * Get a human-readable label for a specific option value.
 * e.g. getOptionLabel('nmap', 'scan_type', 'deep') → 'Deep'
 */
export function getOptionLabel(toolId: string, fieldKey: string, value: string): string {
  const tool = getTool(toolId);
  if (!tool) return value;
  const field = tool.fields.find(f => f.key === fieldKey);
  if (!field || field.type !== 'select') return value;
  return field.choices.find(c => c.value === value)?.label ?? value;
}

/**
 * Get time estimate for a specific option value.
 * e.g. getOptionTime('nmap', 'scan_type', 'deep') → '~10-30m'
 */
export function getOptionTime(toolId: string, fieldKey: string, value: string): string {
  const tool = getTool(toolId);
  if (!tool) return '';
  const field = tool.fields.find(f => f.key === fieldKey);
  if (!field || field.type !== 'select') return '';
  return field.choices.find(c => c.value === value)?.time ?? '';
}

/**
 * Check if a specific option value requires root privileges.
 */
export function requiresRoot(toolId: string, fieldKey: string, value: string): boolean {
  const tool = getTool(toolId);
  if (!tool) return false;
  const field = tool.fields.find(f => f.key === fieldKey);
  if (!field || field.type !== 'select') return false;
  return !!(field.choices.find(c => c.value === value)?.requiresNote);
}

/** IDs of all registered tools */
export const TOOL_IDS = TOOLS.map(t => t.id);

/** IDs of configurable tools (have options UI) */
export const CONFIGURABLE_TOOL_IDS = TOOLS.filter(t => t.configurable).map(t => t.id);