// src/lib/hooks/useFindings.ts
import { useState, useCallback, useEffect } from 'react';
import { findingsAPI, Finding, FindingsFilters } from '../api/findings';

export function useFindings(initialFilters?: FindingsFilters) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FindingsFilters>(initialFilters || {});

  const fetchFindings = useCallback(async (overrideFilters?: FindingsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = overrideFilters ?? filters;
      const data = await findingsAPI.list(activeFilters);
      setFindings(Array.isArray(data.findings) ? data.findings : []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch findings';
      setError(message);
      setFindings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFinding = useCallback(async (
    id: number,
    payload: { status?: Finding['status']; notes?: string; is_false_positive?: boolean }
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
    fetchFindings(merged);
  }, [filters, fetchFindings]);

  const clearFilters = useCallback(() => {
    setFilters({});
    fetchFindings({});
  }, [fetchFindings]);

  useEffect(() => {
    fetchFindings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { findings, loading, error, total, filters, fetchFindings, updateFinding, applyFilters, clearFilters };
}