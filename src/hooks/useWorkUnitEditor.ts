/**
 * useWorkUnitEditor — 单个 Work Unit 编辑 Hook
 *
 * W2a Story: 封装 Work Unit 加载、编辑信息、Slot CRUD、Capability CRUD、复制。
 *
 * 组件层通过此 hook 消费，不直接调用 StorageService。
 */

import { useState, useEffect, useCallback } from 'react';
import { StorageService, type WorkUnitRecord } from '../services/StorageService';
import type { SlotType } from '../types/slot.types';

export interface UseWorkUnitEditorReturn {
  /** 当前 Work Unit 数据 */
  workUnit: WorkUnitRecord | null;
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 更新基本信息（名称、描述） */
  updateInfo: (updates: { name?: string; description?: string }) => Promise<void>;
  /** 添加 Slot */
  addSlot: (params: {
    name: string;
    slotType: SlotType;
    description?: string;
    required: boolean;
  }) => Promise<void>;
  /** 更新 Slot */
  updateSlot: (slotId: string, params: {
    name?: string;
    slotType?: SlotType;
    description?: string;
    required?: boolean;
  }) => Promise<void>;
  /** 删除 Slot */
  deleteSlot: (slotId: string) => Promise<void>;
  /** 添加 Capability */
  addCapability: (slotId: string, params: {
    name: string;
    content: string;
  }) => Promise<void>;
  /** 更新 Capability */
  updateCapability: (slotId: string, capabilityId: string, params: {
    name?: string;
    content?: string;
  }) => Promise<void>;
  /** 删除 Capability */
  deleteCapability: (slotId: string, capabilityId: string) => Promise<void>;
  /** 重排 Capability */
  reorderCapabilities: (slotId: string, orderedIds: string[]) => Promise<void>;
  /** 复制 Work Unit，返回新 ID */
  cloneWorkUnit: () => Promise<string>;
}

export function useWorkUnitEditor(id: string | undefined): UseWorkUnitEditorReturn {
  const [workUnit, setWorkUnit] = useState<WorkUnitRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkUnit = useCallback(async () => {
    if (!id) {
      setWorkUnit(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const record = await StorageService.getWorkUnit(id);
      setWorkUnit(record ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkUnit();
  }, [fetchWorkUnit]);

  const updateInfo = useCallback(async (updates: { name?: string; description?: string }) => {
    if (!id) return;
    await StorageService.updateWorkUnitInfo(id, updates);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const addSlot = useCallback(async (params: {
    name: string;
    slotType: SlotType;
    description?: string;
    required: boolean;
  }) => {
    if (!id) return;
    await StorageService.addSlot(id, params);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const updateSlot = useCallback(async (slotId: string, params: {
    name?: string;
    slotType?: SlotType;
    description?: string;
    required?: boolean;
  }) => {
    if (!id) return;
    await StorageService.updateSlot(id, slotId, params);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const deleteSlot = useCallback(async (slotId: string) => {
    if (!id) return;
    await StorageService.deleteSlot(id, slotId);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const addCapability = useCallback(async (slotId: string, params: {
    name: string;
    content: string;
  }) => {
    if (!id) return;
    await StorageService.addCapability(id, slotId, params);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const updateCapability = useCallback(async (
    slotId: string,
    capabilityId: string,
    params: { name?: string; content?: string },
  ) => {
    if (!id) return;
    await StorageService.updateCapability(id, slotId, capabilityId, params);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const deleteCapability = useCallback(async (slotId: string, capabilityId: string) => {
    if (!id) return;
    await StorageService.deleteCapability(id, slotId, capabilityId);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const reorderCapabilities = useCallback(async (slotId: string, orderedIds: string[]) => {
    if (!id) return;
    await StorageService.reorderCapabilities(id, slotId, orderedIds);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const cloneWorkUnit = useCallback(async (): Promise<string> => {
    if (!id) throw new Error('无 Work Unit ID');
    const cloned = await StorageService.cloneWorkUnit(id);
    return cloned.id;
  }, [id]);

  return {
    workUnit,
    loading,
    error,
    refresh: fetchWorkUnit,
    updateInfo,
    addSlot,
    updateSlot,
    deleteSlot,
    addCapability,
    updateCapability,
    deleteCapability,
    reorderCapabilities,
    cloneWorkUnit,
  };
}
