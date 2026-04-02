/**
 * Launch（启动台）相关类型定义
 *
 * V1 Story: 启动入口与对象选择。
 * V2 Story: 现场补齐上下文（LaunchContextEnvelope）。
 */

import type { ISO8601 } from './workUnit.types';
import type { FillInMethod } from './fillIn.types';

/** 启动会话状态 */
export type LaunchSessionStatus = 'active' | 'completed' | 'cancelled';

/** 启动会话 — 用户选择 Work Unit 后进入的启动上下文 */
export interface LaunchSession {
  /** 启动会话 ID */
  readonly sessionId: string;
  /** 选中的 Work Unit ID */
  readonly workUnitId: string;
  /** 使用的快照 ID（无快照时为 undefined，使用当前编辑版本） */
  readonly snapshotId?: string;
  /** 选择时间 */
  readonly selectedAt: ISO8601;
  /** 会话状态 */
  status: LaunchSessionStatus;
}

/** 最近使用记录 — 持久化到 IndexedDB */
export interface RecentLaunchRecord {
  /** 记录 ID（= workUnitId，每个 WU 只保留一条） */
  readonly id: string;
  /** Work Unit ID */
  readonly workUnitId: string;
  /** Work Unit 名称（冗余存储，避免 join） */
  workUnitName: string;
  /** 最后一次启动选择时间 */
  lastLaunchedAt: ISO8601;
}

// ---------------------------------------------------------------------------
// V2: 现场补齐上下文
// ---------------------------------------------------------------------------

/** 上下文完整性状态 */
export type ContextCompleteness = 'complete' | 'partial' | 'empty';

/** 逐 Slot 补齐状态（slotId → filled/empty） */
export type SlotFillStatus = Record<string, 'filled' | 'empty'>;

/**
 * 从 Slot + FillInDeclaration 提取的待补齐项视图（不持久化）。
 * 供 UI 与 hook 消费，不写入 IndexedDB。
 */
export interface FillInItem {
  /** 关联 Slot ID */
  readonly slotId: string;
  /** 关联 Slot 名称 */
  readonly slotName: string;
  /** 补齐方式 */
  readonly method: FillInMethod;
  /** 提示文本 */
  readonly hint?: string;
  /** 是否为必需 Slot */
  readonly required: boolean;
}

/**
 * 启动上下文信封 — 某次启动的现场上下文封装。
 *
 * 纯内存对象，V2 不持久化到 IndexedDB。
 * 后续 V5/O1 才决定是否写入持久化层。
 */
export interface LaunchContextEnvelope {
  /** 当前启动会话 ID */
  readonly sessionId: string;
  /** 所消费的快照 ID（无快照时为 undefined） */
  readonly snapshotId?: string;
  /** 任务目标 */
  taskGoal: string;
  /** 仓库/项目标识 */
  workspace: string;
  /** 相关文件路径列表 */
  files: string[];
  /** 附加说明 */
  additionalNotes: string;
  /** 逐 Slot 补齐状态 */
  slotFillStatus: SlotFillStatus;
  /** 整体完整性 */
  completeness: ContextCompleteness;
  /** 采集时间戳 */
  collectedAt: ISO8601;
}
