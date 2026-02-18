# 📚 Pentoolkit Project - Complete Documentation V3

**Date**: February 18, 2026
**Status**: Phase 9 Complete — Ready for Phase 8 (Admin) or Phase 10 (Polish)
**Frontend**: Next.js 14 + TypeScript + Tailwind CSS
**Backend**: FastAPI + Python + PostgreSQL

---

## 📋 Phase Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (API client, Zustand, folder structure) | ✅ Done |
| 2 | Authentication (login, session, protected routes) | ✅ Done |
| 3 | Dashboard (sidebar, stats cards, layout) | ✅ Done |
| 4 | Scans (list, create, status badges) | ✅ Done |
| 5 | Findings (severity cards, filters, detail modal) | ✅ Done |
| 6 | Real-time polling (live scan status) | ✅ Done |
| 7 | Reports & Exports (HTML/PDF/CSV/JSON) | ✅ Done |
| 8 | Admin Panel (user management) | 🔜 Next |
| 9 | Profile & Settings | ✅ Done |
| 10 | Polish (charts, pagination, WebSocket) | 📋 Todo |

---

## 📁 Complete File Structure

```
src/
├── app/
│   ├── auth/login/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── scans/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx          ✅ Session 3
│   │   ├── findings/page.tsx          ✅ Session 2
│   │   ├── reports/page.tsx           ✅ Session 3
│   │   ├── profile/page.tsx           ✅ Session 3
│   │   └── admin/page.tsx             🔜 Phase 8
│   └── page.tsx
│
├── components/
│   ├── auth/LoginForm.tsx
│   ├── dashboard/StatCard.tsx
│   ├── scans/
│   │   ├── ScansList.tsx
│   │   ├── ScanForm.tsx               ✅ Redesigned S3
│   │   ├── ScanStatusBadge.tsx
│   │   └── ScanProgressCard.tsx
│   ├── findings/
│   │   ├── FindingsList.tsx
│   │   ├── FindingDetailModal.tsx
│   │   ├── FindingSeverityBadge.tsx
│   │   ├── FindingStatusBadge.tsx
│   │   └── FindingsFilterBar.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── TopNav.tsx
│       └── ProtectedRoute.tsx
│
└── lib/
    ├── api/
    │   ├── client.ts
    │   ├── auth.ts
    │   ├── scans.ts
    │   ├── findings.ts
    │   └── reports.ts                 ✅ Session 3
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useScans.ts
    │   ├── useFindings.ts
    │   └── useScanPolling.ts
    └── store/
        └── authStore.ts
```

---

## 🌐 All Working API Endpoints

### Auth
```
POST  /api/v1/register          → { id, email, full_name, role, ... }
POST  /api/v1/login             → { session_id, user, expires_at }
POST  /api/v1/logout
GET   /api/v1/me                → user object
PATCH /api/v1/me                → body: { full_name }
POST  /api/v1/me/change-password → { current_password, new_password }
GET   /api/v1/me/sessions       → { total, sessions: [{session_id, created_at, expires_at}] }
DELETE /api/v1/me/sessions      → logout all devices
```

### Scans
```
GET   /api/v1/scans             → array or { scans: [] }
POST  /api/v1/scans             → { scan_id, status, target, tools_used }
GET   /api/v1/scans/{id}
GET   /api/v1/scans/{id}/status → { scan_id, status, progress: {current_tool, completed_tools, total_tools, percent} }
POST  /api/v1/scans/{id}/cancel
GET   /api/v1/scans/{id}/findings
```

### Findings
```
GET   /api/v1/findings          → { total, skip, limit, count, findings: [] }
PATCH /api/v1/findings/{id}     → body: { status, notes, is_false_positive }
```

### Reports
```
GET   /api/v1/scans/{id}/report?format=html|json  → file download
GET   /api/v1/scans/{id}/report/status            → { report_ready, generated_at }
GET   /api/v1/scans/{id}/export?format=pdf|csv|json → file download
```

---

## 📊 Key Data Shapes

### User Object
```json
{
  "id": "user_1f28c1ce9323",
  "email": "user@example.com",
  "full_name": "Dev",
  "role": "user",
  "is_active": true,
  "is_verified": true,
  "created_at": "2026-02-18T09:24:14Z",
  "last_login": "2026-02-18T09:25:22Z"
}
```

### Finding Object
```json
{
  "id": 142,
  "scan_id": "scan_20260218_...",
  "tool": "wpscan",
  "severity": "info",
  "title": "WordPress Detected",
  "description": "...",
  "evidence": "CVE: 2021-25103 ...",
  "status": "open",
  "notes": null,
  "is_false_positive": false,
  "created_at": "2026-02-18T...",
  "updated_at": null,
  "scan_info": { "target": "rivedix.com", ... }
}
```

### Scan Progress Object
```json
{
  "current_tool": "nmap",
  "completed_tools": 1,
  "total_tools": 3,
  "percent": 33
}
```
⚠️ Always use `resolveProgress()` from `useScanPolling.ts` — never render progress directly!

---

## 🔑 Key Helper Functions

```typescript
// src/lib/api/findings.ts
getHost(finding)          // → "rivedix.com" from scan_info.target
extractCVE(evidence)      // → "CVE-2021-25103" from evidence text
formatDate(str, short?)   // → safe date, handles null

// src/lib/hooks/useScanPolling.ts
resolveProgress(progress) // → 0-100 number from any progress shape
getCurrentTool(progress)  // → "nmap" string from progress object
```

---

## ⚠️ Critical Gotchas

| Gotcha | Detail |
|--------|--------|
| Finding `id` | Number not string |
| Finding `host` | Doesn't exist — use `scan_info.target` |
| Finding `cve_id` | Doesn't exist — use `extractCVE(evidence)` |
| Scan `progress` | Object not number — use `resolveProgress()` |
| Findings list | `GET /api/v1/findings` returns `{ findings: [] }` not array |
| Scans list | May be array or `{ scans: [] }` — handle both |
| Error format | FastAPI: `{ detail: [{loc, msg, type}] }` — parse with extractErrorMessage() |

---

## 🔜 Phase 8: Admin Panel

Before building, check Swagger for:
- `GET /api/v1/admin/users` — list all users
- `PATCH /api/v1/admin/users/{id}` — activate/deactivate
- `GET /api/v1/admin/stats` — system stats
- Any other admin-only endpoints

Admin page should only render if `user.role === 'admin'`
Check role from: `useAuthStore().user.role`

---

## 📞 Quick Reference

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Project: `/Users/rivedix/Desktop/pentoolkit-frontend`