/**
 * useWorkUnits — Work Unit 列表管理 Hook
 *
 * 封装：列表查询、搜索过滤、排序切换、创建、删除。
 * 组件层通过此 hook 消费数据，不直接调用 Service。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService, type WorkUnitRecord, type SortField } from '../services/StorageService';

export interface UseWorkUnitsReturn {
  /** 过滤 + 排序后的列表 */
  workUnits: WorkUnitRecord[];
  /** 数据加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 搜索关键词 */
  searchQuery: string;
  /** 更新搜索关键词 */
  setSearchQuery: (query: string) => void;
  /** 当前排序字段 */
  sortBy: SortField;
  /** 切换排序字段 */
  setSortBy: (field: SortField) => void;
  /** 创建新 Work Unit */
  createWorkUnit: (name: string) => Promise<WorkUnitRecord>;
  /** 删除 Work Unit */
  deleteWorkUnit: (id: string) => Promise<void>;
  /** 手动刷新列表 */
  refresh: () => Promise<void>;
}

export function useWorkUnits(): UseWorkUnitsReturn {
  const [allWorkUnits, setAllWorkUnits] = useState<WorkUnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');

  const fetchWorkUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await StorageService.listWorkUnits({
        sortBy,
        sortDirection: 'desc',
      });
      setAllWorkUnits(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchWorkUnits();
  }, [fetchWorkUnits]);

  // 客户端模糊搜索过滤
  const workUnits = useMemo(() => {
    if (!searchQuery.trim()) return allWorkUnits;
    const q = searchQuery.toLowerCase();
    return allWorkUnits.filter((wu) => wu.name.toLowerCase().includes(q));
  }, [allWorkUnits, searchQuery]);

  const createWorkUnit = useCallback(
    async (name: string): Promise<WorkUnitRecord> => {
      const record = await StorageService.createWorkUnit(name);
      await fetchWorkUnits();
      return record;
    },
    [fetchWorkUnits],
  );

  const deleteWorkUnit = useCallback(
    async (id: string): Promise<void> => {
      await StorageService.deleteWorkUnit(id);
      await fetchWorkUnits();
    },
    [fetchWorkUnits],
  );

  return {
    workUnits,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    createWorkUnit,
    deleteWorkUnit,
    refresh: fetchWorkUnits,
  };
}
