'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface AdminListState {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_LIMIT = 10;

export function useAdminListState(defaults?: Partial<AdminListState>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo<AdminListState>(() => ({
    page: Math.max(1, Number(searchParams.get('page')) || defaults?.page || 1),
    limit: Number(searchParams.get('limit')) || defaults?.limit || DEFAULT_LIMIT,
    search: searchParams.get('search') ?? defaults?.search ?? '',
    sortBy: searchParams.get('sortBy') ?? defaults?.sortBy ?? 'createdAt',
    sortOrder:
      (searchParams.get('sortOrder') as 'asc' | 'desc') ??
      defaults?.sortOrder ??
      'desc',
  }), [searchParams, defaults]);

  const [searchInput, setSearchInput] = useState(state.search);

  const getFilter = useCallback(
    (key: string) => searchParams.get(key) ?? '',
    [searchParams],
  );

  const pushParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      const merged = { ...state, ...patch };
      const pageNum = Number(merged.page) || 1;
      if (pageNum <= 1) params.delete('page');
      else params.set('page', String(pageNum));
      const limitNum = Number(merged.limit) || DEFAULT_LIMIT;
      if (limitNum !== DEFAULT_LIMIT) params.set('limit', String(limitNum));
      else params.delete('limit');
      if (merged.search) params.set('search', merged.search);
      else params.delete('search');
      if (merged.sortBy && merged.sortBy !== 'createdAt') params.set('sortBy', merged.sortBy);
      else params.delete('sortBy');
      if (merged.sortOrder && merged.sortOrder !== 'desc') params.set('sortOrder', merged.sortOrder);
      else params.delete('sortOrder');
      Object.entries(patch).forEach(([k, v]) => {
        if (['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(k)) return;
        if (v != null && v !== '') params.set(k, String(v));
        else params.delete(k);
      });
      const qs = params.toString();
      router.push(qs ? `?${qs}` : '?', { scroll: false });
    },
    [router, searchParams, state],
  );

  const filterCount = useMemo(() => {
    let count = 0;
    searchParams.forEach((v, k) => {
      if (
        v &&
        !['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(k)
      ) {
        count += 1;
      }
    });
    return count;
  }, [searchParams]);

  return {
    ...state,
    searchInput,
    setSearchInput,
    getFilter,
    filterCount,
    pushParams,
    apiParams: {
      page: state.page,
      limit: state.limit,
      search: state.search || undefined,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    },
  };
}
