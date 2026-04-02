/**
 * useLaunchSession — 启动会话数据加载 Hook
 *
 * V1 Story: 加载选中 Work Unit + 快照，遵守分层架构。
 * Component → Hook → Service → Dexie
 */

import { useState, useEffect, useCallback } from 'react';
import { StorageService, type WorkUnitRecord } from '../services/StorageService';
import { getHandoffReadiness, type HandoffStatus } from '../utils/promptGeneratorUtil';
import type { Slot } from '../types/slot.types';
import type { ConstraintPack } from '../types/constraint.types';

export interface LaunchSessionData {
  /** 显示用名称（快照优先） */
  name: string;
  /** 显示用描述 */
  description: string;
  /** 显示用 Slot 列表 */
  slots: Slot[];
  /** 显示用约束包列表 */
  constraints: ConstraintPack[];
  /** 交接准备状态 */
  handoffStatus: HandoffStatus;
  /** 是否使用快照 */
  usingSnapshot: boolean;
  /** 快照版本号（使用快照时） */
  snapshotVersionNumber?: number;
  /** 快照解析降级警告 */
  snapshotWarning?: string;
}

export interface UseLaunchSessionReturn {
  data: LaunchSessionData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLaunchSession(id: string | undefined): UseLaunchSessionReturn {
  const [data, setData] = useState<LaunchSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('无效的 Work Unit ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      const [wu, snapshot] = await Promise.all([
        StorageService.getWorkUnit(id),
        StorageService.getLatestSnapshot(id),
      ]);

      if (!wu) {
        setError('Work Unit 不存在');
        return;
      }

      let displayName = wu.name;
      let displayDesc = wu.description;
      let displaySlots = wu.slots;
      let displayConstraints = wu.constraints;
      let usingSnapshot = false;
      let snapshotVersionNumber: number | undefined;
      let snapshotWarning: string | undefined;

      if (snapshot) {
        try {
          const content = JSON.parse(snapshot.content);
          // 基本结构校验
          if (content && typeof content === 'object' && Array.isArray(content.slots)) {
            displayName = content.name ?? wu.name;
            displayDesc = content.description ?? wu.description;
            displaySlots = content.slots;
            displayConstraints = content.constraints ?? wu.constraints;
            usingSnapshot = true;
            snapshotVersionNumber = snapshot.versionNumber;
          } else {
            snapshotWarning = '快照内容结构异常，已降级使用当前编辑版本';
          }
        } catch {
          snapshotWarning = '快照数据解析失败，已降级使用当前编辑版本';
        }
      }

      const handoffWu: WorkUnitRecord = {
        ...wu,
        name: displayName,
        description: displayDesc,
        slots: displaySlots,
        constraints: displayConstraints,
      };

      setData({
        name: displayName,
        description: displayDesc,
        slots: displaySlots,
        constraints: displayConstraints,
        handoffStatus: getHandoffReadiness(handoffWu),
        usingSnapshot,
        snapshotVersionNumber,
        snapshotWarning,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { data, loading, error, refresh: fetchSession };
}
