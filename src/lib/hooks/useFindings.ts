// src/lib/hooks/useFindings.ts
// src/lib/hooks/useFindings.ts
// src/lib/api/findings.ts
// src/lib/hooks/useFindings.ts
import { useState, useCallback, useEffect } from 'react';
import { findingsAPI, Finding, FindingsFilters } from '../api/findings';

const PAGE_SIZE = 25;

export function useFindings(initialFilters?: FindingsFilters) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [total, setTotal]       = useState(0);
  const [filters, setFilters]   = useState<FindingsFilters>(initialFilters || {});
  const [page, setPage]         = useState(0); // 0-indexed

  const fetchFindings = useCallback(async (
    overrideFilters?: FindingsFilters,
    overridePage?: number,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = overrideFilters ?? filters;
      const activePage    = overridePage    ?? page;
      const data = await findingsAPI.list({
        ...activeFilters,
        skip:  activePage * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setFindings(Array.isArray(data.findings) ? data.findings : []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch findings';
      setError(message);
      setFindings([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const updateFinding = useCallback(async (
    id: number,
    payload: { status?: Finding['status']; notes?: string; is_false_positive?: boolean },
  ) => {
    try {
      const updated = await findingsAPI.update(id, payload);
      setFindings(prev => prev.map(f => (f.id === updated.id ? updated : f)));
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update finding';
      return { success: false, error: message };
    }
  }, []);

  const applyFilters = useCallback((newFilters: FindingsFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    setPage(0);
    fetchFindings(merged, 0);
  }, [filters, fetchFindings]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(0);
    fetchFindings({}, 0);
  }, [fetchFindings]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
    fetchFindings(undefined, newPage);
  }, [fetchFindings]);

  useEffect(() => {
    fetchFindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    findings, loading, error, total,
    filters, fetchFindings,
    updateFinding, applyFilters, clearFilters,
    page, totalPages, pageSize: PAGE_SIZE, goToPage,
  };
}

// import { useState, useCallback, useEffect } from 'react';
// import { findingsAPI, Finding, FindingsFilters } from '../api/findings';

// export function useFindings(initialFilters?: FindingsFilters) {
//   const [findings, setFindings] = useState<Finding[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [total, setTotal] = useState(0);
//   const [filters, setFilters] = useState<FindingsFilters>(initialFilters || {});

//   const fetchFindings = useCallback(async (overrideFilters?: FindingsFilters) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const activeFilters = overrideFilters ?? filters;
//       const data = await findingsAPI.list(activeFilters);
//       setFindings(Array.isArray(data.findings) ? data.findings : []);
//       setTotal(data.total ?? 0);
//     } catch (err: unknown) {
//       const message = err instanceof Error ? err.message : 'Failed to fetch findings';
//       setError(message);
//       setFindings([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [filters]);

//   const updateFinding = useCallback(async (
//     id: number,
//     payload: { status?: Finding['status']; notes?: string; is_false_positive?: boolean }
//   ) => {
//     try {
//       const updated = await findingsAPI.update(id, payload);
//       setFindings(prev => prev.map(f => (f.id === updated.id ? updated : f)));
//       return { success: true };
//     } catch (err: unknown) {
//       const message = err instanceof Error ? err.message : 'Failed to update finding';
//       return { success: false, error: message };
//     }
//   }, []);

//   const applyFilters = useCallback((newFilters: FindingsFilters) => {
//     const merged = { ...filters, ...newFilters };
//     setFilters(merged);
//     fetchFindings(merged);
//   }, [filters, fetchFindings]);

//   const clearFilters = useCallback(() => {
//     setFilters({});
//     fetchFindings({});
//   }, [fetchFindings]);

//   useEffect(() => {
//     fetchFindings();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return { findings, loading, error, total, filters, fetchFindings, updateFinding, applyFilters, clearFilters };
// }