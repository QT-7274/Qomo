/**
 * useLaunchPanel — 启动面板状态管理 Hook
 *
 * V1 Story: 启动入口与对象选择。
 * 提供：Work Unit 列表（含交接状态）、最近使用、搜索过滤、选择 Work Unit。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService, type WorkUnitRecord, type WorkUnitVersionRecord } from '../services/StorageService';
import type { RecentLaunchRecord, LaunchSession } from '../types/launch.types';
import type { ISO8601 } from '../types/workUnit.types';
import { getHandoffReadiness, type HandoffStatus } from '../utils/promptGeneratorUtil';

/** Work Unit 列表条目（附带交接状态） */
export interface LaunchWorkUnitItem {
  id: string;
  name: string;
  description: string;
  updatedAt: ISO8601;
  handoffStatus: HandoffStatus;
  hasSnapshot: boolean;
}

export interface UseLaunchPanelReturn {
  /** 所有 Work Unit（已过滤+已计算状态） */
  workUnits: LaunchWorkUnitItem[];
  /** 最近使用记录 */
  recentLaunches: RecentLaunchRecord[];
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 搜索关键词 */
  searchQuery: string;
  /** 设置搜索关键词 */
  setSearchQuery: (query: string) => void;
  /** 选择 Work Unit 并创建 LaunchSession */
  selectWorkUnit: (workUnitId: string) => Promise<LaunchSession>;
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ls_${crypto.randomUUID()}`;
  }
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10).padEnd(8, '0');
  return `ls_${ts}_${rand}`;
}

export function useLaunchPanel(): UseLaunchPanelReturn {
  const [allWorkUnits, setAllWorkUnits] = useState<WorkUnitRecord[]>([]);
  const [snapshotMap, setSnapshotMap] = useState<Map<string, WorkUnitVersionRecord>>(new Map());
  const [recentLaunches, setRecentLaunches] = useState<RecentLaunchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [wuList, recents] = await Promise.all([
        StorageService.listWorkUnits({ sortBy: 'updatedAt', sortDirection: 'desc' }),
        StorageService.listRecentLaunches(5),
      ]);

      // 批量获取最新快照
      const snapMap = new Map<string, WorkUnitVersionRecord>();
      await Promise.all(
        wuList.map(async (wu) => {
          const snap = await StorageService.getLatestSnapshot(wu.id);
          if (snap) snapMap.set(wu.id, snap);
        }),
      );

      setAllWorkUnits(wuList);
      setSnapshotMap(snapMap);
      setRecentLaunches(recents);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 过滤后的 Work Unit 列表（附带状态） */
  const workUnits: LaunchWorkUnitItem[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allWorkUnits
      .filter((wu) => !query || wu.name.toLowerCase().includes(query))
      .map((wu) => ({
        id: wu.id,
        name: wu.name,
        description: wu.description,
        updatedAt: wu.updatedAt,
        handoffStatus: getHandoffReadiness(wu),
        hasSnapshot: snapshotMap.has(wu.id),
      }));
  }, [allWorkUnits, snapshotMap, searchQuery]);

  /** 选择 Work Unit */
  const selectWorkUnit = useCallback(async (workUnitId: string): Promise<LaunchSession> => {
    const wu = allWorkUnits.find((w) => w.id === workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    // 记录最近使用
    await StorageService.recordRecentLaunch(workUnitId, wu.name);

    // 获取最新快照
    const snapshot = snapshotMap.get(workUnitId);

    const session: LaunchSession = {
      sessionId: generateSessionId(),
      workUnitId,
      snapshotId: snapshot?.id,
      selectedAt: new Date().toISOString(),
      status: 'active',
    };

    // 刷新最近使用列表
    const recents = await StorageService.listRecentLaunches(5);
    setRecentLaunches(recents);

    return session;
  }, [allWorkUnits, snapshotMap]);

  return {
    workUnits,
    recentLaunches,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectWorkUnit,
  };
}
