/**
 * useLaunchContext — 上下文补齐状态管理 Hook
 *
 * V2 Story: 现场补齐上下文。
 * Component → Hook → Util（不涉及 Service/Dexie 层）。
 *
 * 纯内存状态，离开页面即丢失。
 */

import { useState, useMemo, useCallback } from 'react';
import type { Slot } from '../types/slot.types';
import type {
  FillInItem,
  ContextCompleteness,
  SlotFillStatus,
  LaunchContextEnvelope,
} from '../types/launch.types';
import {
  extractFillInItems,
  computeCompleteness,
  computeSlotFillStatus,
  getMissingRequiredItems,
} from '../utils/contextEnvelopeUtil';

export interface UseLaunchContextReturn {
  /** 待补齐项列表 */
  fillInItems: FillInItem[];
  /** 整体完整性 */
  completeness: ContextCompleteness;
  /** 缺失的必需项 */
  missingRequired: FillInItem[];
  /** 逐 Slot 补齐状态 */
  slotFillStatus: SlotFillStatus;
  /** 当前任务目标 */
  taskGoal: string;
  /** 当前仓库/项目 */
  workspace: string;
  /** 当前相关文件 */
  files: string[];
  /** 当前附加说明 */
  additionalNotes: string;
  /** 设置任务目标 */
  setTaskGoal: (v: string) => void;
  /** 设置仓库/项目 */
  setWorkspace: (v: string) => void;
  /** 添加文件 */
  addFile: (path: string) => void;
  /** 删除文件 */
  removeFile: (path: string) => void;
  /** 设置附加说明 */
  setAdditionalNotes: (v: string) => void;
  /** 构建最终 envelope 快照 */
  buildEnvelope: () => LaunchContextEnvelope;
}

export function useLaunchContext(
  slots: Slot[],
  sessionId: string,
  snapshotId?: string,
): UseLaunchContextReturn {
  const [taskGoal, setTaskGoal] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // 提取待补齐项（仅在 slots 变化时重算）
  const fillInItems = useMemo(() => extractFillInItems(slots), [slots]);

  // 构造 partial envelope 用于计算（每次输入变化时重算）
  const partialEnvelope = useMemo(
    () => ({ taskGoal, workspace, files, additionalNotes }),
    [taskGoal, workspace, files, additionalNotes],
  );

  const completeness = useMemo(
    () => computeCompleteness(fillInItems, partialEnvelope),
    [fillInItems, partialEnvelope],
  );

  const missingRequired = useMemo(
    () => getMissingRequiredItems(fillInItems, partialEnvelope),
    [fillInItems, partialEnvelope],
  );

  const slotFillStatus = useMemo(
    () => computeSlotFillStatus(fillInItems, partialEnvelope),
    [fillInItems, partialEnvelope],
  );

  const addFile = useCallback((path: string) => {
    const trimmed = path.trim();
    if (trimmed.length === 0) return;
    setFiles((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const removeFile = useCallback((path: string) => {
    setFiles((prev) => prev.filter((f) => f !== path));
  }, []);

  const buildEnvelope = useCallback((): LaunchContextEnvelope => {
    const currentStatus = computeSlotFillStatus(fillInItems, partialEnvelope);
    const currentCompleteness = computeCompleteness(fillInItems, partialEnvelope);
    return {
      sessionId,
      snapshotId,
      taskGoal,
      workspace,
      files,
      additionalNotes,
      slotFillStatus: currentStatus,
      completeness: currentCompleteness,
      collectedAt: new Date().toISOString(),
    };
  }, [sessionId, snapshotId, taskGoal, workspace, files, additionalNotes, fillInItems, partialEnvelope]);

  return {
    fillInItems,
    completeness,
    missingRequired,
    slotFillStatus,
    taskGoal,
    workspace,
    files,
    additionalNotes,
    setTaskGoal,
    setWorkspace,
    addFile,
    removeFile,
    setAdditionalNotes,
    buildEnvelope,
  };
}
